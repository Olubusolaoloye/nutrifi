import { Droplet, Flame, Lock, Search, Wheat, Beef } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { fmt } from "../state/derived";
import type { Meal } from "../state/store";

export function Ring({ value, max, label, sub }: { value: number; max: number; label: string; sub: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const over = value > max;
  return (
    <div className="ring" role="img" aria-label={`${label}. ${sub}`}>
      <svg viewBox="0 0 120 120" width="150" height="150">
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
      {(label || hint) && (
        <div className="bar-head">
          <span>{label}</span>
          {hint && <span className="muted">{hint}</span>}
        </div>
      )}
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Segmented progress, e.g. water glasses. */
export function Segments({ value, max, count = 10, label }: { value: number; max: number; count?: number; label: string }) {
  const filled = max > 0 ? Math.min(count, Math.round((value / max) * count)) : 0;
  return (
    <div className="segments" role="img" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <i key={i} className={i < filled ? "on" : ""} />
      ))}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
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

export function PageHeader({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div className="page-head-title">
        <h1>{title}</h1>
        {subtitle && <span className="muted">{subtitle}</span>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </header>
  );
}

export function SearchBox({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  return (
    <label className="search-box">
      <Search size={18} aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} />
    </label>
  );
}

export interface Macros {
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

/** The four coloured nutrient tiles from the reference design. */
export function MacroTiles({ m, targetKcal }: { m: Macros; targetKcal?: number }) {
  return (
    <div className="tiles">
      <div className="tile tile-kcal">
        <span className="tile-icon"><Flame size={18} /></span>
        <div><span>Calories</span><strong>{fmt(m.kcal)} <small>{targetKcal ? `/ ${fmt(targetKcal)} kcal` : "kcal"}</small></strong></div>
      </div>
      <div className="tile tile-carbs">
        <span className="tile-icon"><Wheat size={18} /></span>
        <div><span>Carbs</span><strong>{fmt(m.carbs)} <small>g</small></strong></div>
      </div>
      <div className="tile tile-protein">
        <span className="tile-icon"><Beef size={18} /></span>
        <div><span>Protein</span><strong>{fmt(m.protein)} <small>g</small></strong></div>
      </div>
      <div className="tile tile-fat">
        <span className="tile-icon"><Droplet size={18} /></span>
        <div><span>Fat</span><strong>{fmt(m.fat)} <small>g</small></strong></div>
      </div>
    </div>
  );
}

export function NutrientChips({ m }: { m: Macros }) {
  return (
    <div className="nchips">
      <span className="nchip"><Flame size={13} aria-hidden /> {fmt(m.kcal)} kcal</span>
      <span className="nchip"><Wheat size={13} aria-hidden /> {fmt(m.carbs)}g carbs</span>
      <span className="nchip"><Beef size={13} aria-hidden /> {fmt(m.protein)}g protein</span>
      <span className="nchip"><Droplet size={13} aria-hidden /> {fmt(m.fat)}g fat</span>
    </div>
  );
}

export function Thumb({ emoji, size = "", label }: { emoji: string; size?: "" | "sm" | "lg"; label?: string }) {
  return (
    <span className={`thumb ${size}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {emoji}
    </span>
  );
}

export function MealTag({ meal }: { meal: Meal }) {
  return <span className={`tag tag-${meal.toLowerCase()}`}>{meal}</span>;
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
    <div className="card card-warm">
      <h2>Your target should be set by a dietitian</h2>
      <p>
        {reason === "condition"
          ? "Because of the health condition you told us about, a dietitian should set your daily target and plan with you."
          : "For people under 18, energy needs change with growth, so a dietitian should set your target."}
      </p>
      <button className="btn btn-primary" disabled>
        Talk to a dietitian (coming soon)
      </button>
      <p className="muted small">You can still log your meals, water and weight.</p>
    </div>
  );
}

export function Locked() {
  return (
    <div className="card card-warm locked">
      <span className="lock-icon" aria-hidden><Lock size={24} /></span>
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
