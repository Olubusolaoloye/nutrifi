// Member-to-member pieces that need an account (Convex): send a plan to a friend, unread badge.
// The plan card works in both modes.
import { useMutation, useQuery } from "convex/react";
import { CalendarPlus, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { recipeById } from "../data/recipes";
import { errorText } from "../lib/errors";
import { applySharedPlan, mealName, planKcalPerDay, SHARE_MEALS, WEEKDAYS, type SharedPlan } from "../lib/share";
import { fmt } from "../state/derived";
import { shiftDate, todayIso, useStore, weekDates } from "../state/store";
import { FriendForm } from "./ShareSheet";

/** Starts (or reopens) a chat by email, sends the plan, then opens the chat. */
export function CloudSendToFriend({ plan }: { plan: SharedPlan }) {
  const start = useMutation(api.social.start);
  const send = useMutation(api.social.send);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <FriendForm
      busy={busy}
      error={error}
      onSend={async (email) => {
        setBusy(true);
        setError(null);
        try {
          const id = await start({ email });
          await send({ conversationId: id, text: "", plan });
          navigate(`/messages?c=${id}`);
        } catch (err) {
          setError(errorText(err));
          setBusy(false);
        }
      }}
    />
  );
}

export function CloudUnreadBadge() {
  const inbox = useQuery(api.social.inbox);
  const n = inbox?.reduce((t, c) => t + c.unread, 0) ?? 0;
  return n ? <span className="nav-badge" aria-label={`${n} unread`}>{n > 99 ? "99+" : n}</span> : null;
}

/** A shared week in a chat: what's in it, and a button to copy it into this week or next. */
export function PlanCard({ plan, fromMe }: { plan: SharedPlan; fromMe: boolean }) {
  const { plan: mine, replacePlan } = useStore();
  const [added, setAdded] = useState<string | null>(null);
  const days = [...new Set(plan.items.map((it) => it.day))].sort((a, b) => a - b);
  const kcal = planKcalPerDay(plan);

  const addTo = (offsetWeeks: number) => {
    const week = weekDates(shiftDate(todayIso(), 7 * offsetWeeks));
    const items = applySharedPlan(plan, week);
    const replaced = items.filter((it) => mine[it.date]?.[it.meal]).length;
    if (replaced && !confirm(`This replaces ${replaced} ${replaced === 1 ? "meal" : "meals"} you already planned that week. Continue?`)) return;
    replacePlan(items);
    setAdded(offsetWeeks === 0 ? "this week" : "next week");
  };

  return (
    <div className="plan-card">
      <div className="plan-card-head">
        <strong>📅 {plan.title}</strong>
        <span className="muted small">{plan.items.length} meals{kcal ? ` · ~${fmt(kcal)} kcal a day` : ""}</span>
      </div>
      <ul>
        {days.map((day) => (
          <li key={day}>
            <span className="plan-card-day">{WEEKDAYS[day].slice(0, 3)}</span>
            <span className="plan-card-meals">
              {SHARE_MEALS.map((m) => {
                const it = plan.items.find((x) => x.day === day && x.meal === m);
                const r = it && recipeById(it.recipeId);
                return r ? <span key={m} title={mealName(m)}>{r.emoji} {r.name}</span> : null;
              })}
            </span>
          </li>
        ))}
      </ul>
      {!fromMe && (added ? (
        <p className="small ok"><Check size={14} aria-hidden /> Added to your plan for {added}.</p>
      ) : (
        <div className="row">
          <button className="btn btn-primary btn-small" onClick={() => addTo(0)}><CalendarPlus size={15} /> Use this week</button>
          <button className="btn btn-secondary btn-small" onClick={() => addTo(1)}>Use next week</button>
        </div>
      ))}
    </div>
  );
}
