import { useMutation, useQuery } from "convex/react";
import { Check, ExternalLink, FileText, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageHeader } from "../components/ui";

/** Verification review queue for admins (listed in the ADMIN_EMAILS environment variable). */
export function Admin() {
  const pending = useQuery(api.verification.listPending);
  const review = useMutation(api.verification.review);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (id: Id<"verifications">, decision: "verified" | "rejected") => {
    setBusy(id);
    try {
      await review({ id, decision, note: notes[id]?.trim() || undefined });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Verification queue" subtitle="Approve students and dietitians before they can use the Workbench" />
      {pending === undefined ? (
        <p className="muted">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="card empty-state">
          <ShieldCheck size={32} aria-hidden />
          <h2>All caught up</h2>
          <p className="muted">No verification requests waiting.</p>
        </div>
      ) : (
        <ul className="food-rows">
          {pending.map((r) => (
            <li key={r._id} className="card review-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <span className={`tag ${r.role === "dietitian" ? "tag-lunch" : "tag-breakfast"}`}>{r.role === "dietitian" ? "Dietitian" : "Student"}</span>
                  <h3 style={{ margin: "0.4rem 0 0.1rem" }}>{r.name ?? "Unnamed"}</h3>
                  <span className="muted small">{r.email} · submitted {new Date(r.submittedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                </div>
              </div>
              <dl className="details" style={{ margin: "0.75rem 0" }}>
                <dt>{r.role === "dietitian" ? "Licence no." : "Institution / matric"}</dt>
                <dd>{r.credential}</dd>
                <dt>Document</dt>
                <dd>
                  {r.documentUrl ? (
                    <a href={r.documentUrl} target="_blank" rel="noreferrer" className="link"><FileText size={14} aria-hidden /> Open file <ExternalLink size={12} aria-hidden /></a>
                  ) : (
                    <span className="muted">None uploaded</span>
                  )}
                </dd>
              </dl>
              <label className="field" style={{ margin: "0 0 0.75rem" }}>
                <span>Note to the applicant (shown if rejected)</span>
                <input value={notes[r._id] ?? ""} onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })} placeholder="e.g. Licence number not found on the register" />
              </label>
              <div className="row">
                <button className="btn btn-primary btn-small" disabled={busy === r._id} onClick={() => decide(r._id, "verified")}><Check size={15} /> Approve</button>
                <button className="btn btn-danger btn-small" disabled={busy === r._id} onClick={() => decide(r._id, "rejected")}><X size={15} /> Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="sample-notice">
        Check licence numbers against the national dietetics register, and student details against the institution, before approving.
      </p>
    </div>
  );
}
