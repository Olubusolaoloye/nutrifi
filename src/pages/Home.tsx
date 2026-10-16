import { Bell, CalendarDays, Calculator, Droplets, GlassWater, Plus, Scale, Target } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar } from "../components/Layout";
import { Card, DietitianCard, MacroTiles, MealTag, NutrientChips, PageHeader, Ring, SearchBox, Segments, Thumb } from "../components/ui";
import { ARTICLES } from "../data/articles";
import { foodById, nutrientsFor } from "../data/foods";
import { BMI_CATEGORY_LABEL, SACHET_ML, bmiCategory } from "../lib/nutrition";
import { bodySummary, dailyTotals, fmt } from "../state/derived";
import { MEALS, canUseWorkbench, todayIso, useStore, type Meal } from "../state/store";

const ROLE_LABEL = { consumer: "Member", student: "Nutrition student", dietitian: "Dietitian" };

/** Popular local combos for quick logging (opens Add food with the first item searched). */
const POPULAR = [
  { name: "Eba with Egusi soup & Beef", emoji: "🍲", meal: "Lunch" as Meal, query: "eba" },
  { name: "Jollof rice, Dodo & Chicken", emoji: "🍛", meal: "Lunch" as Meal, query: "jollof" },
  { name: "Bread & Akara with Tea", emoji: "🧆", meal: "Breakfast" as Meal, query: "akara" },
  { name: "Beans & Fried plantain", emoji: "🫘", meal: "Dinner" as Meal, query: "beans" },
];

