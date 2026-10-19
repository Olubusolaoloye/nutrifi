import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Ban, CalendarRange, HeartPulse, MessageCirclePlus, Share2, ShieldCheck, ShoppingBasket, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { MessageBox } from "../components/MessageBox";
import { GroceryCard, PeoplePicker, PlanCard } from "../components/Social";
import { Avatar } from "../components/Layout";
import { PageHeader, SearchBox, Sheet } from "../components/ui";
import { errorText } from "../lib/errors";
import { grocerySnapshot, weekGroceryLines, type SharedGrocery } from "../lib/grocery";
import { planSnapshot, type SharedPlan } from "../lib/share";
import { shiftDate, todayIso, useStore, weekDates } from "../state/store";

export function Messages() {
  const { mode } = useStore();
  return mode === "cloud" ? <CloudMessages /> : <LocalMessages />;
}

const when = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA") === todayIso()
    ? d.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

/** Without accounts there's no one to message, but sharing still works. */
function LocalMessages() {
  return (
    <div className="page">
      <PageHeader title="Messages" subtitle="Chat with friends and share your journey" />
      <div className="card empty-state">
        <div className="empty-art" aria-hidden>💬</div>
        <h2>Messaging needs a Nutrintel account</h2>
        <p className="muted">This version saves everything on your device. You can still share your meal plan and progress on WhatsApp and Instagram.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link to="/plan?share=1" className="btn btn-primary"><CalendarRange size={18} /> Share my meal plan</Link>
          <Link to="/progress?share=1" className="btn btn-secondary"><TrendingUp size={18} /> Share my journey</Link>
        </div>
      </div>
    </div>
  );
}

