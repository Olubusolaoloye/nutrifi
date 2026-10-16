import { Banknote, CalendarRange, Check, Flame, Minus, Package, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, PageHeader, SampleNotice, StatCard } from "../components/ui";
import { GROCERY_CATEGORIES, INGREDIENTS, buildGroceryList, recipeById, type GroceryCategory } from "../data/recipes";
import { fmt } from "../state/derived";
import { shiftDate, todayIso, useStore, weekDates } from "../state/store";

const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  Grains: "🌾", Protein: "🍗", Veggies: "🥬", Fruits: "🍌", Dairy: "🥛", "Oils & spices": "🫙", Others: "🧂",
};
const CATEGORY_TONE: Record<GroceryCategory, string> = {
  Grains: "var(--tile-carbs)", Protein: "var(--tile-protein)", Veggies: "var(--tile-kcal)", Fruits: "#f6c3a0",
  Dairy: "#bcdcf5", "Oils & spices": "#e2c88f", Others: "var(--tile-fat)",
};
const naira = (n: number) => `₦${fmt(Math.round(n / 10) * 10)}`;

export function Grocery() {
  const [params, setParams] = useSearchParams();
  const { plan, grocery, updateGrocery } = useStore();
  const [category, setCategory] = useState<GroceryCategory | "All">("All");
  const weekStart = weekDates(params.get("week") ?? todayIso())[0];
  const dates = weekDates(weekStart);

  const recipeIds = dates.flatMap((d) => Object.values(plan[d] ?? {}).filter((x): x is string => !!x));
  const planKcal = recipeIds.reduce((t, id) => t + (recipeById(id)?.kcal ?? 0), 0) * grocery.people;

  const lines = useMemo(
    () =>
      buildGroceryList(recipeIds, grocery.people).map((l) => {
        const qty = grocery.qtyOverride[l.key] ?? l.qty;
        return { ...l, qty, costNaira: qty * INGREDIENTS[l.key].priceNaira };
      }),
    [recipeIds.join(","), grocery.people, grocery.qtyOverride],
  );
  const shown = lines.filter((l) => category === "All" || l.category === category);
  const total = lines.reduce((t, l) => t + l.costNaira, 0);
  const purchased = lines.filter((l) => grocery.purchased[l.key]);
  const spent = purchased.reduce((t, l) => t + l.costNaira, 0);
  const byCategory = GROCERY_CATEGORIES.map((c) => {
    const ls = lines.filter((l) => l.category === c);
    return { c, items: ls.length, cost: ls.reduce((t, l) => t + l.costNaira, 0) };
  }).filter((x) => x.items > 0);

  const setQty = (key: string, qty: number) =>
    updateGrocery({ qtyOverride: { ...grocery.qtyOverride, [key]: Math.max(0, Math.round(qty * 100) / 100) } });
  const step = (unit: string) => (["piece", "cube", "bunch", "pack", "tbsp"].includes(unit) ? 1 : unit === "cup" ? 0.25 : 0.1);
  const weekLabel = `${new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} – ${new Date(`${dates[6]}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`;

  return (
    <div className="page page-wide">
      <PageHeader title="Grocery list" subtitle={`From your meal plan · ${weekLabel}`}>
        <div className="row">
          <button className="icon-btn sm" onClick={() => setParams({ week: shiftDate(weekStart, -7) })} aria-label="Previous week">‹</button>
          <button className="icon-btn sm" onClick={() => setParams({ week: shiftDate(weekStart, 7) })} aria-label="Next week">›</button>
        </div>
        <Link to="/plan" className="btn btn-secondary"><CalendarRange size={18} /> Edit plan</Link>
      </PageHeader>

      <div className="stat-row">
        <StatCard icon={<Banknote size={20} />} tone="kcal" label="Estimated cost" value={naira(total)} />
        <StatCard icon={<Package size={20} />} tone="carbs" label="Items to buy" value={String(lines.length)} unit={`${purchased.length} bought`} />
        <StatCard icon={<Flame size={20} />} tone="protein" label="Planned calories" value={fmt(planKcal)} unit="kcal" />
        <StatCard icon={<Check size={20} />} tone="fat" label="Spent so far" value={naira(spent)} />
      </div>

      {lines.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-art" aria-hidden>🧺</div>
          <h2>Your list is empty</h2>
          <p className="muted">Add recipes to this week's meal plan and the ingredients appear here, ready to shop.</p>
          <Link to="/plan" className="btn btn-primary">Plan this week</Link>
        </div>
      ) : (
        <div className="grocery-layout">
          <Card title="Grocery list" className="grocery-table-card" action={
            <div className="row">
              <span className="muted small">Cooking for</span>
              <div className="stepper compact">
                <button className="icon-btn sm ghost" onClick={() => updateGrocery({ people: Math.max(1, grocery.people - 1), qtyOverride: {} })} aria-label="Fewer people"><Minus size={14} /></button>
                <strong>{grocery.people}</strong>
                <button className="icon-btn sm ghost" onClick={() => updateGrocery({ people: Math.min(12, grocery.people + 1), qtyOverride: {} })} aria-label="More people"><Plus size={14} /></button>
              </div>
            </div>
          }>
            <div className="chip-group chip-scroll" role="group" aria-label="Category">
              {(["All", ...byCategory.map((b) => b.c)] as const).map((c) => (
                <button key={c} className={`chip${category === c ? " on" : ""}`} onClick={() => setCategory(c)}>
                  {c === "All" ? "All categories" : c}
                </button>
              ))}
            </div>
            <div className="table-wrap">
              <table className="table data-table">
                <thead>
                  <tr><th>Item</th><th>Category</th><th>Qty</th><th className="num">Est. cost</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {shown.map((l) => {
                    const bought = !!grocery.purchased[l.key];
                    return (
                      <tr key={l.key} className={bought ? "is-done" : ""}>
                        <td><span className="cell-item"><span className="cell-emoji" aria-hidden>{CATEGORY_EMOJI[l.category]}</span>{l.name}</span></td>
                        <td><span className="tag" style={{ background: CATEGORY_TONE[l.category], color: "var(--on-tile)" }}>{l.category}</span></td>
                        <td>
                          <div className="qty">
                            <button className="icon-btn sm ghost" onClick={() => setQty(l.key, l.qty - step(l.unit))} aria-label={`Less ${l.name}`}><Minus size={13} /></button>
                            <span>{fmt(l.qty, Number.isInteger(l.qty) ? 0 : 2)} <small className="muted">{l.unit}</small></span>
                            <button className="icon-btn sm ghost" onClick={() => setQty(l.key, l.qty + step(l.unit))} aria-label={`More ${l.name}`}><Plus size={13} /></button>
                          </div>
                        </td>
                        <td className="num">{naira(l.costNaira)}</td>
                        <td>
                          <button
                            className={`status-pill ${bought ? "done" : "pending"}`}
                            aria-pressed={bought}
                            onClick={() => updateGrocery({ purchased: { ...grocery.purchased, [l.key]: !bought } })}
                          >
                            {bought ? <><Check size={13} /> Purchased</> : "Pending"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {Object.keys(grocery.qtyOverride).length > 0 && (
              <button className="btn btn-ghost btn-small" onClick={() => updateGrocery({ qtyOverride: {} })}><RotateCcw size={14} /> Reset quantities</button>
            )}
          </Card>

          <Card title="Grocery category">
            <p className="muted small" style={{ marginTop: 0 }}>Total</p>
            <p className="stat-value">{lines.length} <small className="muted small">items</small></p>
            <div className="stack-bar" role="img" aria-label="Cost by category">
              {byCategory.map((b) => (
                <span key={b.c} style={{ flex: b.cost || 0.0001, background: CATEGORY_TONE[b.c] }} />
              ))}
            </div>
            <ul className="legend">
              {byCategory.map((b) => (
                <li key={b.c}>
                  <span className="legend-dot" style={{ background: CATEGORY_TONE[b.c] }} aria-hidden />
                  <span className="grow">{b.c}</span>
                  <span className="muted small">{b.items} item{b.items === 1 ? "" : "s"}</span>
                  <strong className="small">{total > 0 ? Math.round((b.cost / total) * 100) : 0}%</strong>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      <SampleNotice>₦ prices are sample estimates for planning, not live market prices. Prices vary by market and season.</SampleNotice>
    </div>
  );
}
