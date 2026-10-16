import { Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, Locked } from "../components/ui";
import { FOODS, nutrientsFor } from "../data/foods";
import {
  AMDR,
  BMR_EQUATION_INFO,
  MACRO_PRESETS,
  PAL,
  PHYSIOLOGICAL_EXTRA_KCAL,
  calculateBmi,
  calculateBmr,
  calculateEnergy,
  compareBmr,
  distributeMacros,
  distributeMeals,
  type Anthropometrics,
  type BmrEquation,
  type MacroSplit,
  type PhysiologicalState,
  type Sex,
} from "../lib/nutrition";
import { fmt } from "../state/derived";
import { canUseWorkbench, useStore } from "../state/store";

const STATE_LABEL: Record<PhysiologicalState, string> = {
  none: "None",
  pregnant_t1: "Pregnant – 1st trimester",
  pregnant_t2: "Pregnant – 2nd trimester",
  pregnant_t3: "Pregnant – 3rd trimester",
  lactating_0_6m: "Lactating – 0–6 months",
  lactating_7_12m: "Lactating – 7–12 months",
};

function working(eq: BmrEquation, a: Anthropometrics): string {
  const { sex, ageYears: A, weightKg: W, heightCm: H } = a;
  switch (eq) {
    case "mifflin":
      return `10 × ${W} + 6.25 × ${H} − 5 × ${A} ${sex === "male" ? "+ 5" : "− 161"}`;
    case "harris_benedict":
      return sex === "male"
        ? `88.362 + 13.397 × ${W} + 4.799 × ${H} − 5.677 × ${A}`
        : `447.593 + 9.247 × ${W} + 3.098 × ${H} − 4.330 × ${A}`;
    case "schofield":
      return `Age-band equation for ${sex}, ${A} y (weight only), W = ${W} kg`;
    case "katch_mcardle":
      return `370 + 21.6 × (${W} × (1 − ${a.bodyFatPercent}/100))`;
  }
}

type Nutrient = "protein" | "carbs" | "fat" | "kcal";
const NUTRIENT_LABEL: Record<Nutrient, string> = { protein: "Protein", carbs: "Carbohydrate", fat: "Fat", kcal: "Energy" };

