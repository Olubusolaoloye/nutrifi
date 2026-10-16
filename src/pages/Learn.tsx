import { ArrowLeft, Clock, Share2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader, Thumb } from "../components/ui";
import { ARTICLES, type ArticleScope } from "../data/articles";

const SCOPES: Array<ArticleScope | "All"> = ["All", "Global", "Nigeria", "Prevention"];
const SCOPE_EMOJI: Record<ArticleScope, string> = { Global: "🌍", Nigeria: "🇳🇬", Prevention: "🛡️" };
const ARTICLE_EMOJI: Record<string, string> = { "swallow-portions": "🫓", "water-sachets": "💧", "salt-bp": "🧂", "fruit-veg": "🥬" };

export function Learn() {
  const [scope, setScope] = useState<ArticleScope | "All">("All");
  const items = ARTICLES.filter((a) => scope === "All" || a.scope === scope);
  return (
    <div className="page">
      <PageHeader title="Learn" subtitle="Nutrition news and tips, reviewed by dietitians">
        <div className="chip-group" role="group" aria-label="Filter">
          {SCOPES.map((s) => (
            <button key={s} className={`chip${s === scope ? " on" : ""}`} onClick={() => setScope(s)}>
              {s === "Prevention" ? "Prevention tips" : s}
            </button>
          ))}
        </div>
      </PageHeader>
      <div className="grid">
        {items.map((a) => (
          <Link key={a.id} to={`/learn/${a.id}`} className="card article-card">
            <Thumb emoji={ARTICLE_EMOJI[a.id] ?? SCOPE_EMOJI[a.scope]} />
            <div>
              <div className="food-row-top">
                <span className="tag tag-outline">{SCOPE_EMOJI[a.scope]} {a.scope}</span>
                <span className="muted small row" style={{ gap: "0.25rem" }}><Clock size={13} /> {a.readMinutes} min</span>
              </div>
              <h2>{a.title}</h2>
              <p className="muted small">{a.summary}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ArticlePage() {
  const { id } = useParams();
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) return <div className="page"><p>Article not found. <Link to="/learn">Back to Learn</Link></p></div>;
  const shareText = encodeURIComponent(`${a.title} — ${window.location.href}`);
  return (
    <article className="page article">
      <Link to="/learn" className="btn btn-ghost btn-small"><ArrowLeft size={16} /> Learn</Link>
      <div className="card">
        <Thumb emoji={ARTICLE_EMOJI[a.id] ?? SCOPE_EMOJI[a.scope]} size="lg" />
        <div className="food-row-top" style={{ marginTop: "1rem" }}>
          <span className="tag tag-outline">{a.scope}</span>
          <span className="badge badge-ok"><ShieldCheck size={13} /> Dietitian review pending</span>
        </div>
        <h1>{a.title}</h1>
        {a.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <p className="muted small">{a.source}</p>
        <a className="btn btn-primary" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
          <Share2 size={16} /> Share on WhatsApp
        </a>
      </div>
    </article>
  );
}
