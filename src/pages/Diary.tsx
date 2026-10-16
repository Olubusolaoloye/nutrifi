import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/ui";
import { foodById, nutrientsFor } from "../data/foods";
import { dailyTotals, fmt } from "../state/derived";
import { MEALS, todayIso, useStore } from "../state/store";

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}

export function Diary() {
  const { diary, removeDiaryEntry } = useStore();
  const [date, setDate] = useState(todayIso());
  const entries = diary.filter((e) => e.date === date);
  const total = dailyTotals(entries);
  const isToday = date === todayIso();

  return (
    <div className="page">
      <header className="page-head row">
        <button className="btn btn-ghost" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day">‹</button>
        <h1>{isToday ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}</h1>
        <button className="btn btn-ghost" onClick={() => setDate(shiftDate(date, 1))} disabled={isToday} aria-label="Next day">›</button>
      </header>
      <p className="muted center">
        {fmt(total.kcal)} kcal · C {fmt(total.carbs)} g · P {fmt(total.protein)} g · F {fmt(total.fat)} g
      </p>

      {MEALS.map((meal) => {
        const items = entries.filter((e) => e.meal === meal);
        return (
          <Card key={meal} title={meal} action={isToday ? <Link className="btn btn-small" to={`/add?meal=${meal}`}>+ Add</Link> : undefined}>
            {items.length === 0 ? (
              <p className="muted small">Nothing logged yet.</p>
            ) : (
              <ul className="entry-list">
                {items.map((e) => {
                  const food = foodById(e.foodId);
                  if (!food) return null;
                  return (
                    <li key={e.id}>
                      <div>
                        <strong>{food.name}</strong>
                        <span className="muted small">{e.portionLabel} · {e.grams} g</span>
                      </div>
                      <span>{fmt(nutrientsFor(food, e.grams).kcal)} kcal</span>
                      <button className="btn btn-ghost btn-small" onClick={() => removeDiaryEntry(e.id)} aria-label={`Remove ${food.name}`}>✕</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}
