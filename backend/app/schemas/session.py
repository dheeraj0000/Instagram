from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, Field, conint


class SessionBase(BaseModel):
    reels_watched: Optional[conint(ge=0)] = Field(
        default=None, description="Approximate reels watched in this session"
    )
    mood: Optional[str] = Field(
        default=None,
        description="Optional mood label like Bored / Stressed / Relaxed / Happy",
    )


class SessionStartRequest(BaseModel):
    """Payload for starting a new session. For now no inputs are required."""

    # In future we could send device info, context, etc.
    pass


class SessionEndRequest(SessionBase):
    """Payload for ending a session."""

    session_id: int = Field(..., description="ID of the active session to end")


class SessionResponse(SessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    date: date

    class Config:
        orm_mode = True


class SessionListResponse(BaseModel):
    sessions: List[SessionResponse]


