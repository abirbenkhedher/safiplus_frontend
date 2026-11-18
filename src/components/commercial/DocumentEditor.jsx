import { useMemo, useState } from "react";
import { FaPlus, FaTrash, FaTools, FaBox, FaPen } from "react-icons/fa";
import { createDocument, updateDocument, typeDocDe, MODES_REGLEMENT } from "../../api/ventes";
import { FormModal, Field, IconBtn, Alert } from "../atelier/ui";
import SearchSelect from "../reparations/SearchSelect";
import TvaInput from "../common/TvaInput";
import RemiseInput from "../common/RemiseInput";
import { useArticles } from "../../hooks/useAtelierRefs";
import { tnd, errMsg, isoDay, articleLabel } from "../../utils/atelier";
import { ClientPicker } from "./commun";
import { calcLigne, calcTotaux, clientLabel, baseCommerce, prixVersBase } from "./calculs";

// ============================================================
// ✅ Saisie / modification d'un document en brouillon
// doc = { type, ... } (nouveau) ou document brouillon existant
// ============================================================
const isoOrEmpty = (v) => (v ? isoDay(new Date(v)) : "");
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const coef = (t) => 1 + (Number(t) || 0) / 100;
/** PU TTC et PU HT affichés à partir du prix enregistré (dans la base du document). */
const prixDeux = (pu, t, base) => {
  if (pu === "" || pu === null || pu === undefined) return { puTTC: "", puHT: "" };
  return base === "TTC" ? { puTTC: pu, puHT: r3(Number(pu) / coef(t)) } : { puHT: pu, puTTC: r3(Number(pu) * coef(t)) };
};

const versFormulaire = (doc, params) => ({
  _id: doc._id || null,
  type: doc.type,
  numero: doc.numero || null,
  client: doc.client?._id || doc.client || null,
  clientLabel: doc.client && typeof doc.client === "object" ? clientLabel(doc.client) : doc.clientLabel || "",
  prixSaisis: doc.prixSaisis || baseCommerce(params),
  date: isoOrEmpty(doc.date) || isoDay(),
  dateEcheance: isoOrEmpty(doc.dateEcheance),
  dateValidite: isoOrEmpty(doc.dateValidite),
  appliquerTimbre: doc.appliquerTimbre !== false,
  conditionsPaiement: doc.conditionsPaiement || "",
  modePaiement: doc.modePaiement || "",
  observation: doc.observation || "",
  factureOrigine: doc.factureOrigine || null,
  nature: doc.nature || null,
  remiseGlobaleType: doc.remiseGlobaleType || "pct",
  remiseGlobaleValeur: doc.remiseGlobaleValeur || "",
  lignes: (doc.lignes || []).map((l) => ({
    type: l.type || (l.stock ? "article" : l.reparation ? "reparation" : "libre"),
    stock: l.stock?._id || l.stock || "",
    reparation: l.reparation?._id || l.reparation || null,
    code: l.code || "",
    designation: l.designation || "",
    quantite: l.quantite ?? 1,
    prixUnitaire: l.prixUnitaire ?? 0,
    remiseType: l.remiseType || "pct",
    remisePct: l.remisePct ? Math.round(Number(l.remisePct) * 10000) / 10000 : "",
    remiseMontant: l.remiseMontant || "",
    tauxTVA: l.tauxTVA ?? params?.tauxTVA ?? 19,
    ...prixDeux(l.prixUnitaire ?? 0, l.tauxTVA ?? params?.tauxTVA ?? 19, doc.prixSaisis || baseCommerce(params)),
    retourStock: !!l.retourStock,
    stockSorti: !!l.stockSorti,
    origineDocument: l.origineDocument || null,
  })),
});

