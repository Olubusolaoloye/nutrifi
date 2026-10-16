import { useAuthActions } from "@convex-dev/auth/react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";

type Flow = "signIn" | "signUp";

const TIMEOUT_MS = 20000;

/** Reject if the server doesn't answer in time (e.g. no connection), so the button never hangs. */
function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))]);
}

/** Turn Convex Auth errors into plain language. */
function friendly(err: unknown, flow: Flow): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/already exists/i.test(msg)) return "An account with this email already exists. Try signing in.";
  if (/InvalidSecret|InvalidAccountId|Invalid password|could not/i.test(msg))
    return flow === "signIn" ? "That email and password don't match. Please try again." : "We couldn't create your account. Please try again.";
  if (/password/i.test(msg)) return "Please use a password of at least 8 characters.";
  if (/rate|too many/i.test(msg)) return "Too many attempts. Please wait a minute and try again.";
  if (msg === "timeout") return "We can't reach Nutrifi right now. Check your internet connection and try again.";
  return "Something went wrong. Please check your connection and try again.";
}

export function Auth() {
  const { signIn } = useAuthActions();
  const [params] = useSearchParams();
  const [flow, setFlow] = useState<Flow>(params.get("mode") === "signup" ? "signUp" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (flow === "signUp" && password.length < 8) {
      setError("Please use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("email", email.trim().toLowerCase());
      form.set("password", password);
      form.set("flow", flow);
      await withTimeout(signIn("password", form));
      // Routing moves you on once the session is active.
    } catch (err) {
      setError(friendly(err, flow));
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <Link to="/" className="landing-brand" style={{ marginBottom: "1rem", textDecoration: "none", color: "inherit" }}>
        <img src="/icon.svg" alt="" width={32} height={32} /> Nutrifi
      </Link>
      <div className="onboarding-card">
        <h1 style={{ marginBottom: "0.4rem" }}>{flow === "signUp" ? "Create your account" : "Welcome back"}</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          {flow === "signUp" ? "Save your meals, plans and progress across your devices." : "Sign in to pick up where you left off."}
        </p>
        <div className="seg" role="tablist" aria-label="Account" style={{ margin: "1.25rem 0 0.5rem" }}>
          <button role="tab" aria-selected={flow === "signIn"} className={flow === "signIn" ? "on" : ""} onClick={() => { setFlow("signIn"); setError(null); }}>Sign in</button>
          <button role="tab" aria-selected={flow === "signUp"} className={flow === "signUp" ? "on" : ""} onClick={() => { setFlow("signUp"); setError(null); }}>Create account</button>
        </div>
        <form onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <div className="input-icon">
              <Mail size={17} aria-hidden />
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
          </label>
          <label className="field">
            <span>Password</span>
            <div className="input-icon">
              <Lock size={17} aria-hidden />
              <input
                type={show ? "text" : "password"}
                autoComplete={flow === "signUp" ? "new-password" : "current-password"}
                required
                minLength={flow === "signUp" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={flow === "signUp" ? "At least 8 characters" : "Your password"}
              />
              <button type="button" className="icon-btn sm ghost input-trail" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          {error && <p className="error small" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "Please wait…" : flow === "signUp" ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="muted small center" style={{ marginTop: "1rem" }}>
          Your health data is private and protected under the Nigeria Data Protection Act.
        </p>
      </div>
    </div>
  );
}
