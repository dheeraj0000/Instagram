from datetime import datetime, date

from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.orm import relationship

from app.db.base import Base


class Session(Base):
    """Instagram usage session."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # reserved for multi-user future
    # Store as timezone-aware UTC datetimes. SQLite won't enforce timezone, but
    # Pydantic serialization will include an offset when tzinfo is present.
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True)
    reels_watched = Column(Integer, nullable=True)
    mood = Column(String, nullable=True)
    date = Column(Date, nullable=False, index=True)


