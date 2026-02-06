## Instagram Usage Tracker (Manual Reels Tracking)

A small, production-ready MVP for tracking personal Instagram Reels usage using **manual session logging**. Built with **FastAPI + SQLite** on the backend and **React + Vite** on the frontend.

### Backend (FastAPI)

- **Tech**: FastAPI, SQLAlchemy, SQLite (easily swappable to Postgres via `DATABASE_URL`).
- **Models**:
  - `User` (placeholder for future multi-user support).
  - `Session`: per-usage session with start/end times, duration, reels watched, mood, and date.
  - `DailySummary`: aggregated metrics per day (`total_sessions`, `total_reels`, `total_minutes`).
- **Key endpoints**:
  - `POST /session/start`: starts a new session. Enforces a single active session at a time.
  - `POST /session/end`: ends a session, computes duration, updates daily summary.
  - `GET /session/active`: returns current active session (or `null`).
  - `GET /sessions?date=`: list sessions, optionally filtered by date.
  - `GET /summary/daily`: daily summaries (defaults to last 30 days).
  - `GET /summary/weekly`: weekly aggregates.
  - `GET /summary/monthly`: monthly aggregates.
  - `GET /summary/streaks`: current and longest tracking streaks (days with ≥1 session).

#### Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Optional: set a custom DB
export DATABASE_URL="sqlite:///./instagram_tracker.db"

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

FastAPI docs will be available at `http://localhost:8000/docs`.

### Frontend (React + Vite)

- **Pages**:
  - `Tracker`: start/end Instagram sessions, with reels count and mood input.
  - `Dashboard`: daily/weekly/monthly analytics, streaks, and summary cards.
- **Charts**: built with Recharts (bar chart for reels/day, line chart for minutes/day).
- **UX rules**:
  - Disable **Start** if a session is active.
  - Disable **End** if no active session.
  - On **Start**, frontend calls `/session/start` then redirects to `https://www.instagram.com/reels/`.
  - On load, frontend checks `/session/active` to restore active session state.

#### Frontend setup

```bash
cd frontend
npm install

# Configure backend URL as needed (default is http://localhost:8000)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

npm run dev
```

Then open `http://localhost:3000`.

### Future-ready design

- Database access and business logic are separated from the web layer so you can:
  - Add **AI-based habit analysis** on top of the `DailySummary` and `Session` data.
  - Implement **notifications/nudges** based on streaks and overuse patterns.
  - Expose the same APIs to a future **mobile app** client.

### Possible future improvements

- Add authentication and real multi-user support.
- Switch to PostgreSQL in production with migrations (Alembic).
- Add richer mood and context tagging (time of day, device, etc.).
- Introduce background jobs to compute heavier analytics or AI insights.
- Add tests (unit + API) and CI.

