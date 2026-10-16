import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <img src="/icon.svg" alt="" width={64} height={64} />
        <h1>Nutrifi</h1>
        <p className="tagline">Eat well, the Naija way.</p>
        <p>Track the foods you really eat — eba, jollof, beans, egusi — in the portions you really eat them.</p>
        <Link to="/start" className="btn btn-primary btn-lg">
          Get started
        </Link>
      </header>
      <section className="landing-grid">
        <div className="card">
          <h2>Track Nigerian foods</h2>
          <p>Log meals with picture-style portion guides: wraps, cooking spoons, pieces.</p>
        </div>
        <div className="card">
          <h2>Know your body</h2>
          <p>See your BMI, a simple daily target, and your water intake at a glance.</p>
        </div>
        <div className="card">
          <h2>For dietitians &amp; students</h2>
          <p>A professional workbench for BMR, energy requirements and calorie distribution.</p>
        </div>
      </section>
      <p className="disclaimer">
        Your health data stays private. Nutrifi supports healthy eating but does not replace medical advice.
      </p>
    </div>
  );
}
