import { Calculator, HeartPulse, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import { CUISINES, FOODS } from "../data/foods";
import { BMR_EQUATION_INFO } from "../lib/nutrition";

export function Landing() {
  return (
    <div className="landing">
      <div className="landing-brand">
        <img src="/icon.svg" alt="" width={36} height={36} /> Nutrifi
      </div>
      <header className="landing-hero">
        <div>
          <h1>Eat well, <em>the Naija way.</em></h1>
          <p className="tagline">Nutrition tracking built for Nigerian food — and everything else you love.</p>
          <p className="muted">
            Log the foods you really eat — eba, jollof, egusi, shawarma, pasta — in the portions you really eat them. Know your
            body, drink enough water, and get expert help when you need it.
          </p>
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <Link to="/start" className="btn btn-primary btn-lg">Get started — it's free</Link>
          </div>
          <div className="stats-strip">
            <div><strong>{FOODS.length}</strong><span>dishes with portion guides</span></div>
            <div><strong>{CUISINES.length}</strong><span>cuisines: Naija, Continental, International</span></div>
            <div><strong>{Object.keys(BMR_EQUATION_INFO).length}</strong><span>BMR equations for pros</span></div>
          </div>
        </div>
        <div className="landing-art" aria-hidden>🍲 🍛<br />🥗 🌯 🍝</div>
      </header>
      <section className="landing-grid">
        <div className="card">
          <span className="feature-icon tile-kcal"><Utensils size={22} /></span>
          <h2>Track Nigerian foods</h2>
          <p className="muted small">Log meals with local portion guides: wraps, cooking spoons and pieces. Naija, continental and international dishes, plus combos like eba + egusi + beef.</p>
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
