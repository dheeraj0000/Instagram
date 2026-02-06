from datetime import date
from typing import List

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    date: date
    total_sessions: int
    total_reels: int
    total_minutes: int

    class Config:
        orm_mode = True


class DailySummaryListResponse(BaseModel):
    items: List[DailySummaryResponse]


class WeeklySummaryItem(BaseModel):
    year: int
    week: int
    start_date: date
    end_date: date
    total_sessions: int
    total_reels: int
    total_minutes: int


class WeeklySummaryListResponse(BaseModel):
    items: List[WeeklySummaryItem]


class MonthlySummaryItem(BaseModel):
    year: int
    month: int
    start_date: date
    end_date: date
    total_sessions: int
    total_reels: int
    total_minutes: int


class MonthlySummaryListResponse(BaseModel):
    items: List[MonthlySummaryItem]


class StreaksResponse(BaseModel):
    current_streak: int
    longest_streak: int

from datetime import date
from typing import List

from pydantic import BaseModel


class DailySummaryResponse(BaseModel):
    date: date
    total_sessions: int
    total_reels: int
    total_minutes: int

    class Config:
        orm_mode = True


class DailySummaryListResponse(BaseModel):
    items: List[DailySummaryResponse]


class StreaksResponse(BaseModel):
    current_streak: int
    longest_streak: int


