import { ArrowLeft, Info, Paperclip, Phone, Send, ShieldCheck, Video } from "lucide-react";
import { useState } from "react";
import { PageHeader, SearchBox } from "../components/ui";

/** SAMPLE threads to preview dietitian messaging. Not real people or conversations. */
interface Thread {
  id: string;
  name: string;
  role: string;
  initials: string;
  tone: string;
  time: string;
  unread: number;
  about: string;
  messages: Array<{ from: "them" | "me"; text: string; time: string }>;
}

const THREADS: Thread[] = [
  {
    id: "dietitian", name: "Your dietitian", role: "Registered dietitian", initials: "RD", tone: "var(--tile-kcal)", time: "9:40 AM", unread: 2,
    about: "Verified dietitians will set your targets, review your diary and adjust your plan during a paid intervention.",
    messages: [
      { from: "them", text: "Good morning! I looked at your diary from last week. Great job adding vegetables to your soups 👏🏾", time: "9:30 AM" },
      { from: "me", text: "Thank you! I struggled a bit with late dinners.", time: "9:34 AM" },
      { from: "them", text: "That's common. Let's try moving dinner to before 8pm on weekdays and keep a fruit snack for the evening.", time: "9:40 AM" },
    ],
  },
  {
    id: "coach", name: "Nutrition coach", role: "Lifestyle coach", initials: "NC", tone: "var(--tile-carbs)", time: "Yesterday", unread: 0,
    about: "Coaches help with habits and motivation alongside your dietitian's plan.",
    messages: [
      { from: "them", text: "How did the 30-minute walks go this week?", time: "6:10 PM" },
      { from: "me", text: "Did 4 out of 5 days!", time: "6:22 PM" },
      { from: "them", text: "Brilliant — that's real progress. Same target next week?", time: "6:25 PM" },
    ],
  },
  {
    id: "support", name: "Nutrintel support", role: "Help & feedback", initials: "N", tone: "var(--tile-protein)", time: "Mon", unread: 0,
    about: "Questions about your account, payments or the app.",
    messages: [{ from: "them", text: "Welcome to Nutrintel! Messaging with verified dietitians is coming with paid interventions.", time: "10:00 AM" }],
  },
];

export function Messages() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const threads = THREADS.filter((t) => !q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q));
  const active = THREADS.find((t) => t.id === activeId) ?? null;
  const desktopActive = active ?? THREADS[0];

  return (
    <div className="page page-wide">
      <PageHeader title="Messages" subtitle="Chat with your dietitian and coach" />
      <div className="banner banner-info" role="note">
        <Info size={16} aria-hidden /> Preview: messaging with verified dietitians launches with paid interventions. These are sample conversations.
      </div>
      <div className={`chat-layout${active ? " has-active" : ""}`}>
        <section className="card chat-list">
          <SearchBox value={query} onChange={setQuery} placeholder="Search name or role" />
          <ul>
            {threads.map((t) => (
              <li key={t.id}>
                <button className={`thread${desktopActive.id === t.id ? " on" : ""}`} onClick={() => setActiveId(t.id)}>
                  <span className="avatar" style={{ background: t.tone }} aria-hidden>{t.initials}</span>
                  <span className="grow thread-body">
                    <span className="row" style={{ justifyContent: "space-between" }}>
                      <strong>{t.name}</strong>
                      <span className="muted small">{t.time}</span>
                    </span>
                    <span className="muted small">{t.role}</span>
                    <span className="thread-preview">{t.messages.at(-1)?.text}</span>
                  </span>
                  {t.unread > 0 && <span className="unread" aria-label={`${t.unread} unread`}>{t.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card chat-thread">
          <header className="chat-head">
            <button className="icon-btn sm ghost show-xs" onClick={() => setActiveId(null)} aria-label="Back"><ArrowLeft size={16} /></button>
            <span className="avatar" style={{ background: desktopActive.tone }} aria-hidden>{desktopActive.initials}</span>
            <div className="grow">
              <strong>{desktopActive.name}</strong>
              <span className="muted small" style={{ display: "block" }}>{desktopActive.role} · sample</span>
            </div>
            <button className="icon-btn sm" disabled aria-label="Voice call (coming soon)"><Phone size={15} /></button>
            <button className="icon-btn sm" disabled aria-label="Video call (coming soon)"><Video size={15} /></button>
          </header>
          <div className="chat-body">
            <span className="chat-day">Today</span>
            {desktopActive.messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                <p>{m.text}</p>
                <span>{m.time}</span>
              </div>
            ))}
          </div>
          <footer className="chat-input">
            <button className="icon-btn sm ghost" disabled aria-label="Attach (coming soon)"><Paperclip size={16} /></button>
            <input disabled placeholder="Messaging opens with paid interventions" aria-label="Message" />
            <button className="btn btn-primary btn-small" disabled><Send size={15} /> Send</button>
          </footer>
        </section>

        <aside className="card chat-profile">
          <span className="avatar lg" style={{ background: desktopActive.tone }} aria-hidden>{desktopActive.initials}</span>
          <strong>{desktopActive.name}</strong>
          <span className="tag tag-breakfast">{desktopActive.role}</span>
          <h3>About</h3>
          <p className="small muted">{desktopActive.about}</p>
          <p className="small row"><ShieldCheck size={15} aria-hidden /> Every Nutrintel dietitian's licence is verified.</p>
        </aside>
      </div>
    </div>
  );
}