function CloudMessages() {
  const [params, setParams] = useSearchParams();
  const inbox = useQuery(api.social.inbox);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);
  const activeId = params.get("c");
  const open = (id: string | null) => setParams(id ? { c: id } : {}, { replace: !id });
  const q = query.trim().toLowerCase();
  const list = (inbox ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || (c.username ?? "").includes(q.replace(/^@/, "")));
  const active = inbox?.find((c) => c.id === activeId) ?? null;
  // On phones an open chat fills the screen, without the tab bar (see .chat-open in styles.css).
  useEffect(() => {
    if (!activeId) return;
    document.body.classList.add("chat-open");
    return () => document.body.classList.remove("chat-open");
  }, [activeId]);

  return (
    <div className="page page-wide">
      <PageHeader title="Messages" subtitle="Chat with friends and share your meal plan">
        <button className="btn btn-primary" onClick={() => setComposing(true)}><MessageCirclePlus size={18} /> New message</button>
      </PageHeader>
      <div className={`chat-layout${activeId ? " has-active" : ""}`}>
        <section className="card chat-list">
          <SearchBox value={query} onChange={setQuery} placeholder="Search chats by name or @username" />
          {inbox === undefined ? (
            <p className="muted small">Loading…</p>
          ) : list.length === 0 ? (
            <p className="muted small chat-empty">{q ? "No chats match." : "No messages yet. Find a friend by their @username, or send them your meal plan."}</p>
          ) : (
            <ul>
              {list.map((c) => (
                <li key={c.id}>
                  <button className={`thread${c.id === activeId ? " on" : ""}`} onClick={() => open(c.id)}>
                    <Avatar name={c.name} />
                    <span className="grow thread-body">
                      <span className="row" style={{ justifyContent: "space-between" }}>
                        <strong>{c.name}{c.username && <span className="muted handle"> @{c.username}</span>}</strong>
                        <span className="muted small">{when(c.lastAt)}</span>
                      </span>
                      <span className="thread-preview">{c.blocked ? "Blocked" : c.lastText ? `${c.lastFromMe ? "You: " : ""}${c.lastText}` : "Say hello 👋"}</span>
                    </span>
                    {c.unread > 0 && <span className="unread" aria-label={`${c.unread} unread`}>{c.unread}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="small muted chat-note"><HeartPulse size={14} aria-hidden />Chats with your dietitian are inside your <Link to="/programmes">programme</Link>.</p>
        </section>

        {active ? (
          <ThreadView key={active.id} id={active.id} onBack={() => open(null)} />
        ) : (
          <section className="card chat-thread chat-placeholder">
            {activeId && inbox ? <p className="muted">This chat isn't available.</p> : (
              <>
                <div className="empty-art" aria-hidden>💬</div>
                <p className="muted">Pick a chat, or start a new one to share your meal plan with a friend.</p>
              </>
            )}
          </section>
        )}

        <aside className="card chat-profile">
          <span className="avatar lg" aria-hidden>💚</span>
          <strong>Share your journey</strong>
          <p className="small muted">Send a week of your meal plan and your friend can add it to their own plan in one tap.</p>
          <Link to="/progress?share=1" className="btn btn-secondary btn-small"><Share2 size={15} /> Share my progress</Link>
          <p className="small chat-note"><ShieldCheck size={15} aria-hidden />Only the people in a chat can read it. Block anyone who bothers you.</p>
        </aside>
      </div>
      {composing && <NewChat onClose={() => setComposing(false)} onOpen={(id) => { setComposing(false); open(id); }} />}
    </div>
  );
}

function NewChat({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  const { profile } = useStore();
  const start = useMutation(api.social.start);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet title="New message" onClose={onClose}>
      <PeoplePicker
        label="Find a friend by username"
        autoFocus
        busy={busy}
        error={error}
        onPick={async (username) => {
          setBusy(true);
          setError(null);
          try {
            onOpen(await start({ username }));
          } catch (err) {
            setError(errorText(err));
            setBusy(false);
          }
        }}
      />
      {profile?.username && (
        <p className="small muted center">Your username is <strong>@{profile.username}</strong>. Share it so friends can find you.</p>
      )}
    </Sheet>
  );
}

function ThreadView({ id, onBack }: { id: string; onBack: () => void }) {
  const conversationId = id as Id<"conversations">;
  const t = useQuery(api.social.thread, { conversationId });
  const send = useMutation(api.social.send);
  const markRead = useMutation(api.social.markRead);
  const setBlocked = useMutation(api.social.setBlocked);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<"plan" | "grocery" | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const count = t?.messages.length ?? 0;

  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;
  // Mark read when the chat opens and whenever a message arrives.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
    if (count) void markReadRef.current({ conversationId }).catch(() => {});
  }, [count, conversationId]);

  const deliver = async (body: { text: string; plan?: SharedPlan; grocery?: SharedGrocery; checked?: string[] }) => {
    setBusy(true);
    setError(null);
    try {
      await send({ conversationId, ...body });
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (await deliver({ text })) setText("");
  };

  return (
    <section className="card chat-thread">
      <header className="chat-head">
        <button className="icon-btn sm ghost chat-back" onClick={onBack} aria-label="Back to chats"><ArrowLeft size={16} /></button>
        <Avatar name={t?.name ?? "?"} />
        <div className="grow">
          <strong>{t?.name ?? "…"}</strong>
          <span className="muted small" style={{ display: "block" }}>{t?.username ? `@${t.username}` : "Nutrintel member"}</span>
        </div>
        {t && (!t.blocked || t.blockedByMe) && (
          <button
            className="btn btn-ghost btn-small"
            onClick={() => {
              if (t.blockedByMe || confirm(`Block ${t.name}? Neither of you will be able to send messages in this chat.`)) {
                void setBlocked({ conversationId, blocked: !t.blockedByMe });
              }
            }}
          >
            <Ban size={15} /> {t.blockedByMe ? "Unblock" : "Block"}
          </button>
        )}
      </header>
      <div className="chat-body" aria-live="polite">
        {t === undefined && <p className="muted small center">Loading…</p>}
        {t?.messages.length === 0 && <p className="muted small center">No messages yet. Say hello, or send your meal plan.</p>}
        {t?.messages.map((m) => (
          <div key={m.id} className={`bubble ${m.fromMe ? "me" : "them"}${m.plan || m.grocery ? " has-plan" : ""}`}>
            {m.plan && <PlanCard plan={m.plan} fromMe={m.fromMe} />}
            {m.grocery && <GroceryCard messageId={m.id} grocery={m.grocery as SharedGrocery} checked={m.checked} disabled={t.blocked} />}
            {m.text && <p>{m.text}</p>}
            <span>{m.fromMe ? "You" : t.name} · {when(m.sentAt)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      {t?.blocked ? (
        <p className="small muted chat-blocked">{t.blockedByMe ? "You blocked this chat. Unblock to send messages." : "You can't send messages in this chat."}</p>
      ) : (
        <MessageBox
          value={text}
          onChange={setText}
          onSend={submit}
          busy={busy}
          before={
            <>
              <button type="button" className="icon-btn sm ghost" onClick={() => setPicking("plan")} aria-label="Send my meal plan" title="Send my meal plan"><CalendarRange size={17} /></button>
              <button type="button" className="icon-btn sm ghost" onClick={() => setPicking("grocery")} aria-label="Send my grocery list" title="Send my grocery list"><ShoppingBasket size={17} /></button>
            </>
          }
        />
      )}
      {error && <p className="small error chat-error" role="alert">{error}</p>}
      {picking && <PickWeek what={picking} onClose={() => setPicking(null)} onSend={async (body) => { if (await deliver({ text: "", ...body })) setPicking(null); }} />}
    </section>
  );
}

/** Choose which week of your plan, or of your grocery list, to send. */
function PickWeek({ what, onClose, onSend }: { what: "plan" | "grocery"; onClose: () => void; onSend: (body: { plan: SharedPlan } | { grocery: SharedGrocery; checked: string[] }) => void }) {
  const { plan, planPortions, grocery } = useStore();
  const weeks = [0, 1].map((offset) => {
    const dates = weekDates(shiftDate(todayIso(), 7 * offset));
    if (what === "plan") {
      const shared = planSnapshot(plan, planPortions, dates);
      return { offset, title: shared.title, count: shared.items.length, label: "planned meals", body: { plan: shared } };
    }
    const lines = weekGroceryLines(plan, planPortions, grocery, dates);
    const shared = grocerySnapshot(lines, grocery.people, dates[0]);
    const checked = lines.filter((l) => grocery.purchased[l.key]).map((l) => l.key);
    return { offset, title: shared.title, count: shared.items.length, label: "items to buy", body: { grocery: shared, checked } };
  });
  return (
    <Sheet title={what === "plan" ? "Send my meal plan" : "Send my grocery list"} onClose={onClose}>
      <ul className="food-rows">
        {weeks.map((w) => (
          <li key={w.offset}>
            <button className="food-row" disabled={!w.count} onClick={() => onSend(w.body)}>
              <span className="thumb sm" aria-hidden><span className="thumb-emoji">{what === "plan" ? "📅" : "🧺"}</span></span>
              <div className="food-row-body">
                <strong>{w.offset === 0 ? "This week" : "Next week"} · {w.title}</strong>
                <span className="muted small">{w.count ? `${w.count} ${w.label}` : "Nothing planned yet"}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="small muted">
        {what === "plan" ? "Plan a week on the " : "Your grocery list comes from your "}<Link to="/plan">Meal plan</Link>{what === "plan" ? " page first if both are empty." : ". Plan some meals first if both are empty."}
      </p>
    </Sheet>
  );
}
