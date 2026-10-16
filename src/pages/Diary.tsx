import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { NoteCard } from "../components/NoteCard";
import { MacroTiles, MealTag, NutrientChips, PageHeader, Thumb } from "../components/ui";
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
  const label = isToday
    ? "Today"
    : new Date(`${date}T12:00:00`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div className="page">
      <PageHeader title="Food diary" subtitle={label}>
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
        <button className="icon-btn" onClick={() => setDate(shiftDate(date, 1))} disabled={isToday} aria-label="Next day"><ChevronRight size={18} /></button>
        {isToday && <Link to="/add" className="btn btn-primary"><Plus size={18} /> Log food</Link>}
      </PageHeader>

      <div className="card card-warm"><MacroTiles m={total} /></div>

      {MEALS.map((meal) => {
        const items = entries.filter((e) => e.meal === meal);
        const kcal = dailyTotals(items).kcal;
        return (
          <section key={meal}>
            <div className="section-title">
              <div className="row"><MealTag meal={meal} /><span className="muted small">{kcal > 0 ? `${fmt(kcal)} kcal` : ""}</span></div>
              {isToday && <Link className="btn btn-secondary btn-small" to={`/add?meal=${meal}`}><Plus size={15} /> Add</Link>}
            </div>
            {items.length === 0 ? (
              <div className="empty-meal muted small">Nothing logged yet.</div>
            ) : (
              <ul className="food-rows">
                {items.map((e) => {
                  const food = foodById(e.foodId);
                  if (!food) return null;
                  return (
                    <li key={e.id} className="food-row">
                      <Thumb emoji={food.emoji} />
                      <div className="food-row-body">
                        <strong>{food.name}</strong>
                        <span className="muted small">{e.portionLabel} · {e.grams} g</span>
                        <NutrientChips m={nutrientsFor(food, e.grams)} />
                      </div>
                      <button className="icon-btn sm" onClick={() => removeDiaryEntry(e.id)} aria-label={`Remove ${food.name}`}><Trash2 size={16} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
            <NoteCard key={`${date}-${meal}`} date={date} slot={meal} />
          </section>
        );
      })}

      <section>
        <div className="section-title"><h2>Day reflection</h2></div>
        <NoteCard key={`${date}-day`} date={date} slot="Day" />
      </section>
    </div>
  );
}
