import { useEffect, useState } from "react";
import { getClients } from "../../api/clients";
import { clientLabel } from "./calculs";

// ============================================================
// ✅ Gestion commerciale : petits composants partagés
// ============================================================
const STATUTS = {
  brouillon: ["gray", "Brouillon"],
  valide: ["primary", "Validé"],
  accepte: ["success", "Accepté"],
  refuse: ["danger", "Refusé"],
  transforme: ["info", "Transformé"],
  annule: ["danger", "Annulé"],
};
export const StatutDoc = ({ statut, type }) => {
  const [c, l] = STATUTS[statut] || ["gray", statut];
  const label = statut === "valide" && ["FACTURE", "AVOIR"].includes(type) ? "Validée" : l;
  return <span className={`badge-modern badge-modern-${c}`}>{label}</span>;
};

const PAIEMENTS = { paye: ["success", "Payée"], partiel: ["warning", "Partiel"], non_paye: ["danger", "Non payée"] };
export const PaiementBadge = ({ paiement }) => {
  if (!paiement?.etat) return null;
  const [c, l] = PAIEMENTS[paiement.etat] || ["gray", paiement.etat];
  return <span className={`badge-modern badge-modern-${c}`}>{l}</span>;
};

/** Recherche d'un client (nom, téléphone, code). */
export const ClientPicker = ({ value, label, onChange, disabled }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const terme = q.trim();
  useEffect(() => {
    if (terme.length < 2) return undefined;
    const t = setTimeout(() => {
      getClients({ search: terme, limit: 10 }).then((r) => setResults(r.data || [])).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [terme]);
  const visibles = terme.length >= 2 ? results : [];

  if (value) {
    return (
      <div className="d-flex gap-2 align-items-center flex-wrap" style={{ minHeight: 42 }}>
        <span className="badge-modern badge-modern-primary">👤 {label || "Client choisi"}</span>
        {!disabled && <button type="button" className="at-link" onClick={() => onChange(null, null)}>Changer</button>}
      </div>
    );
  }
  return (
    <div className="at-picker">
      <input className="form-control-modern" placeholder="Rechercher un client (nom, téléphone, code)…" value={q} onChange={(e) => setQ(e.target.value)} />
      {visibles.length > 0 && (
        <div className="at-picker-list">
          {visibles.map((c) => (
            <div key={c._id} role="button" className="at-picker-item" onClick={() => { onChange(c._id, clientLabel(c), c); setQ(""); setResults([]); }}>
              <b>{c.nom}</b> — {c.phone}{c.code ? ` · ${c.code}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
