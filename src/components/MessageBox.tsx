import { Send } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";

const MAX_LINES_PX = 140;
/** Phones and tablets: Enter adds a line, the Send button sends. */
const touch = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/**
 * A message box that grows with its text (up to about five lines).
 * On a computer Enter sends and Shift+Enter adds a new line; on a phone Enter adds a new line.
 */
export function MessageBox({
  value,
  onChange,
  onSend,
  busy,
  placeholder = "Write a message…",
  before,
  className = "chat-input",
}: {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  busy?: boolean;
  placeholder?: string;
  /** Extra buttons before the text box, e.g. attach a plan. */
  before?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_LINES_PX)}px`;
  }, [value]);

  const ready = !busy && value.trim().length > 0;
  return (
    <form className={className} onSubmit={(e) => { e.preventDefault(); if (ready) onSend(); }}>
      {before}
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !touch()) {
            e.preventDefault();
            if (ready) onSend();
          }
        }}
        placeholder={placeholder}
        aria-label="Message"
        maxLength={2000}
      />
      <button className="btn btn-primary btn-small" disabled={!ready} aria-label="Send"><Send size={15} /> <span className="send-label">Send</span></button>
    </form>
  );
}