const DocumentEditor = ({ doc, params, onClose, onSaved }) => {
  // Avoir : articles de la facture d'origine (quel que soit l'usage) ; sinon produits vendables
  const articles = useArticles(doc?.type === "AVOIR" ? undefined : "vente");
  // Monté une fois par document (le parent l'affiche conditionnellement)
  const [f, setF] = useState(() => (doc ? versFormulaire(doc, params) : null));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  if (!f) return null;

  const tva = Number(params?.tauxTVA ?? 19);
  const avoir = f.type === "AVOIR";
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setLigne = (i, patch) => setF((x) => ({ ...x, lignes: x.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  // ✅ PU TTC ↔ PU HT (calcul dans les 2 sens) ; le prix enregistré est celui de la base du document
  //    Base TTC = exacte dans les 2 sens (HT tapé → TTC → même HT au millime) : taper un TTC
  //    dans un document en base HT le fait passer en base TTC (sinon 0,001 d'écart possible).
  const setPrix = (i, champ, v) => setF((x) => {
    const base = champ === "ttc" ? "TTC" : x.prixSaisis;
    return {
      ...x,
      prixSaisis: base,
      lignes: x.lignes.map((l, j) => {
        if (j !== i) return { ...l, prixUnitaire: Number(base === "TTC" ? l.puTTC : l.puHT) || 0 };
        const puTTC = champ === "ttc" ? v : (v === "" ? "" : r3(Number(v) * coef(l.tauxTVA)));
        const puHT = champ === "ht" ? v : (v === "" ? "" : r3(Number(v) / coef(l.tauxTVA)));
        return { ...l, puTTC, puHT, prixUnitaire: base === "TTC" ? Number(puTTC) || 0 : Number(puHT) || 0 };
      }),
    };
  });
  // TVA changée (ligne libre) : le prix de la base est conservé, l'autre est recalculé
  const setTvaLigne = (i, t) => setF((x) => ({
    ...x,
    lignes: x.lignes.map((l, j) => (j === i ? { ...l, tauxTVA: t, ...prixDeux(l.prixUnitaire, t === "" ? 0 : t, x.prixSaisis) } : l)),
  }));
  // Base HT/TTC du document changée : le prix enregistré suit le champ correspondant
  const setBase = (base) => setF((x) => ({
    ...x, prixSaisis: base,
    lignes: x.lignes.map((l) => ({ ...l, prixUnitaire: Number(base === "TTC" ? l.puTTC : l.puHT) || 0 })),
  }));
  const optionsArticles = useMemo(() => articles.map((a) => ({
    value: a._id, label: `${a.code ? `${a.code} — ` : ""}${articleLabel(a)} (stock ${a.quantite ?? 0})`,
  })), [articles]);
  const ajouter = (type) => setF((x) => ({
    ...x,
    lignes: [...x.lignes, { type, stock: "", reparation: null, code: "", designation: "", quantite: 1, prixUnitaire: 0, puTTC: "", puHT: "", remiseType: "pct", remisePct: "", remiseMontant: "", tauxTVA: tva, retourStock: avoir }],
  }));
  const choisirArticle = (i, id) => {
    const a = articles.find((x) => x._id === id);
    const tvaArticle = a && a.tauxTVA !== null && a.tauxTVA !== undefined ? a.tauxTVA : tva;
    const pu = a ? prixVersBase(a.prixVente ?? a.prixIndicatif, params, f.prixSaisis, tvaArticle) : 0;
    setLigne(i, { stock: id || "", designation: "", prixUnitaire: pu, code: a?.code || "", tauxTVA: tvaArticle, ...prixDeux(pu, tvaArticle, f.prixSaisis) });
  };

  const timbre = f.type === "FACTURE" && f.appliquerTimbre ? Number(params?.commerce?.timbreFiscal ?? 1) : 0;
  const tot = calcTotaux(f.lignes, f.prixSaisis, timbre, { type: f.remiseGlobaleType, valeur: f.remiseGlobaleValeur });

  const save = async () => {
    if (!f.client) { setErr("Choisissez un client"); return; }
    if (!f.lignes.length) { setErr("Ajoutez au moins une ligne"); return; }
    setBusy(true); setErr(null);
    try {
      const body = {
        type: f.type, client: f.client, prixSaisis: f.prixSaisis, date: f.date || undefined,
        dateEcheance: f.dateEcheance || null, dateValidite: f.dateValidite || null,
        appliquerTimbre: f.appliquerTimbre, conditionsPaiement: f.conditionsPaiement, observation: f.observation,
        modePaiement: f.modePaiement || null,
        remiseGlobaleType: f.remiseGlobaleType, remiseGlobaleValeur: Number(f.remiseGlobaleValeur) || 0,
        lignes: f.lignes.map((l) => ({
          type: l.type, stock: l.type === "article" ? l.stock || null : null, reparation: l.reparation || null,
          code: l.code, designation: l.designation, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire),
          remiseType: l.remiseType, remisePct: Number(l.remisePct) || 0, remiseMontant: Number(l.remiseMontant) || 0,
          tauxTVA: Number(l.tauxTVA) || 0, retourStock: l.retourStock,
          origineDocument: l.origineDocument || null,
        })),
      };
      const r = f._id ? await updateDocument(f._id, body) : await createDocument(body);
      onSaved?.(r.data.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const titre = `${f._id ? "Modifier" : "Nouveau"} ${typeDocDe(f).label.toLowerCase()} (brouillon)`;

  return (
    <FormModal show size="xl" title={titre} onClose={onClose} onSubmit={save} busy={busy} submitLabel="Enregistrer le brouillon">
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="row g-3 mb-3">
        <Field label="Client" col="col-12 col-md-6">
          <ClientPicker value={f.client} label={f.clientLabel} disabled={avoir}
            onChange={(id, label) => setF((x) => ({ ...x, client: id, clientLabel: label || "" }))} />
        </Field>
        <Field label="Prix saisis" col="col-6 col-md-2">
          <select className="form-control-modern" value={f.prixSaisis} onChange={(e) => setBase(e.target.value)}>
            <option value="TTC">TTC</option><option value="HT">HT</option>
          </select>
        </Field>
        {!["FACTURE", "AVOIR"].includes(f.type) && (
          <Field label="Date" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        )}
        {f.type === "DEVIS" && (
          <Field label="Valable jusqu'au" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.dateValidite} onChange={(e) => set("dateValidite", e.target.value)} /></Field>
        )}
        {["BL", "FACTURE", "BC"].includes(f.type) && (
          <Field label="Mode de paiement" col="col-6 col-md-2">
            <select className="form-control-modern" value={f.modePaiement} onChange={(e) => set("modePaiement", e.target.value)}>
              <option value="">— Non précisé —</option>
              {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        )}
        {(f.type === "FACTURE" || (f.type === "BL" && f.modePaiement === "TRAITE")) && (
          <Field label={f.modePaiement === "TRAITE" ? "Échéance de la traite" : "Échéance"} col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.dateEcheance} onChange={(e) => set("dateEcheance", e.target.value)} /></Field>
        )}
      </div>
      {["FACTURE", "AVOIR"].includes(f.type) && (
        <div className="at-hint mb-3" style={{ fontStyle: "normal" }}>
          La date et le numéro sont attribués à la validation (numérotation chronologique sans trou).
        </div>
      )}

      <div className="at-card-title">Lignes</div>
      <div className="doc-lignes">
        {f.lignes.length === 0 && <div className="doc-ligne at-muted">Aucune ligne : ajoutez un article du stock ou une ligne libre.</div>}
        {f.lignes.map((l, i) => {
          const a = l.type === "article" && l.stock ? articles.find((x) => x._id === l.stock) : null;
          const dispo = Number(a?.quantite) || 0;
          const manque = !!a && !l.stockSorti && !avoir && Number(l.quantite) > dispo;
          return (
            <div key={i} className="doc-ligne">
              {/* Ligne 1 : article / désignation */}
              <div className="doc-ligne-tete">
                <div className="doc-ligne-num">{i + 1}</div>
                <div className="doc-ligne-article">
                  {l.type === "article" && (
                    <>
                      <div className="at-mini-label"><FaBox /> Article du stock{l.stockSorti ? " · déjà livré (BL)" : ""}</div>
                      {l.stockSorti
                        ? <div className="at-chip">{l.designation || articleLabel(articles.find((x) => x._id === l.stock))}</div>
                        : <SearchSelect options={optionsArticles} value={l.stock} onChange={(v) => choisirArticle(i, v)} placeholder="Rechercher un article (code, nom…)" />}
                      {a && (
                        // ✅ État actuel du produit choisi
                        <div className="doc-etat">
                          <span className="at-chip" style={manque ? { background: "rgba(239, 68, 68, 0.12)", color: "#dc2626" } : undefined}>
                            Stock : <b>{dispo}</b> {a.unite || ""}{manque ? " — insuffisant" : ""}
                          </span>
                          <span className="at-chip doc-champ-gris">TVA {Number(l.tauxTVA).toLocaleString("fr-FR")} % 🔒</span>
                          {a.prixVente != null && <span className="at-chip">Prix de vente {tnd(a.prixVente)}</span>}
                          {avoir && <span className="at-chip">{f.nature === "retour" ? "↩ Revient en stock" : "Ne revient pas en stock"}</span>}
                        </div>
                      )}
                      <input className="form-control-modern mt-2" placeholder="Désignation (facultatif : libellé de l'article)" value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />
                    </>
                  )}
                  {l.type === "reparation" && (
                    <>
                      <div className="at-mini-label"><FaTools /> Réparation {l.code}</div>
                      <input className="form-control-modern" value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />
                    </>
                  )}
                  {l.type === "libre" && (
                    <>
                      <div className="at-mini-label"><FaPen /> Ligne libre (service, main d'œuvre…)</div>
                      <input className="form-control-modern" placeholder="Désignation" required value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />
                    </>
                  )}
                </div>
                <div style={{ paddingTop: 18 }}>
                  <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setF((x) => ({ ...x, lignes: x.lignes.filter((_, j) => j !== i) }))}><FaTrash /></IconBtn>
                </div>
              </div>
              {/* Ligne 2 : Quantité → PU TTC → TVA → PU HT → Remise → Total (champs alignés) */}
              <div className="doc-ligne-champs">
                <div className="doc-champ">
                  <label>Quantité</label>
                  <input type="number" step="1" min="0" className="form-control-modern" value={l.quantite}
                    disabled={l.type === "reparation" || l.stockSorti} onChange={(e) => setLigne(i, { quantite: e.target.value })} />
                </div>
                <div className="doc-champ">
                  <label>PU TTC</label>
                  <input type="number" step="0.001" min="0" className="form-control-modern" value={l.puTTC}
                    style={f.prixSaisis === "TTC" ? { fontWeight: 600 } : undefined} onChange={(e) => setPrix(i, "ttc", e.target.value)} />
                </div>
                <div className="doc-champ">
                  <label>TVA %</label>
                  {l.type === "article"
                    ? <input className="form-control-modern doc-champ-gris" value={`${Number(l.tauxTVA).toLocaleString("fr-FR")} %`} disabled title="TVA du produit (non modifiable)" />
                    : <TvaInput value={l.tauxTVA} onChange={(v) => setTvaLigne(i, v)} taux={params?.tauxTVAAutorises} />}
                </div>
                <div className="doc-champ">
                  <label>PU HT</label>
                  <input type="number" step="0.001" min="0" className="form-control-modern" value={l.puHT}
                    style={f.prixSaisis === "HT" ? { fontWeight: 600 } : undefined} onChange={(e) => setPrix(i, "ht", e.target.value)} />
                </div>
                <div className="doc-champ">
                  <label>Remise {l.remiseType === "montant" ? `(DT ${f.prixSaisis})` : "(%)"}</label>
                  <RemiseInput type={l.remiseType} valeur={l.remiseType === "montant" ? l.remiseMontant : l.remisePct}
                    onChange={(type, v) => setLigne(i, type === "montant" ? { remiseType: "montant", remiseMontant: v, remisePct: 0 } : { remiseType: "pct", remisePct: v, remiseMontant: 0 })} />
                </div>
                <div className="doc-champ">
                  <label style={{ textAlign: "right" }}>Total TTC</label>
                  <div className="doc-champ-total">{tnd(calcLigne(l, f.prixSaisis).ttc)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="d-flex gap-2 flex-wrap mb-3">
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => ajouter("article")}><FaPlus /> Article du stock</button>
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => ajouter("libre")}><FaPlus /> Ligne libre</button>
      </div>
      {/* ✅ Remise sur tout le document (répartie sur les lignes avant TVA) */}
      <div className="doc-remise-globale">
        <div className="doc-champ">
          <label>Remise globale {f.remiseGlobaleType === "montant" ? `(DT ${f.prixSaisis})` : "(%)"}</label>
          <RemiseInput type={f.remiseGlobaleType} valeur={f.remiseGlobaleValeur} ariaLabel="Remise globale"
            onChange={(type, v) => setF((x) => ({ ...x, remiseGlobaleType: type, remiseGlobaleValeur: v }))} />
        </div>
      </div>
      <div style={{ textAlign: "right" }} className="mb-3">
        {tot.remise > 0 && (
          <div className="at-muted">Total avant remise : <b>{tnd(tot.avantRemise)}</b> · Remise globale : <b style={{ color: "#dc2626" }}>− {tnd(tot.remise)}</b></div>
        )}
        <div className="at-muted">Total HT : <b>{tnd(tot.ht)}</b> · TVA : <b>{tnd(tot.tva)}</b>{timbre ? <> · Timbre : <b>{tnd(timbre)}</b></> : null}</div>
        <span className="at-total">{avoir ? "Total avoir" : "Net à payer"} : {tnd(tot.net)}</span>
      </div>
      {f.type === "FACTURE" && (
        <div className="form-check form-switch mb-3">
          <input id="timbre" type="checkbox" role="switch" className="form-check-input" checked={f.appliquerTimbre} onChange={(e) => set("appliquerTimbre", e.target.checked)} />
          <label htmlFor="timbre" className="form-check-label" style={{ fontSize: 13.5 }}>Appliquer le timbre fiscal ({tnd(params?.commerce?.timbreFiscal ?? 1)})</label>
        </div>
      )}
      <div className="row g-3">
        {f.type !== "AVOIR" && (
          <Field label="Conditions de paiement" col="col-12 col-md-6">
            <input className="form-control-modern" placeholder="Ex. : comptant, 30 jours…" value={f.conditionsPaiement} onChange={(e) => set("conditionsPaiement", e.target.value)} />
          </Field>
        )}
        <Field label="Observation" col={f.type !== "AVOIR" ? "col-12 col-md-6" : "col-12"}>
          <input className="form-control-modern" value={f.observation} onChange={(e) => set("observation", e.target.value)} />
        </Field>
      </div>
    </FormModal>
  );
};

export default DocumentEditor;
