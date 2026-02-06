import React, { useEffect, useMemo, useState } from "react";
import {
  getDailySummaries,
  getWeeklySummaries,
  getMonthlySummaries,
  getStreaks
} from "../api/client";
import StatsCard from "../components/StatsCard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function DashboardPage() {
  const [daily, setDaily] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [streaks, setStreaks] = useState({ current_streak: 0, longest_streak: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [d, w, m, s] = await Promise.all([
          getDailySummaries(),
          getWeeklySummaries(),
          getMonthlySummaries(),
          getStreaks()
        ]);
        setDaily(d.items || []);
        setWeekly(w.items || []);
        setMonthly(m.items || []);
        setStreaks(s);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const today = useMemo(() => {
    if (!daily.length) return null;
    const todayStr = new Date().toISOString().slice(0, 10);
    return daily.find((d) => d.date === todayStr) || null;
  }, [daily]);

  const weeklyAverageReels = useMemo(() => {
    if (!weekly.length) return 0;
    const lastWeek = weekly[weekly.length - 1];
    const days = 7;
    return days ? Math.round((lastWeek.total_reels || 0) / days) : 0;
  }, [weekly]);

  const longestSessionMinutes = useMemo(() => {
    if (!daily.length) return 0;
    // We don't have individual sessions here, but we can approximate:
    // assume the max daily total is one long session as an upper bound.
    return daily.reduce(
      (max, d) => Math.max(max, d.total_minutes || 0),
      0
    );
  }, [daily]);

  const reelsPerSessionAvg = useMemo(() => {
    const totalReels = daily.reduce((sum, d) => sum + (d.total_reels || 0), 0);
    const totalSessions = daily.reduce((sum, d) => sum + (d.total_sessions || 0), 0);
    if (!totalSessions) return 0;
    return (totalReels / totalSessions).toFixed(1);
  }, [daily]);

  return (
    <div className="stack">
      <section className="grid grid--4">
        <StatsCard
          label="Today's reels"
          value={today ? today.total_reels : 0}
          subtitle={today ? "Tracked for today" : "No data for today yet"}
        />
        <StatsCard
          label="Weekly average reels / day"
          value={weeklyAverageReels}
        />
        <StatsCard
          label="Approx. longest daily time"
          value={`${longestSessionMinutes} min`}
          subtitle="Upper bound based on daily totals"
        />
        <StatsCard
          label="Avg. reels per session"
          value={reelsPerSessionAvg}
        />
      </section>

      <section className="grid grid--3">
        <div className="card card--chart span-2">
          <div className="card__head">
            <div className="card__title">Reels watched per day</div>
            <div className="pill pill--neutral">Last 30 days</div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total_reels" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Streaks</div>
          </div>
          <div className="kv">
            <div className="kv__row">
              <div className="kv__k">Current streak</div>
              <div className="kv__v">
                {streaks.current_streak} day
                {streaks.current_streak === 1 ? "" : "s"}
              </div>
            </div>
            <div className="kv__row">
              <div className="kv__k">Longest streak</div>
              <div className="kv__v">
                {streaks.longest_streak} day
                {streaks.longest_streak === 1 ? "" : "s"}
              </div>
            </div>
            <p className="hint" style={{ marginTop: 10 }}>
              A streak is a run of days where you tracked at least one Instagram session.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid--2">
        <div className="card card--chart">
          <div className="card__head">
            <div className="card__title">Time spent per day (minutes)</div>
            <div className="pill pill--neutral">Last 30 days</div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(d) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total_minutes"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">Weekly & monthly overview</div>
          </div>
          <div className="small">
            <div>
              <div className="small__title">Recent weeks</div>
              {weekly.slice(-4).map((w) => (
                <div key={`${w.year}-${w.week}`} className="row">
                  <span className="row__k">
                    Week {w.week} {w.year}
                  </span>
                  <span className="row__v">
                    {w.total_reels} reels · {w.total_minutes} min
                  </span>
                </div>
              ))}
              {!weekly.length && <div>No weekly data yet.</div>}
            </div>
            <div className="divider" />
            <div>
              <div className="small__title">Recent months</div>
              {monthly.slice(-4).map((m) => (
                <div key={`${m.year}-${m.month}`} className="row">
                  <span className="row__k">
                    {m.year}-{String(m.month).padStart(2, "0")}
                  </span>
                  <span className="row__v">
                    {m.total_reels} reels · {m.total_minutes} min
                  </span>
                </div>
              ))}
              {!monthly.length && <div>No monthly data yet.</div>}
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="hint">
          Loading analytics...
        </div>
      )}
    </div>
  );
}

export default DashboardPage;

