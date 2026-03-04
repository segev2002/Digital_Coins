import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

interface Props {
  search: string;
  onSearch: (v: string) => void;
}

export default function Navbar({ search, onSearch }: Props) {
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem("cryptonite_dark") === "true";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("cryptonite_dark", String(dark));
  }, [dark]);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        Cryptonite
      </NavLink>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")} end>
          Home
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
          Reports
        </NavLink>
        <NavLink to="/ai" className={({ isActive }) => (isActive ? "active" : "")}>
          AI Recommendation
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
        <input
          className="navbar-search"
          type="text"
          placeholder="Search coins..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <button
          className="dark-toggle"
          onClick={() => setDark((d) => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}
