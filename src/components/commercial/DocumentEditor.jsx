import { useState } from "react";
import { FaPlus, FaTrash, FaTools, FaBox, FaPen } from "react-icons/fa";
import { createDocument, updateDocument, TYPES_DOC } from "../../api/ventes";
import { FormModal, Field, IconBtn, Alert } from "../atelier/ui";
import { ArticleSelect } from "../atelier/pickers";
import { useArticles } from "../../hooks/useAtelierRefs";
import { tnd, errMsg, isoDay, articleLabel } from "../../utils/atelier";
import { ClientPicker } from "./commun";
import { calcLigne, calcTotaux, clientLabel } from "./calculs";

// ============================================================
// ✅ Saisie / modification d'un document en brouillon
// doc = { type, ... } (nouveau) ou document brouillon existant
// ============================================================
const LINE_GRID = { gridTemplateColumns: "minmax(220px, 3fr) repeat(4, minmax(80px, 1fr)) minmax(110px, 1fr) 32px" };
const isoOrEmpty = (v) => (v ? isoDay(new Date(v)) : "");

const versFormulaire = (doc, params) => ({
  _id: doc._id || null,
  type: doc.type,
  numero: doc.numero || null,
  client: doc.client?._id || doc.client || null,
  clientLabel: doc.client && typeof doc.client === "object" ? clientLabel(doc.client) : doc.clientLabel || "",
  prixSaisis: doc.prixSaisis || (params?.prixTTC === false ? "HT" : "TTC"),
  date: isoOrEmpty(doc.date) || isoDay(),
  dateEcheance: isoOrEmpty(doc.dateEcheance),
  dateValidite: isoOrEmpty(doc.dateValidite),
  appliquerTimbre: doc.appliquerTimbre !== false,
  conditionsPaiement: doc.conditionsPaiement || "",
  observation: doc.observation || "",
  factureOrigine: doc.factureOrigine || null,
  lignes: (doc.lignes || []).map((l) => ({
    type: l.type || (l.stock ? "article" : l.reparation ? "reparation" : "libre"),
    stock: l.stock?._id || l.stock || "",
    reparation: l.reparation?._id || l.reparation || null,
    code: l.code || "",
    designation: l.designation || "",
    quantite: l.quantite ?? 1,
    prixUnitaire: l.prixUnitaire ?? 0,
    remisePct: l.remisePct ?? 0,
    tauxTVA: l.tauxTVA ?? params?.tauxTVA ?? 19,
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
  const ajouter = (type) => setF((x) => ({
    ...x,
    lignes: [...x.lignes, { type, stock: "", reparation: null, code: "", designation: "", quantite: 1, prixUnitaire: 0, remisePct: 0, tauxTVA: tva, retourStock: avoir }],
  }));
  const choisirArticle = (i, id) => {
    const a = articles.find((x) => x._id === id);
    setLigne(i, {
      stock: id, designation: "", prixUnitaire: a ? Number(a.prixIndicatif || 0) : 0, code: a?.code || "",
      ...(a && a.tauxTVA !== null && a.tauxTVA !== undefined ? { tauxTVA: a.tauxTVA } : {}),
    });
  };

  const timbre = f.type === "FACTURE" && f.appliquerTimbre ? Number(params?.commerce?.timbreFiscal ?? 1) : 0;
  const tot = calcTotaux(f.lignes, f.prixSaisis, timbre);

  const save = async () => {
    if (!f.client) { setErr("Choisissez un client"); return; }
    if (!f.lignes.length) { setErr("Ajoutez au moins une ligne"); return; }
    setBusy(true); setErr(null);
    try {
      const body = {
        type: f.type, client: f.client, prixSaisis: f.prixSaisis, date: f.date || undefined,
        dateEcheance: f.dateEcheance || null, dateValidite: f.dateValidite || null,
        appliquerTimbre: f.appliquerTimbre, conditionsPaiement: f.conditionsPaiement, observation: f.observation,
        lignes: f.lignes.map((l) => ({
          type: l.type, stock: l.type === "article" ? l.stock || null : null, reparation: l.reparation || null,
          code: l.code, designation: l.designation, quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire),
          remisePct: Number(l.remisePct) || 0, tauxTVA: Number(l.tauxTVA) || 0, retourStock: l.retourStock,
          origineDocument: l.origineDocument || null,
        })),
      };
      const r = f._id ? await updateDocument(f._id, body) : await createDocument(body);
      onSaved?.(r.data.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const titre = `${f._id ? "Modifier" : "Nouveau"} ${TYPES_DOC[f.type]?.label.toLowerCase() || ""} (brouillon)`;

  return (
    <FormModal show size="xl" title={titre} onClose={onClose} onSubmit={save} busy={busy} submitLabel="Enregistrer le brouillon">
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="row g-3 mb-3">
        <Field label="Client" col="col-12 col-md-6">
          <ClientPicker value={f.client} label={f.clientLabel} disabled={avoir}
            onChange={(id, label) => setF((x) => ({ ...x, client: id, clientLabel: label || "" }))} />
        </Field>
        <Field label="Prix saisis" col="col-6 col-md-2">
          <select className="form-control-modern" value={f.prixSaisis} onChange={(e) => set("prixSaisis", e.target.value)}>
            <option value="TTC">TTC</option><option value="HT">HT</option>
          </select>
        </Field>
        {!["FACTURE", "AVOIR"].includes(f.type) && (
          <Field label="Date" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        )}
        {f.type === "DEVIS" && (
          <Field label="Valable jusqu'au" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.dateValidite} onChange={(e) => set("dateValidite", e.target.value)} /></Field>
        )}
        {f.type === "FACTURE" && (
          <Field label="Échéance" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={f.dateEcheance} onChange={(e) => set("dateEcheance", e.target.value)} /></Field>
        )}
      </div>
      {["FACTURE", "AVOIR"].includes(f.type) && (
        <div className="at-hint mb-3" style={{ fontStyle: "normal" }}>
          La date et le numéro sont attribués à la validation (numérotation chronologique sans trou).
        </div>
      )}

      <div className="at-card-title">Lignes</div>
      <div className="at-lines">
        <div className="at-line d-none d-lg-grid" style={{ ...LINE_GRID, background: "var(--at-head-bg)" }}>
          {["Désignation", "Quantité", `PU ${f.prixSaisis}`, "Remise %", "TVA %", "Total TTC", ""].map((h, i) => (
            <div key={i} className="form-label mb-0" style={i === 5 ? { textAlign: "right" } : undefined}>{h}</div>
          ))}
        </div>
        {f.lignes.map((l, i) => (
          <div key={i} className="at-line" style={LINE_GRID}>
            <div>
              {l.type === "article" && (
                <>
                  <div className="at-mini-label"><FaBox /> Article du stock{l.stockSorti ? " · déjà livré (BL)" : ""}</div>
                  {l.stockSorti
                    ? <div className="at-chip">{l.designation || articleLabel(articles.find((a) => a._id === l.stock))}</div>
                    : <ArticleSelect articles={articles} value={l.stock} onChange={(v) => choisirArticle(i, v)} />}
                  <input className="form-control-modern mt-2" placeholder="Désignation (facultatif : libellé de l'article)" value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />
                  {avoir && (
                    <div className="form-check mt-1">
                      <input id={`ret-${i}`} type="checkbox" className="form-check-input" checked={l.retourStock} onChange={(e) => setLigne(i, { retourStock: e.target.checked })} />
                      <label htmlFor={`ret-${i}`} className="form-check-label" style={{ fontSize: 13 }}>Remettre en stock</label>
                    </div>
                  )}
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
            {[["quantite", "Quantité", "1"], ["prixUnitaire", `PU ${f.prixSaisis}`, "0.001"], ["remisePct", "Remise %", "0.01"], ["tauxTVA", "TVA %", "0.01"]].map(([k, lib, step]) => (
              <div key={k}>
                <label className="at-mini-label d-lg-none">{lib}</label>
                <input type="number" step={step} min="0" max={k === "remisePct" || k === "tauxTVA" ? 100 : undefined}
                  className="form-control-modern" aria-label={lib} value={l[k]}
                  disabled={(k === "quantite" && (l.type === "reparation" || l.stockSorti))}
                  onChange={(e) => setLigne(i, { [k]: e.target.value })} />
              </div>
            ))}
            <div className="at-num" style={{ textAlign: "right", fontWeight: 600, paddingTop: 11 }}>
              <span className="at-mini-label d-lg-none">Total TTC </span>{tnd(calcLigne(l, f.prixSaisis).ttc)}
            </div>
            <div style={{ paddingTop: 5 }}>
              <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setF((x) => ({ ...x, lignes: x.lignes.filter((_, j) => j !== i) }))}><FaTrash /></IconBtn>
            </div>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div className="d-flex gap-2 flex-wrap">
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => ajouter("article")}><FaPlus /> Article du stock</button>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => ajouter("libre")}><FaPlus /> Ligne libre</button>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="at-muted">Total HT : <b>{tnd(tot.ht)}</b> · TVA : <b>{tnd(tot.tva)}</b>{timbre ? <> · Timbre : <b>{tnd(timbre)}</b></> : null}</div>
          <span className="at-total">{avoir ? "Total avoir" : "Net à payer"} : {tnd(tot.net)}</span>
        </div>
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
