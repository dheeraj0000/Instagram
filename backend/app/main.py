from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import sessions, summaries
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine


def create_app() -> FastAPI:
    settings = get_settings()

    # Create DB tables on startup for MVP. In production we would
    # prefer migrations (Alembic), but this keeps setup lightweight.
    Base.metadata.create_all(bind=engine)

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
    )

    # CORS - allow frontend (e.g., React dev server on localhost:3000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # can be tightened later
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers
    app.include_router(sessions.router)
    app.include_router(summaries.router)

    return app


app = create_app()

