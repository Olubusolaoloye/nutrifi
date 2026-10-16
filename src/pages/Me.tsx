import { useNavigate } from "react-router-dom";
import { Card, Disclaimer, Locked } from "../components/ui";
import { CONDITION_LABEL, PAL } from "../lib/nutrition";
import { bodySummary, fmt } from "../state/derived";
import { canUseWorkbench, useStore } from "../state/store";

const ROLE_LABEL = { consumer: "Member", student: "Nutrition student", dietitian: "Dietitian" };

export function Me() {
  const navigate = useNavigate();
  const { profile, latestWeightKg, updateProfile, resetAll } = useStore();
  if (!profile || latestWeightKg === null) return null;
  const s = bodySummary(profile, latestWeightKg);
  const isPro = profile.role !== "consumer";

  return (
    <div className="page">
      <header className="page-head">
        <h1>{profile.name}</h1>
        <p className="muted">
          {ROLE_LABEL[profile.role]}
          {profile.verification === "verified" && <span className="badge badge-ok"> ✓ Verified</span>}
          {profile.verification === "pending" && <span className="badge"> Verification pending</span>}
        </p>
      </header>

      <Card title="My details">
        <dl className="details">
          <dt>Age</dt><dd>{s.ageYears}</dd>
          <dt>Height</dt><dd>{profile.heightCm} cm</dd>
          <dt>Weight</dt><dd>{fmt(latestWeightKg, 1)} kg</dd>
          <dt>Activity</dt><dd>{PAL[profile.activity].consumerLabel}</dd>
          <dt>Conditions</dt><dd>{profile.conditions.length ? profile.conditions.map((c) => CONDITION_LABEL[c]).join(", ") : "None"}</dd>
          <dt>Daily target</dt><dd>{s.target.kind === "target" ? `about ${fmt(s.target.kcal)} kcal` : "Set by a dietitian"}</dd>
        </dl>
      </Card>

      {canUseWorkbench(profile) ? (
        <Card title="Professional Workbench" className="card-accent">
          <button className="btn btn-primary" onClick={() => navigate("/workbench")}>Open Workbench</button>
        </Card>
      ) : isPro ? (
        <Card title="Verification">
          <p className="small">We're reviewing your details. The Workbench unlocks once you're verified.</p>
          {/* Prototype only: there is no review backend yet. */}
          <button className="btn btn-secondary" onClick={() => updateProfile({ verification: "verified" })}>
            Demo: approve my verification
          </button>
        </Card>
      ) : (
        <Locked />
      )}

      <Card title="Privacy & data">
        <p className="small">Your data is stored on this device for now. Account sync is coming soon.</p>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm("Delete all your Nutrifi data on this device?")) {
              resetAll();
              navigate("/");
            }
          }}
        >
          Delete my data
        </button>
      </Card>
      <Disclaimer />
    </div>
  );
}
