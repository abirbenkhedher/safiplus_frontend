import { useEffect, useState } from "react";
import { getReparations } from "../../api/reparations";
import { articleLabel, userName } from "../../utils/atelier";


export const ArticleSelect = ({ articles, value, onChange, required }) => (
  <select className="form-control-modern" value={value || ""} required={required} onChange={(e) => onChange(e.target.value)}>
    <option value="">— Article —</option>
    {articles.filter((a) => a.isActive !== false).map((a) => (
      <option key={a._id} value={a._id}>{articleLabel(a)} (stock {a.quantite})</option>
    ))}
  </select>
);


export const ReparateurSelect = ({ reparateurs, value, onChange, allLabel, required }) => (
  <select className="form-control-modern" value={value || ""} required={required} onChange={(e) => onChange(e.target.value)}>
    <option value="">{allLabel || "— Réparateur —"}</option>
    {reparateurs.map((u) => <option key={u._id} value={u._id}>{userName(u)}</option>)}
  </select>
);

/** Recherche d'un dossier de réparation par numéro. */
export const ReparationPicker = ({ value, label, onChange }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return undefined; }
    const t = setTimeout(() => {
      getReparations({ search: q.trim(), limit: 10 }).then((r) => setResults(r.data || [])).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  if (value) {
    return (
      <div className="d-flex gap-2 align-items-center" style={{ minHeight: 42 }}>
        <span className="badge-modern badge-modern-primary">🔧 {label || "Dossier lié"}</span>
        <button type="button" className="at-link" onClick={() => onChange(null, null)}>Retirer</button>
      </div>
    );
  }
  return (
    <div className="at-picker">
      <input className="form-control-modern" placeholder="Rechercher un n° de dossier…" value={q} onChange={(e) => setQ(e.target.value)} />
      {results.length > 0 && (
        <div className="at-picker-list">
          {results.map((r) => (
            <div key={r._id} role="button" className="at-picker-item" onClick={() => { onChange(r._id, r.numero); setQ(""); setResults([]); }}>
              <b>{r.numero}</b> — {r.client?.nom || ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
