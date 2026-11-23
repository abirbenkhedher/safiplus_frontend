import { useState } from "react";
import { FaUndo } from "react-icons/fa";
import { avoirRapide, MODES_REGLEMENT, typeDocDe } from "../../api/ventes";
import { FormModal, Alert } from "../atelier/ui";
import { tnd, errMsg } from "../../utils/atelier";
import { imprimerDocument } from "./imprimer";

// ============================================================
// ✅ Retour / avoir depuis une facture ou un ticket : on coche les lignes
// qui reviennent (quantité 0 par défaut), on choisit le remboursement,
// et l'avoir est créé ET validé en une fois (plus de brouillon à reprendre).
// tout = true : « Annuler la facture » (toutes les lignes, avoir total).
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;

const AvoirRapideModal = ({ doc, params, tout = false, onClose, onDone }) => {
  const comptoir = !!doc.client?.comptoir || doc.clientSnapshot?.nom === "Client comptoir";
  const avecStock = doc.lignes.some((l) => l.type === "article" && l.stockSorti);
  const [nature, setNature] = useState(tout || !avecStock ? "avoir" : "retour");
  const [qtes, setQtes] = useState(() => doc.lignes.map((l) => (tout ? l.quantite : 0)));
  const [mode, setMode] = useState("ESPECES");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const eligible = (l) => nature === "avoir" || (l.type === "article" && l.stockSorti);
  // Montant estimé : TTC de chaque ligne au prorata de la quantité (le serveur calcule le montant exact,
  //    remise globale comprise)
  const total = r3(doc.lignes.reduce((s, l, i) => (eligible(l) && l.quantite
    ? s + Number(l.montantTTC || 0) * (Number(qtes[i]) || 0) / l.quantite
    : s), 0));
  const setQ = (i, v) => setQtes((q) => q.map((x, j) => (j === i ? v : x)));

  const valider = async () => {
    const lignes = doc.lignes.map((l, i) => ({ index: i, quantite: eligible(l) ? Number(qtes[i]) || 0 : 0 })).filter((x) => x.quantite > 0);
    if (!lignes.length) { setErr("Indiquez la quantité qui revient sur au moins une ligne"); return; }
    if (comptoir && !mode) { setErr("Vente au « Client comptoir » : remboursez le client (pas de crédit anonyme)"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await avoirRapide(doc._id, { nature, lignes, ...(mode ? { remboursement: { mode } } : {}) });
      (r.data.data || []).forEach((a) => imprimerDocument(a, params));
      onDone?.(r.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  return (
    <FormModal show size="lg" title={`${tout ? "Annuler" : "Retour / avoir sur"} ${typeDocDe(doc).label.toLowerCase()} ${doc.numero}`}
      onClose={onClose} onSubmit={valider} busy={busy} submitLabel={`Valider ≈ ${tnd(total)}`}>
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="d-flex flex-wrap gap-2 mb-3">
        {avecStock && (
          <button type="button" className={`btn-modern btn-sm ${nature === "retour" ? "btn-modern-primary" : "btn-modern-outline"}`} onClick={() => setNature("retour")}>
            <FaUndo /> Retour en stock (article revendable)
          </button>
        )}
        <button type="button" className={`btn-modern btn-sm ${nature === "avoir" ? "btn-modern-primary" : "btn-modern-outline"}`} onClick={() => setNature("avoir")}>
          Avoir sans retour en stock (défectueux, geste commercial)
        </button>
      </div>

      <div className="card-modern at-table-wrap mb-3">
        <table className="at-table">
          <thead><tr><th>Ligne</th><th className="text-end">Vendu</th><th className="text-end">Revient</th></tr></thead>
          <tbody>
            {doc.lignes.map((l, i) => (
              <tr key={i} style={{ opacity: eligible(l) ? 1 : 0.45 }}>
                <td>{l.designation}{!eligible(l) && <div className="at-muted" style={{ fontSize: 11.5 }}>Pas d'article en stock : choisissez « Avoir »</div>}</td>
                <td className="text-end at-num">{l.quantite}</td>
                <td className="text-end" style={{ width: 150 }}>
                  <div className="d-flex gap-1 justify-content-end">
                    <input type="number" min="0" max={l.quantite} step={l.type === "article" ? 1 : "any"} className="form-control-modern" style={{ width: 80, textAlign: "center" }}
                      disabled={!eligible(l)} value={qtes[i]} aria-label={`Quantité qui revient : ${l.designation}`} onChange={(e) => setQ(i, e.target.value)} />
                    <button type="button" className="at-link" disabled={!eligible(l)} onClick={() => setQ(i, l.quantite)}>Tout</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <label className="form-label">Remboursement</label>
      <select className="form-control-modern" value={mode} onChange={(e) => setMode(e.target.value)}>
        {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>Rendre l'argent — {l}</option>)}
        {!comptoir && <option value="">Garder en crédit client (échange, prochain achat)</option>}
      </select>
      <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
        Seule la part déjà payée est rendue ; si la facture n'était pas payée, l'avoir diminue ce que le client doit.
        Le document est validé tout de suite (numéro définitif) et imprimé.
      </div>
    </FormModal>
  );
};

export default AvoirRapideModal;
