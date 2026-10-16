import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Avatar, NAV_ENTRIES } from "../components/Layout";
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
      <header className="page-head" style={{ justifyContent: "flex-start" }}>
        <Avatar name={profile.name} />
        <div className="page-head-title">
        <h1>{profile.name}</h1>
        <p className="muted" style={{ margin: 0 }}>
          {ROLE_LABEL[profile.role]}
          {profile.verification === "verified" && <span className="badge badge-ok"> ✓ Verified</span>}
          {profile.verification === "pending" && <span className="badge"> Verification pending</span>}
        </p>
        </div>
      </header>

      <section className="more-grid" aria-label="All features">
        {NAV_ENTRIES.filter((n) => n.to !== "/home").map((n) => (
          <Link key={n.to} to={n.to} className="more-item">
            <span className="more-icon"><n.icon size={20} /></span>
            <span>{n.label}</span>
          </Link>
        ))}
      </section>

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
      <p className="center"><Link to="/credits" className="link">Photo credits</Link></p>
    </div>
  );
}
