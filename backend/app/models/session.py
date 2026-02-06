from datetime import datetime, date

from sqlalchemy import Column, Integer, String, DateTime, Date
from sqlalchemy.orm import relationship

from app.db.base import Base


class Session(Base):
    """Instagram usage session."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)  # reserved for multi-user future
    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True)
    reels_watched = Column(Integer, nullable=True)
    mood = Column(String, nullable=True)
    date = Column(Date, nullable=False, index=True)


