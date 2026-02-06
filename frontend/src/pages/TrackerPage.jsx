import React, { useEffect, useMemo, useState } from "react";
import {
  startSession,
  endSession,
  getActiveSession
} from "../api/client";
import ReelsInputModal from "../components/ReelsInputModal";

function getStoredAvgSecondsPerReel() {
  const raw = localStorage.getItem("avgSecondsPerReel");
  const v = raw ? Number(raw) : 8;
  return Number.isFinite(v) && v >= 3 && v <= 30 ? v : 8;
}

function parseApiDatetime(value) {
  if (!value) return null;
  // If the backend sends timezone info, normal parsing works.
  const hasTimezone = /([zZ]|[+\-]\d{2}:\d{2})$/.test(value);
  return hasTimezone ? new Date(value) : new Date(`${value}Z`); // legacy: assume UTC
}

function TrackerPage() {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avgSecondsPerReel, setAvgSecondsPerReel] = useState(() =>
    getStoredAvgSecondsPerReel()
  );

  useEffect(() => {
    // On load, check if a backend session is already active.
    getActiveSession()
      .then((data) => setActiveSession(data))
      .catch(() => {});
  }, []);

  async function handleStart() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const session = await startSession();
      setActiveSession(session);
      setSuccess("Session started. Redirecting you to Instagram Reels...");
      // Redirect user to Instagram Reels.
      window.location.href = "https://www.instagram.com/reels/";
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to start session.");
    } finally {
      setLoading(false);
    }
  }

  function handleEndClick() {
    setModalOpen(true);
  }

  const estimate = useMemo(() => {
    if (!activeSession) return null;
    const startDate = parseApiDatetime(activeSession.start_time);
    const startMs = startDate ? startDate.getTime() : Date.now();
    const nowMs = Date.now();
    const durationSeconds = Math.max(0, Math.round((nowMs - startMs) / 1000));
    const estimatedReels = Math.max(
      0,
      Math.round(durationSeconds / Math.max(1, avgSecondsPerReel))
    );
    return { durationSeconds, estimatedReels };
  }, [activeSession, avgSecondsPerReel]);

  useEffect(() => {
    localStorage.setItem("avgSecondsPerReel", String(avgSecondsPerReel));
  }, [avgSecondsPerReel]);

  async function handleModalSubmit({ mood }) {
    if (!activeSession) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await endSession({
        sessionId: activeSession.id,
        reelsWatched: estimate?.estimatedReels ?? 0,
        mood
      });
      setModalOpen(false);
      setActiveSession(null);
      setSuccess("Session saved. Nice work tracking your usage today.");
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to end session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero__content">
          <div className="hero__badge">Manual Tracking MVP</div>
          <h1 className="hero__title">Instagram Reels Session Tracker</h1>
          <p className="hero__subtitle">
            Start a session, watch Reels in Instagram, come back and end it. We’ll
            estimate reels watched from session duration (no typing).
          </p>

          <div className="hero__actions">
            <button
              className="btn btn--primary"
              onClick={handleStart}
              disabled={!!activeSession || loading}
            >
              {activeSession ? "Session running" : "Start Instagram Session"}
            </button>
            <button
              className="btn btn--soft"
              onClick={handleEndClick}
              disabled={!activeSession || loading}
            >
              End Session
            </button>
          </div>

          <div className="hero__meta">
            {activeSession ? (
              <div className="pill pill--success">
                Active • Started{" "}
                {parseApiDatetime(activeSession.start_time)?.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            ) : (
              <div className="pill pill--neutral">No active session</div>
            )}
            {activeSession && estimate && (
              <div className="pill pill--info">
                Est. {estimate.estimatedReels} reels so far
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="card card--gradient">
        <div className="card__title">Estimation setting</div>
        <div className="card__subtitle">
          We estimate reels watched as: duration ÷ avg seconds per reel.
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <div className="field-row">
            <label className="label" htmlFor="avgSeconds">
              Avg seconds per reel
            </label>
            <div className="value">{avgSecondsPerReel}s</div>
          </div>
          <input
            id="avgSeconds"
            type="range"
            min={3}
            max={30}
            value={avgSecondsPerReel}
            onChange={(e) => setAvgSecondsPerReel(Number(e.target.value))}
            className="range"
          />
          <div className="hint">
            Tip: set this once to match your scrolling speed.
          </div>
        </div>
      </section>

      {(error || success) && (
        <section className="stack-sm">
          {error && <div className="alert alert--error">{error}</div>}
          {success && <div className="alert alert--success">{success}</div>}
        </section>
      )}

      <ReelsInputModal
        isOpen={modalOpen}
        onClose={() => !loading && setModalOpen(false)}
        onSubmit={handleModalSubmit}
        loading={loading}
        estimate={estimate}
      />
    </div>
  );
}

export default TrackerPage;

