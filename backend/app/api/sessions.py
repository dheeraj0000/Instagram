from datetime import datetime, date, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.session import Session as SessionModel
from app.models.daily_summary import DailySummary
from app.schemas.session import (
    SessionStartRequest,
    SessionEndRequest,
    SessionResponse,
    SessionListResponse,
)

# Prefix is empty so paths match the public API exactly, e.g.:
# - POST /session/start
# - POST /session/end
# - GET  /sessions
# - GET  /session/active
router = APIRouter(tags=["sessions"])


def _ensure_utc_aware(dt: datetime) -> datetime:
    """
    Make a datetime UTC-aware.

    Backward compatible with previously stored naive datetimes (assumed UTC).
    """
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _local_date_from_utc(now_utc: datetime, tz_offset_minutes: Optional[int]) -> date:
    """
    Compute client-local calendar date using provided offset (minutes east of UTC).
    If no offset is provided, fall back to UTC date.
    """
    if tz_offset_minutes is None:
        return now_utc.date()
    return (now_utc + timedelta(minutes=int(tz_offset_minutes))).date()


@router.post("/session/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    payload: SessionStartRequest, db: Session = Depends(get_db)
) -> SessionResponse:
    """
    Start a new Instagram session.

    Rules:
    - Only one active session (end_time is NULL) is allowed at a time.
    """
    existing_active = (
        db.query(SessionModel)
        .filter(SessionModel.end_time.is_(None))
        .order_by(SessionModel.start_time.desc())
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A session is already active. End it before starting a new one.",
        )

    now_utc = datetime.now(timezone.utc)
    session = SessionModel(
        start_time=now_utc,
        end_time=None,
        duration_minutes=None,
        reels_watched=None,
        mood=None,
        date=_local_date_from_utc(now_utc, payload.tz_offset_minutes),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/session/end", response_model=SessionResponse)
def end_session(payload: SessionEndRequest, db: Session = Depends(get_db)) -> SessionResponse:
    """
    End an existing active session.

    - Calculates duration in whole minutes.
    - Updates daily summary (upsert behavior).
    """
    session: Optional[SessionModel] = (
        db.query(SessionModel).filter(SessionModel.id == payload.session_id).first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    if session.end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already ended.",
        )

    now_utc = datetime.now(timezone.utc)
    start_utc = _ensure_utc_aware(session.start_time)
    duration_minutes = int((now_utc - start_utc).total_seconds() // 60)
    if duration_minutes < 0:
        # Defensive check; should not happen with system clock moving backwards.
        duration_minutes = 0

    session.end_time = now_utc
    session.duration_minutes = duration_minutes
    session.reels_watched = payload.reels_watched
    session.mood = payload.mood

    # Ensure date is set from start_time if missing.
    session.date = session.date or start_utc.date()

    # Update or create daily summary.
    summary_date = session.date
    daily_summary: Optional[DailySummary] = (
        db.query(DailySummary)
        .filter(DailySummary.summary_date == summary_date)
        .with_for_update(of=DailySummary)
        .first()
    )

    reels_delta = payload.reels_watched or 0
    minutes_delta = duration_minutes or 0

    if daily_summary:
        daily_summary.total_sessions += 1
        daily_summary.total_reels += reels_delta
        daily_summary.total_minutes += minutes_delta
    else:
        daily_summary = DailySummary(
            summary_date=summary_date,
            total_sessions=1,
            total_reels=reels_delta,
            total_minutes=minutes_delta,
        )
        db.add(daily_summary)

    db.commit()
    db.refresh(session)
    return session


@router.get("/session/active", response_model=Optional[SessionResponse])
def get_active_session(db: Session = Depends(get_db)) -> Optional[SessionResponse]:
    """
    Return the currently active session if any, otherwise null.
    Useful for the frontend to restore state across reloads.
    """
    active = (
        db.query(SessionModel)
        .filter(SessionModel.end_time.is_(None))
        .order_by(SessionModel.start_time.desc())
        .first()
    )
    return active


@router.get("/sessions", response_model=SessionListResponse)
def list_sessions(
    date_filter: Optional[date] = None, db: Session = Depends(get_db)
) -> SessionListResponse:
    """
    List sessions.

    - If `date_filter` is provided, returns sessions for that calendar date.
    - Otherwise, returns all sessions (for an MVP-scale single user this is fine).
    """
    query = db.query(SessionModel).order_by(SessionModel.start_time.desc())
    if date_filter:
        query = query.filter(SessionModel.date == date_filter)
    sessions = query.all()
    return SessionListResponse(sessions=sessions)

