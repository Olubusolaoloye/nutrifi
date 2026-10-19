import { useEffect, useRef, useState } from "react";
import { errorText } from "../lib/errors";
import type { DietitianCard as Card, ThreadMessage } from "../lib/interventions";
import { Avatar } from "./Layout";
import { MessageBox } from "./MessageBox";

const time = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** A two-person message thread (member ↔ dietitian). */
export function Thread({
  messages,
  onSend,
  disabledReason,
  placeholder = "Write a message…",
}: {
  messages: ThreadMessage[];
  onSend: (text: string) => Promise<void>;
  disabledReason?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ block: "nearest" }), [messages.length]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSend(text);
      setText("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="thread-box">
      <div className="thread-scroll" aria-live="polite">
        {messages.length === 0 && <p className="muted small center">No messages yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.fromMe ? "me" : "them"}`}>
            <p>{m.text}</p>
            <span>{m.fromMe ? "You" : m.senderName} · {time(m.sentAt)}</span>
          </div>
        ))}
        <div ref={end} />
      </div>
      {disabledReason ? (
        <p className="small muted">{disabledReason}</p>
      ) : (
        <MessageBox className="thread-form" value={text} onChange={setText} onSend={submit} busy={busy} placeholder={placeholder} />
      )}
      {error && <p className="small error" role="alert">{error}</p>}
    </div>
  );
}

/** A dietitian's public card. */
export function DietitianInfo({ d, children }: { d: Card; children?: React.ReactNode }) {
  return (
    <div className="dietitian-info">
      <Avatar name={d.name} />
      <div className="grow">
        <strong>{d.name}</strong>
        <span className="small muted">
          ✓ Verified dietitian{d.yearsExperience ? ` · ${d.yearsExperience} yrs` : ""}{d.clientsHelped ? ` · ${d.clientsHelped} clients helped` : ""}
        </span>
        {d.bio && <p className="small">{d.bio}</p>}
        <span className="small muted">Speaks {d.languages.join(", ")}</span>
      </div>
      {children}
    </div>
  );
}