export function Home() {
  const navigate = useNavigate();
  const { profile, diary, water, latestWeightKg, addWater } = useStore();
  const [filter, setFilter] = useState<Meal | "All">("All");
  const [query, setQuery] = useState("");
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
  const meals = filter === "All" ? MEALS : [filter];

  return (
    <div className="page page-aside">
      <div className="with-aside">
        <div>
          <PageHeader title={`${greeting}, ${profile.name}`} subtitle={new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })}>
            <form
              className="row grow"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/add?q=${encodeURIComponent(query)}`);
              }}
            >
              <SearchBox value={query} onChange={setQuery} placeholder="Search foods, e.g. eba" />
            </form>
            <Link to="/add" className="btn btn-primary"><Plus size={18} /> Log food</Link>
          </PageHeader>

          <div className="section-title"><h2>Today's summary</h2></div>
          {s.target.kind === "target" ? (
            <section className="card featured">
              <div className="featured-main">
                <div className="featured-row">
                  <Ring
                    value={totals.kcal}
                    max={s.target.kcal}
                    label={fmt(Math.abs(s.target.kcal - totals.kcal))}
                    sub={totals.kcal <= s.target.kcal ? "kcal left" : "kcal over"}
                  />
                  <div className="featured-meta">
                    <div className="meta"><span className="meta-icon"><Target size={18} /></span><div><span>Daily target</span><strong>{fmt(s.target.kcal)} kcal</strong></div></div>
                    <div className="meta"><span className="meta-icon"><CalendarDays size={18} /></span><div><span>Items logged</span><strong>{entries.length}</strong></div></div>
                    <div className="meta"><span className="meta-icon"><Scale size={18} /></span><div><span>BMI</span><strong>{fmt(s.bmi, 1)}</strong></div></div>
                    <div className="meta"><span className="meta-icon"><Droplets size={18} /></span><div><span>Water</span><strong>{fmt(waterMl / 1000, 1)} L</strong></div></div>
                  </div>
                </div>
                {totals.kcal > s.target.kcal && <p className="small">You're a bit over today. Tomorrow's a new day.</p>}
                {entries.length > 0 && totals.protein * 4 < totals.kcal * 0.1 && (
                  <p className="small">Protein is a bit low today. Try beans, fish, eggs or moi moi.</p>
                )}
                <Link to="/add" className="btn btn-primary btn-block">Log a meal</Link>
              </div>
              <MacroTiles m={totals} targetKcal={s.target.kcal} />
            </section>
          ) : (
            <>
              <section className="card featured">
                <div className="featured-main">
                  <h2>Food logged today</h2>
                  <p className="stat-value">{fmt(totals.kcal)} kcal</p>
                  <p className="muted small">from {entries.length} item{entries.length === 1 ? "" : "s"}</p>
                  <Link to="/add" className="btn btn-primary btn-block">Log a meal</Link>
                </div>
                <MacroTiles m={totals} />
              </section>
              <DietitianCard reason={s.target.reason} />
            </>
          )}

          <div className="section-title">
            <h2>Today's meals</h2>
            <div className="chip-group" role="group" aria-label="Filter meals">
              {(["All", ...MEALS] as const).map((m) => (
                <button key={m} className={`chip${filter === m ? " on" : ""}`} onClick={() => setFilter(m)}>{m}</button>
              ))}
            </div>
          </div>
          <ul className="food-rows">
            {meals.map((meal) => {
              const items = entries.filter((e) => e.meal === meal);
              if (items.length === 0) {
                return (
                  <li key={meal} className="empty-meal">
                    <div className="row"><MealTag meal={meal} /><span className="muted small">Nothing logged yet</span></div>
                    <Link className="btn btn-primary btn-small" to={`/add?meal=${meal}`}><Plus size={16} /> Add</Link>
                  </li>
                );
              }
              return items.map((e) => {
                const food = foodById(e.foodId);
                if (!food) return null;
                return (
                  <li key={e.id} className="food-row">
                    <Thumb emoji={food.emoji} />
                    <div className="food-row-body">
                      <div className="food-row-top"><MealTag meal={meal} /><span className="tag tag-outline">{e.portionLabel}</span></div>
                      <strong>{food.name}</strong>
                      <NutrientChips m={nutrientsFor(food, e.grams)} />
                    </div>
                  </li>
                );
              });
            })}
          </ul>
        </div>

        <aside className="aside" aria-label="Your day">
          <div className="card row" style={{ justifyContent: "space-between" }}>
            <Link to="/me" className="profile-chip">
              <Avatar name={profile.name} />
              <span><strong>{profile.name}</strong><span className="muted small">{ROLE_LABEL[profile.role]}</span></span>
            </Link>
            <button className="icon-btn" aria-label="Reminders (coming soon)" disabled><Bell size={18} /></button>
          </div>

          <Card title="Water" action={<span className="muted small">{fmt(waterMl / 1000, 1)} / {fmt(s.waterTargetMl / 1000, 1)} L</span>}>
            <Segments value={waterMl} max={s.waterTargetMl} label={`${fmt(waterMl)} of ${fmt(s.waterTargetMl)} ml`} />
            <div className="chip-row">
              <button className="btn btn-secondary btn-small" onClick={() => addWater(today, SACHET_ML)}><GlassWater size={15} /> Sachet 500 ml</button>
              <button className="btn btn-secondary btn-small" onClick={() => addWater(today, 250)}>Cup 250 ml</button>
              <button className="btn btn-secondary btn-small" onClick={() => addWater(today, 750)}>Bottle 750 ml</button>
              {waterMl > 0 && <button className="chip chip-ghost" onClick={() => addWater(today, -250)}>Undo 250 ml</button>}
            </div>
          </Card>

          <Card title="Weight & BMI" action={<Link to="/progress" className="link">Progress →</Link>}>
            <div className="stat">
              <strong className="stat-value">{fmt(latestWeightKg, 1)} kg</strong>
              <span className="small">BMI {fmt(s.bmi, 1)} · <span className={`pill pill-${cat}`}>{BMI_CATEGORY_LABEL[cat]}</span></span>
            </div>
          </Card>

          {canUseWorkbench(profile) && (
            <Card title="Professional Workbench" className="card-accent">
              <p className="small">BMR, energy requirements and calorie distribution.</p>
              <Link to="/workbench" className="btn btn-primary"><Calculator size={18} /> Open Workbench</Link>
            </Card>
          )}

          <div className="section-title"><h2>Popular Naija meals</h2></div>
          <ul className="food-rows">
            {POPULAR.map((p) => (
              <li key={p.name} className="food-row">
                <Thumb emoji={p.emoji} size="sm" />
                <div className="food-row-body">
                  <strong className="small">{p.name}</strong>
                  <MealTag meal={p.meal} />
                </div>
                <Link to={`/add?meal=${p.meal}&q=${p.query}`} className="icon-btn sm lime" aria-label={`Log ${p.name}`}><Plus size={16} /></Link>
              </li>
            ))}
          </ul>

          <div className="section-title"><h2>Tip of the day</h2></div>
          <Link to={`/learn/${tip.id}`} className="card tip">
            <span className="tag tag-outline">{tip.scope}</span>
            <strong>{tip.title}</strong>
            <span className="muted small">{tip.summary}</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
