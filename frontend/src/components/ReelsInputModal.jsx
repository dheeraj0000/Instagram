import React, { useMemo, useState } from "react";

const MOODS = ["Bored", "Stressed", "Relaxed", "Happy"];

function ReelsInputModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  estimate
}) {
  const [mood, setMood] = useState("");

  const estimateText = useMemo(() => {
    if (!estimate) return "";
    const mins = Math.max(0, Math.round((estimate.durationSeconds || 0) / 60));
    return `${estimate.estimatedReels} reels (estimated) • ${mins} min`;
  }, [estimate]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ mood: mood || null });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">End session</div>
        <div className="modal-subtitle">
          We’ll auto-estimate reels watched from duration.
        </div>

        {estimateText && (
          <div className="pill pill--info" style={{ marginTop: 12 }}>
            {estimateText}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
          <div className="field">
            <label className="label">Mood (optional)</label>
            <select
              className="select"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="">Select mood</option>
              {MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReelsInputModal;