export function Workbench() {
  const { profile } = useStore();
  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState("30");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("165");
  const [bodyFat, setBodyFat] = useState("");
  const [equation, setEquation] = useState<BmrEquation>("mifflin");
  const [pal, setPal] = useState(String(PAL.light.value));
  const [stress, setStress] = useState("1");
  const [physio, setPhysio] = useState<PhysiologicalState>("none");
  const [split, setSplit] = useState<MacroSplit>(MACRO_PRESETS.standard.split);
  const [showWorking, setShowWorking] = useState(profile?.role === "student");
  const [nutrient, setNutrient] = useState<Nutrient>("protein");

  const a: Anthropometrics = {
    sex,
    ageYears: Number(age),
    weightKg: Number(weight),
    heightCm: Number(height),
    bodyFatPercent: bodyFat ? Number(bodyFat) : undefined,
  };

  const result = useMemo(() => {
    try {
      const energy = calculateEnergy(a, { equation, pal: Number(pal), stressFactor: Number(stress), physiologicalState: physio });
      return { energy, compare: compareBmr(a), error: null as string | null };
    } catch (e) {
      return { energy: null, compare: [], error: (e as Error).message };
    }
  }, [sex, age, weight, height, bodyFat, equation, pal, stress, physio]);

  const splitTotal = split.carbsPercent + split.proteinPercent + split.fatPercent;
  const macros = result.energy && splitTotal === 100 ? distributeMacros(result.energy.tee, split) : null;
  const meals = result.energy ? distributeMeals(result.energy.tee) : [];

  const sources = useMemo(
    () =>
      FOODS.map((f) => {
        const portion = f.portions[Math.min(1, f.portions.length - 1)];
        return { food: f, per100: f[nutrient], portion, perPortion: nutrientsFor(f, portion.grams)[nutrient] };
      })
        .sort((x, y) => y.per100 - x.per100)
        .slice(0, 8),
    [nutrient],
  );

  if (!canUseWorkbench(profile)) return <div className="page"><Locked /></div>;

  return (
    <div className="page page-wide">
      <header className="page-head">
        <h1>Professional Workbench</h1>
        <div className="row no-print">
          <label className="toggle">
            <input type="checkbox" checked={showWorking} onChange={(e) => setShowWorking(e.target.checked)} /> Show working
          </label>
          <button className="btn btn-primary" onClick={() => window.print()}><Printer size={18} /> Export / print</button>
        </div>
      </header>

      <div className="workbench">
        <Card title="Inputs" className="wb-inputs">
          <div className="field">
            <span>Sex</span>
            <div className="seg">
              {(["female", "male"] as Sex[]).map((s) => (
                <button key={s} className={sex === s ? "on" : ""} onClick={() => setSex(s)}>{s === "female" ? "Female" : "Male"}</button>
              ))}
            </div>
          </div>
          <NumberField label="Age (years)" value={age} onChange={setAge} />
          <NumberField label="Weight (kg)" value={weight} onChange={setWeight} />
          <NumberField label="Height (cm)" value={height} onChange={setHeight} />
          <NumberField label="Body fat % (optional)" value={bodyFat} onChange={setBodyFat} />
          <label className="field">
            <span>BMR equation</span>
            <select value={equation} onChange={(e) => setEquation(e.target.value as BmrEquation)}>
              {(Object.keys(BMR_EQUATION_INFO) as BmrEquation[]).map((k) => (
                <option key={k} value={k} disabled={k === "katch_mcardle" && !bodyFat}>{BMR_EQUATION_INFO[k].name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Physical activity level (PAL)</span>
            <select value={pal} onChange={(e) => setPal(e.target.value)}>
              {Object.values(PAL).map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
          <NumberField label="Stress / injury factor" value={stress} onChange={setStress} />
          <label className="field">
            <span>Physiological state</span>
            <select value={physio} onChange={(e) => setPhysio(e.target.value as PhysiologicalState)}>
              {(Object.keys(STATE_LABEL) as PhysiologicalState[]).map((k) => (
                <option key={k} value={k}>{STATE_LABEL[k]}</option>
              ))}
            </select>
          </label>
        </Card>

        <div className="wb-results">
          {result.error || !result.energy ? (
            <Card title="Check the inputs"><p className="error">{result.error}</p></Card>
          ) : (
            <>
              <Card title="Basal metabolic rate">
                <p className="stat-value">{fmt(result.energy.bmr)} kcal/day</p>
                <p className="muted small">{BMR_EQUATION_INFO[equation].name} · {BMR_EQUATION_INFO[equation].source}</p>
                {showWorking && <pre className="working">{working(equation, a)} = {fmt(result.energy.bmr, 1)}</pre>}
                <table className="table">
                  <thead><tr><th>Equation</th><th>BMR (kcal)</th></tr></thead>
                  <tbody>
                    {result.compare.map((r) => (
                      <tr key={r.equation} className={r.equation === equation ? "on" : ""}>
                        <td>{BMR_EQUATION_INFO[r.equation].name}</td>
                        <td>{fmt(r.kcal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="muted small">BMI {fmt(calculateBmi(a.weightKg, a.heightCm), 1)} kg/m²</p>
              </Card>

              <Card title="Energy requirement (TEE)">
                <p className="stat-value">{fmt(result.energy.tee)} kcal/day</p>
                {showWorking && (
                  <pre className="working">
                    {`BMR × PAL × stress + extra\n= ${fmt(result.energy.bmr, 1)} × ${result.energy.pal} × ${result.energy.stressFactor} + ${result.energy.extraKcal}\n= ${fmt(result.energy.tee, 1)} kcal`}
                  </pre>
                )}
                {physio !== "none" && (
                  <p className="muted small">+{PHYSIOLOGICAL_EXTRA_KCAL[physio]} kcal for {STATE_LABEL[physio].toLowerCase()} (IOM 2005).</p>
                )}
              </Card>

              <Card title="Calorie distribution">
                <div className="chip-row">
                  {Object.entries(MACRO_PRESETS).map(([k, p]) => (
                    <button key={k} className="chip" onClick={() => setSplit(p.split)}>{p.label}</button>
                  ))}
                </div>
                <div className="macro-inputs">
                  <NumberField label={`Carbs % (${AMDR.carbs.min}–${AMDR.carbs.max})`} value={String(split.carbsPercent)} onChange={(v) => setSplit({ ...split, carbsPercent: Number(v) })} />
                  <NumberField label={`Protein % (${AMDR.protein.min}–${AMDR.protein.max})`} value={String(split.proteinPercent)} onChange={(v) => setSplit({ ...split, proteinPercent: Number(v) })} />
                  <NumberField label={`Fat % (${AMDR.fat.min}–${AMDR.fat.max})`} value={String(split.fatPercent)} onChange={(v) => setSplit({ ...split, fatPercent: Number(v) })} />
                </div>
                {splitTotal !== 100 ? (
                  <p className="error">The split adds up to {splitTotal}%. It must total 100%.</p>
                ) : (
                  macros && (
                    <table className="table">
                      <thead><tr><th>Macro</th><th>%</th><th>kcal</th><th>grams</th></tr></thead>
                      <tbody>
                        {macros.map((m) => (
                          <tr key={m.macro}>
                            <td>{m.macro[0].toUpperCase() + m.macro.slice(1)} {!m.withinAmdr && <span className="pill pill-warn">outside AMDR</span>}</td>
                            <td>{m.percent}</td>
                            <td>{fmt(m.kcal)}</td>
                            <td>{fmt(m.grams)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                )}
                <h3>Per meal</h3>
                <table className="table">
                  <tbody>
                    {meals.map((m) => (
                      <tr key={m.meal}><td>{m.meal}</td><td>{m.percent}%</td><td>{fmt(m.kcal)} kcal</td></tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          <Card title="Food sources by nutrient" className="no-print">
            <div className="chip-row">
              {(Object.keys(NUTRIENT_LABEL) as Nutrient[]).map((n) => (
                <button key={n} className={`chip${n === nutrient ? " on" : ""}`} onClick={() => setNutrient(n)}>{NUTRIENT_LABEL[n]}</button>
              ))}
            </div>
            <table className="table">
              <thead><tr><th>Food</th><th>per 100 g</th><th>per portion</th></tr></thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.food.id}>
                    <td>{s.food.name}</td>
                    <td>{fmt(s.per100, 1)}{nutrient === "kcal" ? " kcal" : " g"}</td>
                    <td>{fmt(s.perPortion, 1)}{nutrient === "kcal" ? " kcal" : " g"} <span className="muted small">({s.portion.label})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">Sample data – not for clinical use. Micronutrients arrive with the full food composition table.</p>
          </Card>

          {profile?.role === "student" && <PracticeCase />}
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

const CASE: Anthropometrics = { sex: "female", ageYears: 30, weightKg: 70, heightCm: 165 };

function PracticeCase() {
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const correct = calculateBmr("mifflin", CASE);
  const ok = Math.abs(Number(answer) - correct) <= 5;
  return (
    <Card title="Practice case" className="no-print">
      <p>Mrs A is 30 years old, weighs 70 kg and is 165 cm tall. Calculate her BMR using Mifflin-St Jeor.</p>
      <div className="row">
        <input className="grow" inputMode="decimal" placeholder="Your answer (kcal/day)" value={answer} onChange={(e) => { setAnswer(e.target.value); setChecked(false); }} />
        <button className="btn btn-primary" onClick={() => setChecked(true)} disabled={!answer}>Check</button>
      </div>
      {checked && (
        <p className={ok ? "ok" : "error"}>
          {ok ? "✓ Correct!" : "✗ Not quite."} {working("mifflin", CASE)} = {fmt(correct, 2)} kcal/day
        </p>
      )}
    </Card>
  );
}
