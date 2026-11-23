import { useEffect, useMemo, useState } from "react";
import { FaLock, FaArrowRight } from "react-icons/fa";
import { entreeStock } from "../../api/stock";
import { getParametresAtelier } from "../../api/atelier";
import { FormModal, Field, Alert } from "../../components/atelier/ui";
import { errMsg } from "../../utils/atelier";
import { r3, versTTC, versHT } from "../../utils/tva";

// ============================================================
// ✅ Bouton « + » = ENTRÉE EN STOCK d'un produit existant
// - En gris (non modifiables) : TVA du produit, dernier prix d'achat HT/TTC, CMP actuel
// - Saisie : quantité, nouveau prix d'achat HT ↔ TTC (calcul dans les 2 sens)
// - Aperçu du nouveau CMUP = (Q × CMP + q × P) / (Q + q), en HT et TTC
// ============================================================
const f3 = (v) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v))
  ? "—"
  : `${Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT`);
const nomOf = (x) => (x && typeof x === "object" ? x.nom : "") || "";

const grisStyle = { background: "var(--gray-100)", color: "var(--gray-600)", cursor: "not-allowed" };

const EntreeStockModal = ({ stock, onClose, onSaved }) => {
  const [params, setParams] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const designation = [nomOf(stock.typeArticle), nomOf(stock.marque), nomOf(stock.modele)].filter(Boolean).join(" ")
    || stock.code || "Produit";
  const tva = Number(stock.tauxTVA ?? params?.tauxTVA ?? 19);
  const dernierHT = stock.dernierCoutAchat ?? null;

  const [quantite, setQuantite] = useState(1);
  const [ht, setHT] = useState(dernierHT !== null ? String(dernierHT) : "");
  const [ttc, setTTC] = useState(dernierHT !== null ? String(versTTC(dernierHT, tva)) : "");
  const [motif, setMotif] = useState("");

  useEffect(() => {
    getParametresAtelier().then((r) => setParams(r.data.data)).catch(() => {});
  }, []);
  // TVA de la boutique connue après chargement (produit sans TVA propre) : recalcule le TTC
  useEffect(() => { if (ht !== "") setTTC(String(versTTC(ht, tva))); }, [tva]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeHT = (v) => { setHT(v); setTTC(v === "" ? "" : String(versTTC(v, tva))); };
  const changeTTC = (v) => { setTTC(v); setHT(v === "" ? "" : String(versHT(v, tva))); };

  // Quantité de référence du CMP : stock physique (ou base CMP si stock désactivé)
  const Q = params?.modeStock === "desactive" ? Number(stock.cmpQuantiteBase) || 0 : Number(stock.quantite) || 0;
  const q = Number(quantite) || 0;
  const P = ht === "" ? null : Number(ht);
  const cmpActuel = stock.cmp ?? null;
  const nouveauCmp = useMemo(() => {
    if (P === null || !(q > 0)) return null;
    if (cmpActuel === null || Q + q <= 0) return r3(P);
    return r3((Q * Number(cmpActuel) + q * P) / (Q + q));
  }, [P, q, Q, cmpActuel]);

  const save = async () => {
    if (!Number.isInteger(Number(quantite)) || Number(quantite) <= 0) { setErr("Quantité invalide (nombre entier supérieur à 0)"); return; }
    if (ht === "" || !(Number(ht) >= 0)) { setErr("Saisissez le prix d'achat (HT ou TTC)"); return; }
    setBusy(true); setErr(null);
    try {
      await entreeStock(stock._id, { quantite: Number(quantite), coutUnitaireHT: Number(ht), motif });
      onSaved();
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  const ecart = nouveauCmp !== null && cmpActuel !== null ? r3(nouveauCmp - Number(cmpActuel)) : null;

  return (
    <FormModal show size="lg" title={`Entrée en stock — ${designation}`} onClose={onClose} onSubmit={save} busy={busy} submitLabel="Valider l'entrée">
      <Alert msg={err} onClose={() => setErr(null)} />

      <div className="at-card-title">Produit</div>
      <div className="row g-3 mb-3">
        <Field label="TVA du produit" col="col-6 col-md-3" hint="Non modifiable">
          <div style={{ position: "relative" }}>
            <input className="form-control-modern" disabled value={`${tva.toLocaleString("fr-FR")} %`} style={grisStyle} />
            <FaLock size={11} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
          </div>
        </Field>
        <Field label="Dernier achat HT" col="col-6 col-md-3" hint="Entrée en stock ou facture d'achat">
          <input className="form-control-modern" disabled value={f3(dernierHT)} style={grisStyle} />
        </Field>
        <Field label="Dernier achat TTC" col="col-6 col-md-3">
          <input className="form-control-modern" disabled value={dernierHT === null ? "—" : f3(versTTC(dernierHT, tva))} style={grisStyle} />
        </Field>
        <Field label="En stock" col="col-6 col-md-3">
          <input className="form-control-modern" disabled value={`${stock.quantite ?? 0} ${stock.unite || ""}`.trim()} style={grisStyle} />
        </Field>
      </div>

      <div className="at-card-title">Nouvelle entrée</div>
      <div className="row g-3 mb-3">
        <Field label="Quantité *" col="col-6 col-md-3">
          <input type="number" min="1" step="1" autoFocus className="form-control-modern" value={quantite} onChange={(e) => setQuantite(e.target.value)} />
        </Field>
        <Field label="Prix d'achat HT *" col="col-6 col-md-3">
          <input type="number" min="0" step="0.001" className="form-control-modern" value={ht} onChange={(e) => changeHT(e.target.value)} />
        </Field>
        <Field label="Prix d'achat TTC *" col="col-6 col-md-3">
          <input type="number" min="0" step="0.001" className="form-control-modern" value={ttc} onChange={(e) => changeTTC(e.target.value)} />
        </Field>
        <Field label="Motif / fournisseur" col="col-6 col-md-3">
          <input className="form-control-modern" placeholder="Entrée en stock" value={motif} onChange={(e) => setMotif(e.target.value)} />
        </Field>
      </div>

      <div className="at-card-title">Coût moyen (CMUP)</div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", padding: "12px 16px", borderRadius: 12, background: "var(--gray-50)", border: "1px solid var(--gray-200)" }}>
          <div className="at-stat-label">CMUP actuel</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gray-800)" }}>{cmpActuel === null ? "non valorisé" : `${f3(cmpActuel)} HT`}</div>
          <div className="at-muted" style={{ fontSize: 12 }}>{cmpActuel === null ? "" : `${f3(versTTC(cmpActuel, tva))} TTC · sur ${Q} unité(s)`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "var(--gray-400)" }}><FaArrowRight /></div>
        <div style={{ flex: "1 1 200px", padding: "12px 16px", borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.35)" }}>
          <div className="at-stat-label">Nouveau CMUP</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#047857" }}>{nouveauCmp === null ? "—" : `${f3(nouveauCmp)} HT`}</div>
          <div className="at-muted" style={{ fontSize: 12 }}>
            {nouveauCmp === null ? "Saisissez quantité et prix" : `${f3(versTTC(nouveauCmp, tva))} TTC · ${Q + q} unité(s)`}
            {ecart !== null && ecart !== 0 && (
              <span style={{ marginLeft: 6, fontWeight: 600, color: ecart > 0 ? "#dc2626" : "#047857" }}>
                ({ecart > 0 ? "+" : ""}{ecart.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })})
              </span>
            )}
          </div>
        </div>
      </div>
      {cmpActuel !== null && P !== null && q > 0 && (
        <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
          ({Q} × {Number(cmpActuel).toFixed(3)} + {q} × {P.toFixed(3)}) ÷ {Q + q} = {nouveauCmp?.toFixed(3)} HT
        </div>
      )}
    </FormModal>
  );
};

export default EntreeStockModal;
