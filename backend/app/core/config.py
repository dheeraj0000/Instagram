import os
from functools import lru_cache


class Settings:
    """Application configuration loaded from environment variables.

    Designed so we can later switch to Postgres or add more services
    without touching business logic.
    """

    APP_NAME: str = "Instagram Usage Tracker"
    APP_VERSION: str = "0.1.0"

    # For MVP we use SQLite; DSN is still configurable via env
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./instagram_tracker.db"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


