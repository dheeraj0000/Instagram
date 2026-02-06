from sqlalchemy import Column, Integer, String

from app.db.base import Base


class User(Base):
    """Single-user MVP model; structure allows multi-user in future."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)


