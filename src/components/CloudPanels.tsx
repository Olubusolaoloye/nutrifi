// Account panels for cloud mode. They use Convex hooks, so render them only when mode === "cloud".
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { CloudUpload, FileCheck2, LogOut, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { clearLocalData, localDataForImport } from "../state/cloudStore";
import { useStore } from "../state/store";
import { Card } from "./ui";

const MAX_UPLOAD_MB = 8;

export function AccountCard() {
  const { account } = useStore();
  const { signOut } = useAuthActions();
  return (
    <Card title="Account" action={<span className="badge badge-ok"><CloudUpload size={13} aria-hidden /> Synced</span>}>
      <p className="small" style={{ marginTop: 0 }}>
        Signed in as <strong>{account?.email ?? "your account"}</strong>. Your data is saved securely and syncs across your devices.
      </p>
      <button className="btn btn-secondary" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button>
    </Card>
  );
}

export function ImportCard() {
  const importLocal = useMutation(api.importLocal.importLocal);
  const [local, setLocal] = useState(() => localDataForImport());
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  if (!local && state !== "done") return null;

  return (
    <Card title="Bring your on-device data" className="card-accent">
      {state === "done" ? (
        <p className="ok small" style={{ margin: 0 }}>✓ {message}</p>
      ) : (
        <>
          <p className="small" style={{ marginTop: 0 }}>
            We found {local!.count} item{local!.count === 1 ? "" : "s"} saved on this device from before you had an account. Add them to your account?
          </p>
          {state === "error" && <p className="error small">{message}</p>}
          <div className="row">
            <button
              className="btn btn-primary"
              disabled={state === "busy"}
              onClick={async () => {
                setState("busy");
                try {
                  const res = await importLocal(local!.payload);
                  clearLocalData();
                  setLocal(null);
                  setMessage(`Imported ${res.imported} items into your account.`);
                  setState("done");
                } catch (e) {
                  setMessage(e instanceof Error ? e.message.replace(/^.*ConvexError: /, "") : "Import failed.");
                  setState("error");
                }
              }}
            >
              <UploadCloud size={16} /> {state === "busy" ? "Importing…" : "Import"}
            </button>
            <button className="btn btn-ghost" onClick={() => { clearLocalData(); setLocal(null); }}>Discard</button>
          </div>
        </>
      )}
    </Card>
  );
}

export function VerificationCard() {
  const { profile, verificationInfo } = useStore();
  const generateUploadUrl = useMutation(api.verification.generateUploadUrl);
  const submit = useMutation(api.verification.submit);
  const fileRef = useRef<HTMLInputElement>(null);
  const [credential, setCredential] = useState(verificationInfo?.credential ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile || profile.role === "consumer") return null;

  const status = profile.verification;
  const isStudent = profile.role === "student";
  const canSubmit = status === "none" || status === "rejected" || (status === "pending" && !verificationInfo?.hasDocument);

  const send = async () => {
    setError(null);
    if (credential.trim().length < 3) return setError(isStudent ? "Enter your institution and matric number." : "Enter your licence or registration number.");
    if (file && file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`That file is over ${MAX_UPLOAD_MB} MB.`);
    setBusy(true);
    try {
      let documentId: Id<"_storage"> | undefined;
      if (file) {
        const url = await generateUploadUrl();
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
        if (!res.ok) throw new Error("Upload failed. Please try again.");
        documentId = ((await res.json()) as { storageId: Id<"_storage"> }).storageId;
      }
      await submit({ credential: credential.trim(), documentId });
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^.*ConvexError: /, "").replace(/\s*Called by client$/, "") : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Verification" action={<ShieldCheck size={18} aria-hidden />}>
      {status === "verified" && <p className="ok small" style={{ margin: 0 }}>✓ You're verified. The Professional Workbench is unlocked.</p>}
      {status === "pending" && (
        <p className="small" style={{ marginTop: 0 }}>
          ⏳ We're reviewing <strong>{verificationInfo?.credential}</strong>
          {verificationInfo?.hasDocument ? " and your document" : ""}. This usually takes 1–2 working days.
        </p>
      )}
      {status === "rejected" && (
        <p className="error small" style={{ marginTop: 0 }}>
          We couldn't verify your details{verificationInfo?.reviewerNote ? `: ${verificationInfo.reviewerNote}` : "."} Please check and resubmit.
        </p>
      )}
      {status === "none" && (
        <p className="small" style={{ marginTop: 0 }}>
          Verify your {isStudent ? "student status" : "licence"} to unlock the Professional Workbench.
        </p>
      )}

      {canSubmit && (
        <>
          <label className="field">
            <span>{isStudent ? "Institution and matric number" : "Licence / registration number"}</span>
            <input value={credential} onChange={(e) => setCredential(e.target.value)} placeholder={isStudent ? "e.g. UNN, 2022/123456" : "e.g. DT/12345"} />
          </label>
          <div className="field">
            <span>{isStudent ? "Student ID or admission letter" : "Licence certificate"} (photo or PDF, optional but faster)</span>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <button type="button" className="upload-drop" onClick={() => fileRef.current?.click()}>
              {file ? <><FileCheck2 size={18} /> {file.name}</> : <><UploadCloud size={18} /> Choose a file (max {MAX_UPLOAD_MB} MB)</>}
            </button>
          </div>
          {error && <p className="error small" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={busy} onClick={send}>
            {busy ? "Sending…" : status === "pending" ? "Add document" : "Submit for review"}
          </button>
        </>
      )}
    </Card>
  );
}

export function CloudDeleteCard() {
  const { resetAll } = useStore();
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  return (
    <Card title="Privacy & data">
      <p className="small" style={{ marginTop: 0 }}>
        Your health data is stored securely in your account and is never sold or shared. You can delete it at any time.
      </p>
      <div className="row">
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={async () => {
            if (!confirm("Delete all your logs, plans and profile? Your sign-in stays so you can start fresh.")) return;
            setBusy(true);
            await resetAll();
            navigate("/start");
          }}
        >
          <Trash2 size={16} /> Delete my data
        </button>
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={async () => {
            if (!confirm("Permanently delete your account and all your data? This can't be undone.")) return;
            setBusy(true);
            await resetAll({ deleteAccount: true });
            await signOut();
            navigate("/");
          }}
        >
          Delete account
        </button>
      </div>
    </Card>
  );
}
