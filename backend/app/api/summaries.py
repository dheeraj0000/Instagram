from datetime import date, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.daily_summary import DailySummary
from app.schemas.summary import (
    DailySummaryResponse,
    DailySummaryListResponse,
    WeeklySummaryItem,
    WeeklySummaryListResponse,
    MonthlySummaryItem,
    MonthlySummaryListResponse,
    StreaksResponse,
)

router = APIRouter(prefix="/summary", tags=["summaries"])


def _default_date_range() -> Tuple[date, date]:
    """Default date range for daily summaries: last 30 days including today."""
    today = date.today()
    start = today - timedelta(days=29)
    return start, today


@router.get("/daily", response_model=DailySummaryListResponse)
def get_daily_summaries(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
) -> DailySummaryListResponse:
    """
    Return daily summaries for a date range.

    - If no range is provided, last 30 days are returned.
    """
    if not start_date or not end_date:
        start_date, end_date = _default_date_range()

    items: List[DailySummary] = (
        db.query(DailySummary)
        .filter(DailySummary.summary_date >= start_date)
        .filter(DailySummary.summary_date <= end_date)
        .order_by(DailySummary.summary_date.asc())
        .all()
    )

    response_items = [
        DailySummaryResponse(
            date=it.summary_date,
            total_sessions=it.total_sessions,
            total_reels=it.total_reels,
            total_minutes=it.total_minutes,
        )
        for it in items
    ]
    return DailySummaryListResponse(items=response_items)


@router.get("/weekly", response_model=WeeklySummaryListResponse)
def get_weekly_summaries(db: Session = Depends(get_db)) -> WeeklySummaryListResponse:
    """
    Aggregate daily summaries into ISO weeks.

    Returns the last 8 weeks including the current week.
    """
    today = date.today()
    start_date = today - timedelta(weeks=7, days=today.weekday())

    # Group by ISO year and week for correctness around year boundaries.
    rows = (
        db.query(
            func.strftime("%Y", DailySummary.summary_date).label("year"),
            func.strftime("%W", DailySummary.summary_date).label("week"),
            func.min(DailySummary.summary_date),
            func.max(DailySummary.summary_date),
            func.sum(DailySummary.total_sessions),
            func.sum(DailySummary.total_reels),
            func.sum(DailySummary.total_minutes),
        )
        .filter(DailySummary.summary_date >= start_date)
        .group_by("year", "week")
        .order_by("year", "week")
        .all()
    )

    items: List[WeeklySummaryItem] = []
    for year, week, start_d, end_d, sessions, reels, minutes in rows:
        items.append(
            WeeklySummaryItem(
                year=int(year),
                week=int(week),
                start_date=start_d,
                end_date=end_d,
                total_sessions=sessions or 0,
                total_reels=reels or 0,
                total_minutes=minutes or 0,
            )
        )
    return WeeklySummaryListResponse(items=items)


@router.get("/monthly", response_model=MonthlySummaryListResponse)
def get_monthly_summaries(db: Session = Depends(get_db)) -> MonthlySummaryListResponse:
    """
    Aggregate daily summaries into months.

    Returns the last 6 months including the current month.
    """
    today = date.today()
    six_months_ago = (today.replace(day=1) - timedelta(days=180)).replace(day=1)

    rows = (
        db.query(
            func.strftime("%Y", DailySummary.summary_date).label("year"),
            func.strftime("%m", DailySummary.summary_date).label("month"),
            func.min(DailySummary.summary_date),
            func.max(DailySummary.summary_date),
            func.sum(DailySummary.total_sessions),
            func.sum(DailySummary.total_reels),
            func.sum(DailySummary.total_minutes),
        )
        .filter(DailySummary.summary_date >= six_months_ago)
        .group_by("year", "month")
        .order_by("year", "month")
        .all()
    )

    items: List[MonthlySummaryItem] = []
    for year, month, start_d, end_d, sessions, reels, minutes in rows:
        items.append(
            MonthlySummaryItem(
                year=int(year),
                month=int(month),
                start_date=start_d,
                end_date=end_d,
                total_sessions=sessions or 0,
                total_reels=reels or 0,
                total_minutes=minutes or 0,
            )
        )
    return MonthlySummaryListResponse(items=items)


@router.get("/streaks", response_model=StreaksResponse)
def get_streaks(db: Session = Depends(get_db)) -> StreaksResponse:
    """
    Compute current and longest streaks (in days) with at least one session.
    """
    rows = (
        db.query(DailySummary.summary_date)
        .filter(DailySummary.total_sessions > 0)
        .order_by(DailySummary.summary_date.asc())
        .all()
    )
    dates = [r[0] for r in rows]

    longest = 0
    current = 0
    today = date.today()

    if not dates:
        return StreaksResponse(current_streak=0, longest_streak=0)

    streak = 1
    longest = 1
    for i in range(1, len(dates)):
        if dates[i] == dates[i - 1] + timedelta(days=1):
            streak += 1
        else:
            if streak > longest:
                longest = streak
            streak = 1

    if streak > longest:
        longest = streak

    # Current streak is the length of the streak ending today, if any.
    current = 0
    streak = 1
    for i in range(1, len(dates)):
        if dates[i] == dates[i - 1] + timedelta(days=1):
            streak += 1
        else:
            streak = 1
    if dates and dates[-1] == today:
        current = streak

    return StreaksResponse(current_streak=current, longest_streak=longest)

