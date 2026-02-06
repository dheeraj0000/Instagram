from datetime import date

from sqlalchemy import Column, Integer, Date, UniqueConstraint

from app.db.base import Base


class DailySummary(Base):
    """Aggregated metrics per day for fast analytics."""

    __tablename__ = "daily_summaries"

    id = Column(Integer, primary_key=True, index=True)
    summary_date = Column("date", Date, nullable=False, unique=True, index=True)
    total_sessions = Column(Integer, nullable=False, default=0)
    total_reels = Column(Integer, nullable=False, default=0)
    total_minutes = Column(Integer, nullable=False, default=0)

    __table_args__ = (UniqueConstraint("date", name="uq_daily_summary_date"),)


