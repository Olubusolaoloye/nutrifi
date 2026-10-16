import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { canUseWorkbench, useStore } from "../state/store";

const NAV = [
  { to: "/home", label: "Home", icon: "⌂" },
  { to: "/diary", label: "Diary", icon: "▤" },
  { to: "/add", label: "Add", icon: "+", primary: true },
  { to: "/learn", label: "Learn", icon: "✦" },
  { to: "/me", label: "Me", icon: "◉" },
];

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export function Layout() {
  const { profile } = useStore();
  const online = useOnline();
  const pro = canUseWorkbench(profile);

  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <div className="nav-brand">
          <img src="/icon.svg" alt="" width={28} height={28} /> Nutrifi
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item${n.primary ? " nav-add" : ""}${isActive ? " active" : ""}`}>
            <span className="nav-icon" aria-hidden>{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </NavLink>
        ))}
        <NavLink to="/progress" className={({ isActive }) => `nav-item nav-desktop-only${isActive ? " active" : ""}`}>
          <span className="nav-icon" aria-hidden>↗</span>
          <span className="nav-label">Progress</span>
        </NavLink>
        {pro && (
          <NavLink to="/workbench" className={({ isActive }) => `nav-item nav-desktop-only${isActive ? " active" : ""}`}>
            <span className="nav-icon" aria-hidden>∑</span>
            <span className="nav-label">Workbench</span>
          </NavLink>
        )}
      </nav>
      <main className="main">
        {!online && (
          <div className="banner banner-warn" role="status">
            You're offline. Your logs are saved on this device.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
