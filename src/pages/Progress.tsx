import { useState } from "react";
import { Card, PageHeader } from "../components/ui";
import { BMI_CATEGORY_LABEL, bmiCategory, calculateBmi } from "../lib/nutrition";
import { fmt } from "../state/derived";
import { todayIso, useStore } from "../state/store";

export function Progress() {
  const { profile, weights, logWeight } = useStore();
  const [input, setInput] = useState("");
  if (!profile) return null;

  const value = Number(input);
  const valid = value >= 20 && value <= 350;

  return (
    <div className="page">
      <PageHeader title="Progress" subtitle="Your weight and BMI over time" />

      <Card title="Log today's weight">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) {
              logWeight(todayIso(), value);
              setInput("");
            }
          }}
        >
          <input className="grow" inputMode="decimal" placeholder="Weight in kg" value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn btn-primary" disabled={!valid}>Save</button>
        </form>
      </Card>

      <Card title="Weight trend">
        <WeightChart points={weights.map((w) => w.weightKg)} />
        <ul className="entry-list">
          {[...weights].reverse().slice(0, 10).map((w) => {
            const bmi = calculateBmi(w.weightKg, profile.heightCm);
            const cat = bmiCategory(bmi);
            return (
              <li key={w.date}>
                <span>{new Date(`${w.date}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span>
                <strong>{fmt(w.weightKg, 1)} kg</strong>
                <span className={`pill pill-${cat}`}>BMI {fmt(bmi, 1)} · {BMI_CATEGORY_LABEL[cat]}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="About BMI">
        <p className="small">
          BMI (body mass index) is weight in kg divided by height in metres squared. It's a quick screening tool, not a
          diagnosis — it doesn't tell muscle from fat. Waist size and a health check give a fuller picture.
        </p>
        <p className="small muted">WHO adult categories: under 18.5 underweight · 18.5–24.9 healthy · 25–29.9 overweight · 30+ obesity.</p>
      </Card>
    </div>
  );
}

function WeightChart({ points }: { points: number[] }) {
  if (points.length < 2) return <p className="muted small">Log your weight on another day to see your trend.</p>;
  const w = 320;
  const h = 120;
  const min = Math.min(...points) - 1;
  const max = Math.max(...points) + 1;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * (w - 20) + 10, h - 10 - ((p - min) / (max - min)) * (h - 20)]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Weight trend chart">
      <polyline points={xy.map((p) => p.join(",")).join(" ")} className="chart-line" />
      {xy.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} className="chart-dot" />
      ))}
    </svg>
  );
}
