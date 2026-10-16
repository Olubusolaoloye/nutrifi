import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ARTICLES, type ArticleScope } from "../data/articles";

const SCOPES: Array<ArticleScope | "All"> = ["All", "Global", "Nigeria", "Prevention"];

export function Learn() {
  const [scope, setScope] = useState<ArticleScope | "All">("All");
  const items = ARTICLES.filter((a) => scope === "All" || a.scope === scope);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Learn</h1>
        <div className="chip-row">
          {SCOPES.map((s) => (
            <button key={s} className={`chip${s === scope ? " on" : ""}`} onClick={() => setScope(s)}>
              {s === "Prevention" ? "Prevention tips" : s}
            </button>
          ))}
        </div>
      </header>
      <div className="grid">
        {items.map((a) => (
          <Link key={a.id} to={`/learn/${a.id}`} className="card article-card">
            <span className="badge">{a.scope}</span>
            <h2>{a.title}</h2>
            <p className="muted">{a.summary}</p>
            <span className="muted small">{a.readMinutes} min read</span>
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
      <Link to="/learn" className="link">← Learn</Link>
      <span className="badge">{a.scope}</span>
      <h1>{a.title}</h1>
      {a.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      <p className="muted small">{a.source}</p>
      <a className="btn btn-secondary" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer">
        Share on WhatsApp
      </a>
    </article>
  );
}
