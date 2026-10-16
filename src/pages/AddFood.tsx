import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "../components/ui";
import { nutrientsFor, searchFoods, type Food } from "../data/foods";
import { fmt } from "../state/derived";
import { MEALS, todayIso, useStore, type Meal } from "../state/store";

interface Pending {
  food: Food;
  grams: number;
  portionLabel: string;
}

export function AddFood() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { addDiaryEntries } = useStore();
  const initialMeal = MEALS.includes(params.get("meal") as Meal) ? (params.get("meal") as Meal) : "Lunch";
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [tray, setTray] = useState<Pending[]>([]);
  const results = useMemo(() => searchFoods(query), [query]);

  const save = () => {
    addDiaryEntries(tray.map((p) => ({ date: todayIso(), meal, foodId: p.food.id, grams: p.grams, portionLabel: p.portionLabel })));
    navigate("/diary");
  };

  const trayKcal = tray.reduce((t, p) => t + nutrientsFor(p.food, p.grams).kcal, 0);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Add food</h1>
        <div className="seg" role="group" aria-label="Meal">
          {MEALS.map((m) => (
            <button key={m} className={meal === m ? "on" : ""} onClick={() => setMeal(m)}>{m}</button>
          ))}
        </div>
      </header>

      {tray.length > 0 && !selected && (
        <Card title={tray.length > 1 ? "Your combo" : "Ready to add"} className="tray">
          <ul className="entry-list">
            {tray.map((p, i) => (
              <li key={i}>
                <div>
                  <strong>{p.food.name}</strong>
                  <span className="muted small">{p.portionLabel}</span>
                </div>
                <span>{fmt(nutrientsFor(p.food, p.grams).kcal)} kcal</span>
                <button className="btn btn-ghost btn-small" onClick={() => setTray((t) => t.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
              </li>
            ))}
          </ul>
          <p className="muted small">Add more items to build a combo, e.g. eba + egusi + beef.</p>
          <button className="btn btn-primary btn-block" onClick={save}>
            Save to {meal} · {fmt(trayKcal)} kcal
          </button>
        </Card>
      )}

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
          <input
            className="search"
            type="search"
            placeholder="Search e.g. eba, jollof, beans…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="food-list">
            {results.map((f) => (
              <li key={f.id}>
                <button onClick={() => setSelected(f)}>
                  <strong>{f.name}</strong>
                  <span className="muted small">{f.aliases.join(", ")} · {f.kcal} kcal / 100 g</span>
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="muted">No match. Food requests are coming soon.</li>}
          </ul>
        </>
      )}

    </div>
  );
}

function PortionPicker({ food, onAdd, onCancel }: { food: Food; onAdd: (p: Pending) => void; onCancel: () => void }) {
  const [portion, setPortion] = useState(food.portions[Math.min(1, food.portions.length - 1)]);
  const [qty, setQty] = useState(1);
  const grams = portion.grams * qty;
  const n = nutrientsFor(food, grams);

  return (
    <Card title={food.name} action={<button className="btn btn-ghost btn-small" onClick={onCancel}>Back</button>}>
      <p className="muted small">Also called: {food.aliases.join(", ")}</p>
      <p className="badge">{food.source}</p>
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
        <button className="btn btn-ghost" onClick={() => setQty((q) => Math.max(0.5, q - 0.5))} aria-label="Less">−</button>
        <span>{qty} × {portion.label}</span>
        <button className="btn btn-ghost" onClick={() => setQty((q) => q + 0.5)} aria-label="More">+</button>
      </div>
      <div className="nutrients">
        <div><strong>{fmt(n.kcal)}</strong><span>kcal</span></div>
        <div><strong>{fmt(n.carbs)} g</strong><span>Carbs</span></div>
        <div><strong>{fmt(n.protein)} g</strong><span>Protein</span></div>
        <div><strong>{fmt(n.fat)} g</strong><span>Fat</span></div>
      </div>
      <button className="btn btn-primary btn-block" onClick={() => onAdd({ food, grams, portionLabel: qty === 1 ? portion.label : `${qty} × ${portion.label}` })}>
        Add {grams} g
      </button>
    </Card>
  );
}
