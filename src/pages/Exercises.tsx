import { CheckCircle2, Flame, Plus, Timer, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { PageHeader, SampleNotice, SearchBox, Sheet, StatCard } from "../components/ui";
import { ACTIVITIES, activityById, activityKcal } from "../lib/nutrition";
import { fmt } from "../state/derived";
import { shiftDate, todayIso, useStore, weekDates, type ExerciseStatus } from "../state/store";

const STATUS_LABEL: Record<ExerciseStatus, string> = { completed: "Completed", planned: "Planned", skipped: "Skipped" };
const NEXT_STATUS: Record<ExerciseStatus, ExerciseStatus> = { planned: "completed", completed: "skipped", skipped: "planned" };

export function Exercises() {
  const { exercises, latestWeightKg, addExercise, updateExercise, removeExercise } = useStore();
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExerciseStatus | "all">("all");
  const weight = latestWeightKg ?? 70;
  const kcalOf = (activityId: string, minutes: number) => {
    const a = activityById(activityId);
    return a && minutes > 0 ? activityKcal(a.met, weight, minutes) : 0;
  };

  const thisWeek = new Set(weekDates(todayIso()));
  const lastWeek = new Set(weekDates(shiftDate(todayIso(), -7)));
  const done = exercises.filter((e) => e.status === "completed");
  const weekDone = done.filter((e) => thisWeek.has(e.date));
  const lastDone = done.filter((e) => lastWeek.has(e.date));
  const minutes = weekDone.reduce((t, e) => t + e.minutes, 0);
  const lastMinutes = lastDone.reduce((t, e) => t + e.minutes, 0);
  const kcal = weekDone.reduce((t, e) => t + kcalOf(e.activityId, e.minutes), 0);
  const delta = lastMinutes > 0 ? ((minutes - lastMinutes) / lastMinutes) * 100 : null;

  const q = query.trim().toLowerCase();
  const rows = [...exercises]
    .filter((e) => (status === "all" || e.status === status) && (!q || (activityById(e.activityId)?.name ?? "").toLowerCase().includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page page-wide">
      <PageHeader title="Exercises" subtitle="Log activity and see the energy you burn">
        <SearchBox value={query} onChange={setQuery} placeholder="Search activities" />
        <button className="btn btn-primary" onClick={() => setAdding(true)}><Plus size={18} /> Add exercise</button>
      </PageHeader>

      <div className="stat-row three">
        <StatCard icon={<Timer size={20} />} tone="kcal" label="Active minutes this week" value={fmt(minutes)} unit="min" delta={delta} />
        <StatCard icon={<Flame size={20} />} tone="protein" label="Estimated kcal burned" value={fmt(kcal)} unit="kcal" />
        <StatCard icon={<Trophy size={20} />} tone="carbs" label="Sessions completed" value={String(weekDone.length)} unit={`of 150 min goal: ${Math.min(100, Math.round((minutes / 150) * 100))}%`} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Activity log</h2>
          <div className="chip-group" role="group" aria-label="Status">
            {(["all", "completed", "planned", "skipped"] as const).map((s) => (
              <button key={s} className={`chip${status === s ? " on" : ""}`} onClick={() => setStatus(s)}>{s === "all" ? "All" : STATUS_LABEL[s]}</button>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="empty-state compact">
            <div className="empty-art" aria-hidden>🏃🏾‍♀️</div>
            <p className="muted">No activities yet. A brisk 30-minute walk is a great start.</p>
            <button className="btn btn-primary btn-small" onClick={() => setAdding(true)}><Plus size={15} /> Add your first exercise</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table data-table">
              <thead>
                <tr><th>Exercise</th><th>Date</th><th className="num">Sets</th><th className="num">Reps</th><th className="num">Duration</th><th className="num">Calories</th><th>Status</th><th aria-label="Actions" /></tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const a = activityById(e.activityId);
                  return (
                    <tr key={e.id}>
                      <td><span className="cell-item"><span className="cell-emoji" aria-hidden>{a?.emoji ?? "🏃"}</span>{a?.name ?? e.activityId}</span></td>
                      <td>{new Date(`${e.date}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
                      <td className="num">{e.sets ?? "—"}</td>
                      <td className="num">{e.reps ?? "—"}</td>
                      <td className="num">{e.minutes} min</td>
                      <td className="num">{fmt(kcalOf(e.activityId, e.minutes))} kcal</td>
                      <td>
                        <button className={`status-pill ${e.status === "completed" ? "done" : e.status === "skipped" ? "skipped" : "pending"}`} onClick={() => updateExercise(e.id, { status: NEXT_STATUS[e.status] })} title="Tap to change status">
                          {e.status === "completed" && <CheckCircle2 size={13} />} {STATUS_LABEL[e.status]}
                        </button>
                      </td>
                      <td><button className="icon-btn sm ghost" onClick={() => removeExercise(e.id)} aria-label="Delete"><Trash2 size={15} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <SampleNotice>
        Calories are estimates: MET × your weight ({fmt(weight, 1)} kg) × hours, using the Compendium of Physical Activities.
        Adults are generally advised to get at least 150 minutes of moderate activity a week.
      </SampleNotice>

      {adding && (
        <AddExerciseSheet
          weight={weight}
          onClose={() => setAdding(false)}
          onSave={(e) => {
            addExercise(e);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function AddExerciseSheet({ weight, onClose, onSave }: { weight: number; onClose: () => void; onSave: (e: { date: string; activityId: string; minutes: number; sets?: number; reps?: number; status: ExerciseStatus }) => void }) {
  const [activityId, setActivityId] = useState(ACTIVITIES[1].id);
  const [minutes, setMinutes] = useState("30");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [date, setDate] = useState(todayIso());
  const [status, setStatus] = useState<ExerciseStatus>(date > todayIso() ? "planned" : "completed");
  const a = activityById(activityId)!;
  const mins = Number(minutes);
  const valid = mins > 0 && mins <= 600;
  return (
    <Sheet title="Add exercise" onClose={onClose}>
      <div className="activity-grid">
        {ACTIVITIES.map((x) => (
          <button key={x.id} className={`activity${x.id === activityId ? " on" : ""}`} onClick={() => setActivityId(x.id)}>
            <span aria-hidden>{x.emoji}</span><small>{x.name}</small>
          </button>
        ))}
      </div>
      <div className="two-col">
        <label className="field"><span>Duration (min)</span><input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
        <label className="field"><span>Date</span><input type="date" value={date} onChange={(e) => { setDate(e.target.value); setStatus(e.target.value > todayIso() ? "planned" : "completed"); }} /></label>
      </div>
      {a.kind === "strength" && (
        <div className="two-col">
          <label className="field"><span>Sets (optional)</span><input inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} /></label>
          <label className="field"><span>Reps (optional)</span><input inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} /></label>
        </div>
      )}
      <div className="seg">
        {(["completed", "planned", "skipped"] as const).map((s) => <button key={s} className={s === status ? "on" : ""} onClick={() => setStatus(s)}>{STATUS_LABEL[s]}</button>)}
      </div>
      <p className="muted small">≈ {valid ? fmt(activityKcal(a.met, weight, mins)) : 0} kcal (MET {a.met})</p>
      <button
        className="btn btn-primary btn-block"
        disabled={!valid}
        onClick={() => onSave({ date, activityId, minutes: mins, sets: Number(sets) || undefined, reps: Number(reps) || undefined, status })}
      >
        Save exercise
      </button>
    </Sheet>
  );
}
