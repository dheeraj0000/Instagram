import React from "react";

function StatsCard({ label, value, subtitle }) {
  return (
    <div className="card card--stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {subtitle && <div className="stat__sub">{subtitle}</div>}
    </div>
  );
}

export default StatsCard;

