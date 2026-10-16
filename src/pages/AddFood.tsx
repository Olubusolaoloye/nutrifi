import { ArrowLeft, Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, MacroTiles, MealTag, NutrientChips, PageHeader, SearchBox, Thumb } from "../components/ui";
import { FOOD_CATEGORIES, nutrientsFor, searchFoods, type Food, type FoodCategory } from "../data/foods";
import { fmt } from "../state/derived";
import { MEALS, todayIso, useStore, type Meal } from "../state/store";

interface Pending {
  food: Food;
  grams: number;
  portionLabel: string;
}

const defaultPortion = (f: Food) => f.portions[Math.min(1, f.portions.length - 1)];

export function AddFood() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addDiaryEntries } = useStore();
  const initialMeal = MEALS.includes(params.get("meal") as Meal) ? (params.get("meal") as Meal) : "Lunch";
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<FoodCategory | "All">("All");
  const [selected, setSelected] = useState<Food | null>(null);
  const [tray, setTray] = useState<Pending[]>([]);
  const results = useMemo(
    () => searchFoods(query).filter((f) => category === "All" || f.category === category),
    [query, category],
  );

  const save = () => {
    addDiaryEntries(tray.map((p) => ({ date: todayIso(), meal, foodId: p.food.id, grams: p.grams, portionLabel: p.portionLabel })));
    navigate("/diary");
  };
  const trayKcal = tray.reduce((t, p) => t + nutrientsFor(p.food, p.grams).kcal, 0);

  const trayCard = tray.length > 0 && !selected && (
    <Card title={tray.length > 1 ? "Your combo" : "Ready to add"} action={<MealTag meal={meal} />} className="tray">
      <ul className="entry-list">
        {tray.map((p, i) => (
          <li key={i}>
            <Thumb emoji={p.food.emoji} size="sm" />
            <div>
              <strong>{p.food.name}</strong>
              <span className="muted small">{p.portionLabel} · {fmt(nutrientsFor(p.food, p.grams).kcal)} kcal</span>
            </div>
            <button className="icon-btn sm" onClick={() => setTray((t) => t.filter((_, j) => j !== i))} aria-label={`Remove ${p.food.name}`}><X size={16} /></button>
          </li>
        ))}
      </ul>
      <p className="muted small">Add more items to build a combo, e.g. eba + egusi + beef.</p>
      <button className="btn btn-primary btn-block" onClick={save}>
        Save to {meal} · {fmt(trayKcal)} kcal
      </button>
    </Card>
  );

  return (
    <div className="page page-aside">
      <PageHeader title="Add food" subtitle="Nigerian foods in the portions you really eat">
        <div className="seg" role="group" aria-label="Meal">
          {MEALS.map((m) => (
            <button key={m} className={meal === m ? "on" : ""} onClick={() => setMeal(m)}>{m}</button>
          ))}
        </div>
      </PageHeader>

      <div className="with-aside">
        <div>
          {trayCard && <div className="tray-mobile">{trayCard}</div>}
          {selected ? (
            <PortionPicker
              food={selected}
              onCancel={() => setSelected(null)}
              onAdd={(p) => {
                setTray((t) => [...t, p]);
                setSelected(null);
                setQuery("");
              }}
            />
          ) : (
            <>
              <SearchBox value={query} onChange={setQuery} placeholder="Search e.g. eba, jollof, beans…" autoFocus />
              <div className="chip-group" role="group" aria-label="Category" style={{ margin: "0.75rem 0 1rem" }}>
                {(["All", ...FOOD_CATEGORIES] as const).map((c) => (
                  <button key={c} className={`chip${category === c ? " on" : ""}`} onClick={() => setCategory(c)}>{c}</button>
                ))}
              </div>
              <ul className="food-rows">
                {results.map((f) => {
                  const portion = defaultPortion(f);
                  return (
                    <li key={f.id}>
                      <button className="food-row" onClick={() => setSelected(f)}>
                        <Thumb emoji={f.emoji} />
                        <div className="food-row-body">
                          <div className="food-row-top">
                            <span className="tag tag-outline">{f.category}</span>
                            <span className="muted small">{f.aliases.join(", ")}</span>
                          </div>
                          <strong>{f.name}</strong>
                          <NutrientChips m={nutrientsFor(f, portion.grams)} />
                          <span className="muted small">per {portion.label.toLowerCase()} ({portion.grams} g)</span>
                        </div>
                        <span className="icon-btn sm lime" aria-hidden><Plus size={16} /></span>
                      </button>
                    </li>
                  );
                })}
                {results.length === 0 && <li className="empty-meal muted">No match. Food requests are coming soon.</li>}
              </ul>
            </>
          )}
        </div>
        <aside className="aside tray-desktop">
          {trayCard || (
            <Card title="Build a combo" className="card-warm">
              <p className="small muted">Pick a food, choose your portion, then add the rest of the plate. Save it all to {meal} in one go.</p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function PortionPicker({ food, onAdd, onCancel }: { food: Food; onAdd: (p: Pending) => void; onCancel: () => void }) {
  const [portion, setPortion] = useState(defaultPortion(food));
  const [qty, setQty] = useState(1);
  const grams = portion.grams * qty;
  const n = nutrientsFor(food, grams);

  return (
    <section className="card picker">
      <div>
        <button className="btn btn-ghost btn-small" onClick={onCancel}><ArrowLeft size={16} /> Back</button>
        <Thumb emoji={food.emoji} size="lg" label={food.name} />
      </div>
      <div>
        <div className="food-row-top"><span className="tag tag-outline">{food.category}</span><span className="badge">{food.source}</span></div>
        <h1 style={{ margin: "0.5rem 0 0.25rem" }}>{food.name}</h1>
        <p className="muted small">Also called: {food.aliases.join(", ")}</p>

        <h3>Choose your portion</h3>
        <div className="portion-row" role="radiogroup" aria-label="Portion size">
          {food.portions.map((p) => (
            <button
              key={p.label}
              role="radio"
              aria-checked={p === portion}
              className={`portion${p === portion ? " selected" : ""}`}
              onClick={() => setPortion(p)}
            >
              <span className="portion-visual" aria-hidden style={{ ["--size" as string]: Math.min(1, 0.45 + p.grams / 400) }} />
              <span>{p.label}</span>
              <span className="muted small">{p.grams} g</span>
            </button>
          ))}
        </div>
        <div className="stepper">
          <button className="icon-btn sm" style={{ border: 0 }} onClick={() => setQty((q) => Math.max(0.5, q - 0.5))} aria-label="Less"><Minus size={16} /></button>
          <span className="small"><strong>{qty}</strong> × {portion.label}</span>
          <button className="icon-btn sm" style={{ border: 0 }} onClick={() => setQty((q) => q + 0.5)} aria-label="More"><Plus size={16} /></button>
        </div>
        <div style={{ margin: "0.9rem 0" }}><MacroTiles m={n} /></div>
        <button className="btn btn-primary btn-block" onClick={() => onAdd({ food, grams, portionLabel: qty === 1 ? portion.label : `${qty} × ${portion.label}` })}>
          Add {grams} g to plate
        </button>
      </div>
    </section>
  );
}
