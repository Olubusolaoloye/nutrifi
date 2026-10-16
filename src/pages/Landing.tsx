import { Calculator, HeartPulse, Utensils } from "lucide-react";
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-brand">
        <img src="/icon.svg" alt="" width={36} height={36} /> Nutrifi
      </div>
      <header className="landing-hero">
        <div>
          <h1>Eat well, the Naija way.</h1>
          <p className="tagline">Nutrition tracking built for Nigerian food.</p>
          <p className="muted">
            Log the foods you really eat — eba, jollof, beans, egusi — in the portions you really eat them. Know your
            body, drink enough water, and get expert help when you need it.
          </p>
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <Link to="/start" className="btn btn-primary btn-lg">Get started — it's free</Link>
          </div>
        </div>
        <div className="landing-art" aria-hidden>🍲<br />🫘 🍛 🥬</div>
      </header>
      <section className="landing-grid">
        <div className="card">
          <span className="feature-icon tile-kcal"><Utensils size={22} /></span>
          <h2>Track Nigerian foods</h2>
          <p className="muted small">Log meals with local portion guides: wraps, cooking spoons and pieces. Build combos like eba + egusi + beef.</p>
        </div>
        <div className="card">
          <span className="feature-icon tile-carbs"><HeartPulse size={22} /></span>
          <h2>Know your body</h2>
          <p className="muted small">See your BMI, a simple daily target and your water intake at a glance.</p>
        </div>
        <div className="card">
          <span className="feature-icon tile-protein"><Calculator size={22} /></span>
          <h2>For dietitians &amp; students</h2>
          <p className="muted small">A professional workbench for BMR, energy requirements and calorie distribution.</p>
        </div>
      </section>
      <p className="disclaimer">
        Your health data stays private. Nutrifi supports healthy eating but does not replace medical advice.
      </p>
    </div>
  );
}
