import React from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import TrackerPage from "./pages/TrackerPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar__inner">
          <div className="brand">
            <div className="brand__logo">DK</div>
            <div className="brand__text">
              <div className="brand__name">Usage Tracker</div>
              <div className="brand__tagline">Reels-focused • Manual sessions</div>
            </div>
          </div>

          <nav className="nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "nav__link is-active" : "nav__link")}
            >
              Tracker
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "nav__link is-active" : "nav__link")}
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="container main">
        <Routes location={location}>
          <Route path="/" element={<TrackerPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

