import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Ban, CalendarRange, HeartPulse, MessageCirclePlus, Share2, ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { MessageBox } from "../components/MessageBox";
import { PlanCard } from "../components/Social";
import { Avatar } from "../components/Layout";
import { PageHeader, SearchBox, Sheet } from "../components/ui";
import { errorText } from "../lib/errors";
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
  const list = (inbox ?? []).filter((c) => !q || c.name.toLowerCase().includes(q));
  const active = inbox?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="page page-wide">
      <PageHeader title="Messages" subtitle="Chat with friends and share your meal plan">
        <button className="btn btn-primary" onClick={() => setComposing(true)}><MessageCirclePlus size={18} /> New message</button>
      </PageHeader>
      <div className={`chat-layout${activeId ? " has-active" : ""}`}>
        <section className="card chat-list">
          <SearchBox value={query} onChange={setQuery} placeholder="Search chats" />
          {inbox === undefined ? (
            <p className="muted small">Loading…</p>
          ) : list.length === 0 ? (
            <p className="muted small chat-empty">{q ? "No chats match." : "No messages yet. Start one with a friend's email, or send them your meal plan."}</p>
          ) : (
            <ul>
              {list.map((c) => (
                <li key={c.id}>
                  <button className={`thread${c.id === activeId ? " on" : ""}`} onClick={() => open(c.id)}>
                    <Avatar name={c.name} />
                    <span className="grow thread-body">
                      <span className="row" style={{ justifyContent: "space-between" }}>
                        <strong>{c.name}</strong>
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
  const start = useMutation(api.social.start);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Sheet title="New message" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            onOpen(await start({ email }));
          } catch (err) {
            setError(errorText(err));
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>Your friend's email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email they use for Nutrintel" autoFocus />
        </label>
        {error && <p className="small error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy || !email.trim()}>{busy ? "Looking…" : "Start chat"}</button>
        <p className="small muted center">They need a Nutrintel account. Only you two can see the chat.</p>
      </form>
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
  const [picking, setPicking] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const count = t?.messages.length ?? 0;

  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;
  // Mark read when the chat opens and whenever a message arrives.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
    if (count) void markReadRef.current({ conversationId }).catch(() => {});
  }, [count, conversationId]);

  const deliver = async (body: { text: string; plan?: SharedPlan }) => {
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
        <button className="icon-btn sm ghost show-xs" onClick={onBack} aria-label="Back to chats"><ArrowLeft size={16} /></button>
        <Avatar name={t?.name ?? "?"} />
        <div className="grow">
          <strong>{t?.name ?? "…"}</strong>
          <span className="muted small" style={{ display: "block" }}>Nutrintel member</span>
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
          <div key={m.id} className={`bubble ${m.fromMe ? "me" : "them"}${m.plan ? " has-plan" : ""}`}>
            {m.plan && <PlanCard plan={m.plan} fromMe={m.fromMe} />}
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
          before={<button type="button" className="icon-btn sm ghost" onClick={() => setPicking(true)} aria-label="Send my meal plan" title="Send my meal plan"><CalendarRange size={17} /></button>}
        />
      )}
      {error && <p className="small error chat-error" role="alert">{error}</p>}
      {picking && <PickWeek onClose={() => setPicking(false)} onSend={async (plan) => { if (await deliver({ text: "", plan })) setPicking(false); }} />}
    </section>
  );
}

/** Choose which week of your plan to send. */
function PickWeek({ onClose, onSend }: { onClose: () => void; onSend: (plan: SharedPlan) => void }) {
  const { plan, planPortions } = useStore();
  const weeks = [0, 1].map((offset) => ({ offset, shared: planSnapshot(plan, planPortions, weekDates(shiftDate(todayIso(), 7 * offset))) }));
  return (
    <Sheet title="Send my meal plan" onClose={onClose}>
      <ul className="food-rows">
        {weeks.map(({ offset, shared }) => (
          <li key={offset}>
            <button className="food-row" disabled={!shared.items.length} onClick={() => onSend(shared)}>
              <span className="thumb sm" aria-hidden><span className="thumb-emoji">📅</span></span>
              <div className="food-row-body">
                <strong>{offset === 0 ? "This week" : "Next week"} · {shared.title}</strong>
                <span className="muted small">{shared.items.length ? `${shared.items.length} planned meals` : "Nothing planned yet"}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="small muted">Plan a week on the <Link to="/plan">Meal plan</Link> page first if both are empty.</p>
    </Sheet>
  );
}
