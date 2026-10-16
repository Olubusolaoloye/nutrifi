import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Ring({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const over = value > max;
  return (
    <div className="ring" role="img" aria-label={`${label}. ${sub}`}>
      <svg viewBox="0 0 120 120" width="148" height="148">
        <circle cx="60" cy="60" r={r} className="ring-track" />
        <circle
          cx="60"
          cy="60"
          r={r}
          className={`ring-value${over ? " over" : ""}`}
          strokeDasharray={`${c * pct} ${c}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-text">
        <strong>{label}</strong>
        <span>{sub}</span>
      </div>
    </div>
  );
}

export function Bar({ value, max, label, hint }: { value: number; max: number; label: string; hint?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="bar">
      <div className="bar-head">
        <span>{label}</span>
        {hint && <span className="muted">{hint}</span>}
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Disclaimer() {
  return (
    <p className="disclaimer">
      Nutrifi supports healthy eating but does not replace advice from your doctor or dietitian.
    </p>
  );
}

export function DietitianCard({ reason }: { reason: "condition" | "under_18" }) {
  return (
    <div className="card card-soft">
      <h2>Your target should be set by a dietitian</h2>
      <p>
        {reason === "condition"
          ? "Because of the health condition you told us about, a dietitian should set your daily target and plan with you."
          : "For people under 18, energy needs change with growth, so a dietitian should set your target."}
      </p>
      <button className="btn btn-secondary" disabled>
        Talk to a dietitian (coming soon)
      </button>
      <p className="muted small">You can still log your meals, water and weight.</p>
    </div>
  );
}

export function Locked() {
  return (
    <div className="card card-soft locked">
      <div className="lock-icon" aria-hidden>🔒</div>
      <h2>For dietitians &amp; nutrition students</h2>
      <p>
        The Professional Workbench (BMR, energy requirements and calorie distribution) is available to verified
        dietitians and nutrition students.
      </p>
      <Link to="/me" className="btn btn-secondary">
        Go to Me
      </Link>
    </div>
  );
}
