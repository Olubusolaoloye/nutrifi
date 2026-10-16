import { Link } from "react-router-dom";
import { Bar, Card, DietitianCard, Ring } from "../components/ui";
import { ARTICLES } from "../data/articles";
import { BMI_CATEGORY_LABEL, SACHET_ML, bmiCategory } from "../lib/nutrition";
import { bodySummary, dailyTotals, fmt } from "../state/derived";
import { MEALS, canUseWorkbench, todayIso, useStore } from "../state/store";

export function Home() {
  const { profile, diary, water, latestWeightKg, addWater } = useStore();
  if (!profile || latestWeightKg === null) return null;

  const today = todayIso();
  const entries = diary.filter((e) => e.date === today);
  const totals = dailyTotals(entries);
  const s = bodySummary(profile, latestWeightKg);
  const waterMl = water[today] ?? 0;
  const cat = bmiCategory(s.bmi);
  const tip = ARTICLES[new Date().getDate() % ARTICLES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="page">
      <header className="page-head">
        <h1>
          {greeting}, {profile.name}
        </h1>
        <p className="muted">{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}</p>
      </header>

      <div className="grid">
        {s.target.kind === "target" ? (
          <Card title="Today's calories">
            <div className="ring-row">
              <Ring
                value={totals.kcal}
                max={s.target.kcal}
                label={`${fmt(Math.abs(s.target.kcal - totals.kcal))}`}
                sub={totals.kcal <= s.target.kcal ? "kcal left" : "kcal over"}
              />
              <div className="ring-legend">
                <div><span className="muted">Eaten</span><strong>{fmt(totals.kcal)}</strong></div>
                <div><span className="muted">Target</span><strong>{fmt(s.target.kcal)}</strong></div>
              </div>
            </div>
            {totals.kcal > s.target.kcal && <p className="small">You're a bit over today. Tomorrow's a new day.</p>}
          </Card>
        ) : (
          <>
            <Card title="Food logged today">
              <p className="stat-value">{fmt(totals.kcal)} kcal</p>
              <p className="muted small">from {entries.length} item{entries.length === 1 ? "" : "s"}</p>
            </Card>
            <DietitianCard reason={s.target.reason} />
          </>
        )}

        <Card title="Carbs · Protein · Fat">
          {/* Bars show each macro's share of today's energy. */}
          <Bar label="Carbs" value={totals.carbs * 4} max={totals.kcal} hint={`${fmt(totals.carbs)} g`} />
          <Bar label="Protein" value={totals.protein * 4} max={totals.kcal} hint={`${fmt(totals.protein)} g`} />
          <Bar label="Fat" value={totals.fat * 9} max={totals.kcal} hint={`${fmt(totals.fat)} g`} />
          {entries.length > 0 && totals.protein * 4 < totals.kcal * 0.1 && (
            <p className="small">Protein is a bit low today — try beans, fish, eggs or moi moi.</p>
          )}
        </Card>

        <Card title="Water" action={<span className="muted">{fmt(waterMl / 1000, 1)} / {fmt(s.waterTargetMl / 1000, 1)} L</span>}>
          <Bar label="" value={waterMl} max={s.waterTargetMl} />
          <div className="chip-row">
            <button className="chip" onClick={() => addWater(today, SACHET_ML)}>+ Sachet (500 ml)</button>
            <button className="chip" onClick={() => addWater(today, 250)}>+ Cup (250 ml)</button>
            <button className="chip" onClick={() => addWater(today, 750)}>+ Bottle (750 ml)</button>
            {waterMl > 0 && <button className="chip chip-ghost" onClick={() => addWater(today, -250)}>Undo 250 ml</button>}
          </div>
        </Card>

        <Card title="Meals">
          <ul className="meal-list">
            {MEALS.map((m) => {
              const kcal = dailyTotals(entries.filter((e) => e.meal === m)).kcal;
              return (
                <li key={m}>
                  <span>{m}</span>
                  <span className="muted">{kcal > 0 ? `${fmt(kcal)} kcal` : ""}</span>
                  <Link className="btn btn-small" to={`/add?meal=${m}`}>+ Add</Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Weight & BMI" action={<Link to="/progress" className="link">Progress →</Link>}>
          <div className="stat">
            <strong className="stat-value">{fmt(latestWeightKg, 1)} kg</strong>
            <span>BMI {fmt(s.bmi, 1)} · <span className={`pill pill-${cat}`}>{BMI_CATEGORY_LABEL[cat]}</span></span>
          </div>
        </Card>

        {canUseWorkbench(profile) && (
          <Card title="Professional Workbench" className="card-accent">
            <p>BMR, energy requirements and calorie distribution.</p>
            <Link to="/workbench" className="btn btn-primary">Open Workbench</Link>
          </Card>
        )}

        <Card title="Tip of the day">
          <Link to={`/learn/${tip.id}`} className="tip">
            <strong>{tip.title}</strong>
            <span className="muted">{tip.summary}</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
