import {
  BookOpen,
  Calculator,
  LayoutDashboard,
  NotebookPen,
  Plus,
  TrendingUp,
  UserRound,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { canUseWorkbench, useStore } from "../state/store";

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

export function Brand() {
  return (
    <Link to="/home" className="brand">
      <img src="/icon.svg" alt="" width={32} height={32} /> Nutrifi
    </Link>
  );
}

export function Avatar({ name }: { name: string }) {
  return <span className="avatar" aria-hidden>{name.trim()[0]?.toUpperCase() ?? "N"}</span>;
}

export function Layout() {
  const { profile } = useStore();
  const online = useOnline();
  const pro = canUseWorkbench(profile);
  const cls = (extra = "") => ({ isActive }: { isActive: boolean }) => `nav-item ${extra}${isActive ? " active" : ""}`;

  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <div className="nav-brand"><Brand /></div>
        <NavLink to="/home" className={cls()}>
          <span className="nav-icon"><LayoutDashboard size={20} /></span><span>Home</span>
        </NavLink>
        <NavLink to="/diary" className={cls()}>
          <span className="nav-icon"><NotebookPen size={20} /></span><span>Diary</span>
        </NavLink>
        <NavLink to="/add" className={cls("nav-add")} aria-label="Add food">
          <span className="nav-icon"><Plus size={22} /></span><span>Add food</span>
        </NavLink>
        <NavLink to="/progress" className={cls("nav-desktop-only")}>
          <span className="nav-icon"><TrendingUp size={20} /></span><span>Progress</span>
        </NavLink>
        <NavLink to="/learn" className={cls()}>
          <span className="nav-icon"><BookOpen size={20} /></span><span>Learn</span>
        </NavLink>
        {pro && (
          <NavLink to="/workbench" className={cls("nav-desktop-only")}>
            <span className="nav-icon"><Calculator size={20} /></span><span>Workbench</span>
          </NavLink>
        )}
        <NavLink to="/me" className={cls()}>
          <span className="nav-icon"><UserRound size={20} /></span><span>Me</span>
        </NavLink>
        <div className="nav-spacer" />
        <div className="nav-promo promo">
          <div className="promo-art" aria-hidden>🥗</div>
          <p>Get a personalised meal plan from a <strong>verified dietitian</strong>.</p>
          <button className="btn btn-small" disabled>Coming soon</button>
        </div>
      </nav>
      <main className="main">
        <div className="mobile-top">
          <Brand />
          {profile && (
            <Link to="/me" aria-label="Me">
              <Avatar name={profile.name} />
            </Link>
          )}
        </div>
        {!online && (
          <div className="banner banner-warn" role="status">
            <WifiOff size={16} aria-hidden /> You're offline. Your logs are saved on this device.
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
