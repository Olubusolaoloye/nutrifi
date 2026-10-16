import { ChevronLeft, ChevronRight, Plus, ShoppingBasket, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, SampleNotice, Sheet, Thumb } from "../components/ui";
import { CUISINES, type Cuisine } from "../data/foods";
import { RECIPES, recipeById, sampleWeekPlan } from "../data/recipes";
import { bodySummary, fmt } from "../state/derived";
import { shiftDate, todayIso, useStore, weekDates, type Meal } from "../state/store";

/** Column order matches the reference: breakfast, lunch, snack, dinner. */
const PLAN_MEALS: Meal[] = ["Breakfast", "Lunch", "Snacks", "Dinner"];

export function MealPlan() {
  const { profile, latestWeightKg, plan, setPlanSlot, replacePlan } = useStore();
  const [anchor, setAnchor] = useState(todayIso());
  const [cuisines, setCuisines] = useState<Cuisine[]>(["Nigerian"]);
  const [editing, setEditing] = useState<{ date: string; meal: Meal } | null>(null);
  const dates = weekDates(anchor);
  const today = todayIso();
  const summary = profile && latestWeightKg !== null ? bodySummary(profile, latestWeightKg) : null;
  const target = summary?.target.kind === "target" ? summary.target.kcal : null;

  const dayKcal = (date: string) =>
    PLAN_MEALS.reduce((t, m) => t + (recipeById(plan[date]?.[m] ?? "")?.kcal ?? 0), 0);
  const weekHasItems = dates.some((d) => Object.keys(plan[d] ?? {}).length > 0);
  const monthLabel = new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <div className="page page-wide">
      <PageHeader title="Meal plan" subtitle="Plan your week, then shop for it in one tap">
        <Link to={`/grocery?week=${dates[0]}`} className="btn btn-secondary"><ShoppingBasket size={18} /> Grocery list</Link>
        <Link to="/recipes" className="btn btn-primary"><Plus size={18} /> Browse recipes</Link>
      </PageHeader>

      {summary?.target.kind === "needs_dietitian" && (
        <div className="banner banner-warn">Because of your health details, a dietitian should set your plan. Use this as a general guide for now.</div>
      )}

      <div className="card plan-toolbar">
        <div className="row">
          <button className="icon-btn sm" onClick={() => setAnchor(shiftDate(anchor, -7))} aria-label="Previous week"><ChevronLeft size={16} /></button>
          <button className="icon-btn sm" onClick={() => setAnchor(shiftDate(anchor, 7))} aria-label="Next week"><ChevronRight size={16} /></button>
          <strong>{monthLabel}</strong>
          <span className="muted small">
            {new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} –{" "}
            {new Date(`${dates[6]}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </span>
        </div>
        <div className="row">
          <div className="chip-group" role="group" aria-label="Cuisines for sample plan">
            {CUISINES.map((c) => {
              const on = cuisines.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`chip${on ? " on" : ""}`}
                  aria-pressed={on}
                  onClick={() => setCuisines(on ? cuisines.filter((x) => x !== c.id) : [...cuisines, c.id])}
                >
                  {c.emoji} {c.label}
                </button>
              );
            })}
          </div>
          <button className="btn btn-ink btn-small" disabled={cuisines.length === 0} onClick={() => replacePlan(sampleWeekPlan(dates, cuisines))}>
            <Sparkles size={15} /> Fill with sample week
          </button>
          {weekHasItems && (
            <button className="btn btn-ghost btn-small" onClick={() => dates.forEach((d) => PLAN_MEALS.forEach((m) => setPlanSlot(d, m, null)))}>
              <Trash2 size={15} /> Clear week
            </button>
          )}
        </div>
      </div>

      <div className="plan-grid" role="table" aria-label="Weekly meal plan">
        <div className="plan-row plan-head" role="row">
          <div role="columnheader" className="plan-day-head">Day</div>
          {PLAN_MEALS.map((m) => (
            <div key={m} role="columnheader" className={`plan-col-head col-${m.toLowerCase()}`}>{m === "Snacks" ? "Snack" : m}</div>
          ))}
        </div>
        {dates.map((date) => {
          const d = new Date(`${date}T12:00:00`);
          const kcal = dayKcal(date);
          return (
            <div key={date} className={`plan-row${date === today ? " is-today" : ""}`} role="row">
              <div className="plan-day" role="rowheader">
                <strong>{d.toLocaleDateString("en-NG", { weekday: "long" })}</strong>
                <span className="muted small">{d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                {kcal > 0 && (
                  <span className={`plan-kcal${target && kcal > target ? " over" : ""}`}>
                    {fmt(kcal)}{target ? ` / ${fmt(target)}` : ""} kcal
                  </span>
                )}
              </div>
              {PLAN_MEALS.map((meal) => {
                const r = recipeById(plan[date]?.[meal] ?? "");
                return (
                  <div key={meal} role="cell" className={`plan-cell cell-${meal.toLowerCase()}`}>
                    <span className="plan-cell-label">{meal === "Snacks" ? "Snack" : meal}</span>
                    {r ? (
                      <button className="plan-item" onClick={() => setEditing({ date, meal })}>
                        <Thumb emoji={r.emoji} size="sm" />
                        <span>
                          <strong>{r.name}</strong>
                          <small>{r.kcal} kcal</small>
                        </span>
                      </button>
                    ) : (
                      <button className="plan-empty" onClick={() => setEditing({ date, meal })} aria-label={`Add ${meal} on ${d.toLocaleDateString("en-NG", { weekday: "long" })}`}>
                        <Plus size={16} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <SampleNotice>The sample week rotates Nutrifi's sample recipes. It isn't a personalised plan — those come from dietitians.</SampleNotice>

      {editing && (
        <Sheet
          title={`${editing.meal} · ${new Date(`${editing.date}T12:00:00`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" })}`}
          onClose={() => setEditing(null)}
        >
          <ul className="food-rows">
            {[...RECIPES]
              .sort((a, b) => Number(b.meal === editing.meal) - Number(a.meal === editing.meal))
              .map((r) => {
                const selected = plan[editing.date]?.[editing.meal] === r.id;
                return (
                  <li key={r.id}>
                    <button
                      className={`food-row${selected ? " is-selected" : ""}`}
                      onClick={() => {
                        setPlanSlot(editing.date, editing.meal, r.id);
                        setEditing(null);
                      }}
                    >
                      <Thumb emoji={r.emoji} size="sm" />
                      <div className="food-row-body">
                        <strong className="small">{r.name}</strong>
                        <span className="muted small">{r.cuisine} · {r.meal} · {r.kcal} kcal</span>
                      </div>
                      {selected && <span className="badge badge-ok">Planned</span>}
                    </button>
                  </li>
                );
              })}
          </ul>
          {plan[editing.date]?.[editing.meal] && (
            <button
              className="btn btn-danger btn-block"
              onClick={() => {
                setPlanSlot(editing.date, editing.meal, null);
                setEditing(null);
              }}
            >
              <Trash2 size={16} /> Remove from plan
            </button>
          )}
        </Sheet>
      )}
    </div>
  );
}
