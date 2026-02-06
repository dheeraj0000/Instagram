import axios from "axios";

// Backend base URL; configure via Vite env for flexibility.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Session-related API calls
export async function startSession() {
  // Send timezone offset so backend can compute the correct local date.
  // We send minutes east of UTC (IST = +330).
  const tzOffsetMinutesEast = -new Date().getTimezoneOffset();
  const res = await api.post("/session/start", {
    tz_offset_minutes: tzOffsetMinutesEast
  });
  return res.data;
}

export async function endSession({ sessionId, reelsWatched, mood }) {
  const res = await api.post("/session/end", {
    session_id: sessionId,
    reels_watched: reelsWatched,
    mood
  });
  return res.data;
}

export async function getActiveSession() {
  const res = await api.get("/session/active");
  return res.data;
}

export async function getDailySummaries() {
  const res = await api.get("/summary/daily");
  return res.data;
}

export async function getWeeklySummaries() {
  const res = await api.get("/summary/weekly");
  return res.data;
}

export async function getMonthlySummaries() {
  const res = await api.get("/summary/monthly");
  return res.data;
}

export async function getStreaks() {
  const res = await api.get("/summary/streaks");
  return res.data;
}

