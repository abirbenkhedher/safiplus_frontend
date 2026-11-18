import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaCheck, FaBan, FaEdit, FaEye, FaTrash, FaFileInvoice, FaPrint, FaTruck } from "react-icons/fa";
import {
  getFournisseurs, getCommandesFournisseur, createCommandeFournisseur, updateCommandeFournisseur,
  deleteCommandeFournisseur, validerCommandeFournisseur, annulerCommandeFournisseur, facturerCommandeFournisseur,
} from "../../api/atelier";
import SearchSelect from "../../components/reparations/SearchSelect";
import { useArticles } from "../../hooks/useAtelierRefs";
import { Alert, Table, FormModal, Field, PeriodeFilter, IconBtn } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg, askMotif, isoDay, articleLabel } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
import { blockInGlobalView } from "../../utils/boutiqueStorage";

// ============================================================
// ✅ BONS DE COMMANDE FOURNISSEUR
// Ni stock ni argent. Validé = envoyé au fournisseur ; « → Facture d'achat »
// crée la facture d'achat en brouillon (sa validation fait l'entrée en stock).
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const STATUTS = {
  brouillon: ["gray", "Brouillon"], valide: ["primary", "Envoyé"], recue: ["success", "Reçu / facturé"], annulee: ["danger", "Annulé"],
};
const Badge = ({ s }) => { const [c, l] = STATUTS[s] || ["gray", s]; return <span className={`badge-modern badge-modern-${c}`}>{l}</span>; };
const ligneVide = () => ({ stock: "", designation: "", quantite: 1, prixUnitaire: "", prixTTC: "", tauxTVA: 19 });
const ttcDe = (ht, t) => (ht === "" ? "" : r3(Number(ht) * (1 + (Number(t) || 0) / 100)));
const htDe = (ttc, t) => (ttc === "" ? "" : r3(Number(ttc) / (1 + (Number(t) || 0) / 100)));

const imprimer = (c) => {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[x]));
  const m = (v) => Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(c.numero || "Bon de commande")}</title>
<style>body{font-family:Arial,sans-serif;font-size:13px;margin:28px;color:#111}h1{font-size:20px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{border:1px solid #ccc;padding:6px 8px}th{background:#f3f4f6;text-align:left}.r{text-align:right}.tot td{font-weight:bold}</style></head><body>
<h1>BON DE COMMANDE FOURNISSEUR</h1><div><b>N° :</b> ${esc(c.numero || "(brouillon)")} — <b>Date :</b> ${esc(dateFr(c.date))}</div>
<div><b>Fournisseur :</b> ${esc(c.fournisseurRef?.nom || c.fournisseur || "—")}</div>
${c.dateLivraisonPrevue ? `<div><b>Livraison souhaitée :</b> ${esc(dateFr(c.dateLivraisonPrevue))}</div>` : ""}
<table><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">PU HT</th><th class="r">TVA %</th><th class="r">Montant HT</th></tr></thead><tbody>
${(c.lignes || []).map((l) => `<tr><td>${esc(l.designation)}</td><td class="r">${l.quantite}</td><td class="r">${m(l.prixUnitaire)}</td><td class="r">${l.tauxTVA}</td><td class="r">${m(l.montantHT)}</td></tr>`).join("")}
</tbody><tfoot><tr class="tot"><td colspan="4" class="r">Total HT</td><td class="r">${m(c.totalHT)}</td></tr>
<tr class="tot"><td colspan="4" class="r">TVA</td><td class="r">${m(c.totalTVA)}</td></tr>
<tr class="tot"><td colspan="4" class="r">Total TTC</td><td class="r">${m(c.totalTTC)} TND</td></tr></tfoot></table>
${c.observation ? `<p><b>Observation :</b> ${esc(c.observation)}</p>` : ""}<script>window.print()</script></body></html>`);
  w.document.close();
};

const CommandesFournisseur = ({ onFactureCreee }) => {
  const articles = useArticles();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [range, setRange] = usePeriode();
  const [statut, setStatut] = useState("");
  const [rows, setRows] = useState([]);
  const [edit, setEditRaw] = useState(null);
  const setEdit = (v) => { if (v && !edit && blockInGlobalView()) return; setEditRaw(v); };
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getCommandesFournisseur({ statut: statut || undefined, from: range.from, to: range.to })
    .then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  useEffect(() => { load(); }, [range, statut]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getFournisseurs({ actifs: "true" }).then((r) => setFournisseurs(r.data.data)).catch(() => {}); }, []);

  const optionsArticles = useMemo(() => articles.map((a) => ({
    value: a._id, label: `${a.code ? `${a.code} — ` : ""}${articleLabel(a)} (stock ${a.quantite ?? 0})`,
  })), [articles]);
  const setLigne = (i, patch) => setEdit((e) => ({ ...e, lignes: e.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const choisirArticle = (i, id) => {
    const a = articles.find((x) => x._id === id);
    if (!a) { setLigne(i, { stock: "" }); return; }
    const t = a?.tauxTVA ?? 19;
    const pu = a ? (a.dernierCoutAchat ?? a.cmp ?? "") : "";
    setLigne(i, { stock: id, designation: "", tauxTVA: t, prixUnitaire: pu === "" ? "" : r3(pu), prixTTC: ttcDe(pu, t) });
  };

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        fournisseurRef: edit.fournisseurRef || null,
        fournisseur: edit.fournisseurRef ? (fournisseurs.find((f) => f._id === edit.fournisseurRef)?.nom || "") : edit.fournisseur,
        date: edit.date, dateLivraisonPrevue: edit.dateLivraisonPrevue || null, observation: edit.observation,
        lignes: edit.lignes.map((l) => ({ stock: l.stock || null, designation: l.designation, quantite: Number(l.quantite), prixUnitaire: l.prixUnitaire === "" ? undefined : Number(l.prixUnitaire), tauxTVA: Number(l.tauxTVA) })),
      };
      if (edit._id) await updateCommandeFournisseur(edit._id, body);
      else await createCommandeFournisseur(body);
      setEdit(null);
      setMsg({ type: "success", text: "Bon de commande enregistré (brouillon)" });
      load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };
  const act = async (fn, ok, after) => {
    try { const r = await fn(); setMsg({ type: "success", text: r?.data?.message || ok }); load(); after?.(r); } catch (e) { setMsg({ text: errMsg(e) }); }
  };

  const totaux = (edit?.lignes || []).reduce((acc, l) => {
    const ht = r3(Number(l.prixUnitaire || 0) * Number(l.quantite || 0));
    const tva = r3((ht * (Number(l.tauxTVA) || 0)) / 100);
    return { ht: acc.ht + ht, ttc: acc.ttc + ht + tva };
  }, { ht: 0, ttc: 0 });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="at-hint" style={{ fontStyle: "normal", margin: 0 }}>
          Un bon de commande ne touche ni au stock ni à l'argent. À la réception, « → Facture d'achat » crée la facture en brouillon : sa validation fait l'entrée en stock.
        </div>
        <button className="btn-modern btn-modern-primary" onClick={() => setEdit({ fournisseurRef: "", fournisseur: "", date: isoDay(), dateLivraisonPrevue: "", observation: "", lignes: [ligneVide()] })}>
          <FaPlus /> Nouveau bon de commande
        </button>
      </div>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange}>
        <div>
          <label className="form-label">Statut</label>
          <select className="form-control-modern" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous</option>
            {Object.entries(STATUTS).map(([k, [, l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </PeriodeFilter>

      <Table rows={rows} empty="Aucun bon de commande sur cette période" cols={[
        { label: "N°", render: (r) => <b>{r.numero || <span className="at-muted">brouillon</span>}</b> },
        { label: "Date", render: (r) => dateFr(r.date) },
        { label: "Fournisseur", render: (r) => r.fournisseurRef?.nom || r.fournisseur || "—" },
        { label: "Livraison prévue", render: (r) => (r.dateLivraisonPrevue ? dateFr(r.dateLivraisonPrevue) : "—") },
        { label: "Lignes", right: true, render: (r) => r.lignes?.length || 0 },
        { label: "Total HT", right: true, render: (r) => tnd(r.totalHT) },
        { label: "Total TTC", right: true, render: (r) => <b>{tnd(r.totalTTC)}</b> },
        { label: "Statut", render: (r) => <div><Badge s={r.statut} />{r.depense && <div className="at-muted" style={{ fontSize: 11.5 }}>Facture {r.depense.numero}</div>}</div> },
        {
          label: "", render: (r) => (
            <div className="at-actions">
              <IconBtn title="Détail" onClick={() => setView(r)}><FaEye /></IconBtn>
              <IconBtn title="Imprimer" onClick={() => imprimer(r)}><FaPrint /></IconBtn>
              {r.statut === "brouillon" && (
                <>
                  <IconBtn title="Modifier" onClick={() => setEdit({
                    ...r, fournisseurRef: r.fournisseurRef?._id || "", date: isoDay(new Date(r.date)),
                    dateLivraisonPrevue: r.dateLivraisonPrevue ? isoDay(new Date(r.dateLivraisonPrevue)) : "",
                    lignes: r.lignes.map((l) => ({ ...l, stock: l.stock || "", prixTTC: ttcDe(l.prixUnitaire, l.tauxTVA) })),
                  })}><FaEdit /></IconBtn>
                  <IconBtn title="Valider (envoyer au fournisseur)" tone="success" onClick={async () => (await confirmer({ message: "Valider ce bon de commande ? Il reçoit son numéro et n'est plus modifiable. Le stock ne bouge pas." })) && act(() => validerCommandeFournisseur(r._id), "Bon de commande validé")}><FaCheck /></IconBtn>
                  <IconBtn title="Supprimer" tone="danger" onClick={async () => (await confirmer({ message: "Supprimer ce brouillon ?", variant: "danger" })) && act(() => deleteCommandeFournisseur(r._id), "Brouillon supprimé")}><FaTrash /></IconBtn>
                </>
              )}
              {r.statut === "valide" && (
                <>
                  <IconBtn title="Marchandise reçue → facture d'achat (brouillon)" tone="success" onClick={async () => (await confirmer({ message: "Créer la facture d'achat (brouillon) de ce bon de commande ? Vérifiez ensuite les quantités et prix reçus, puis validez-la pour faire l'entrée en stock." })) && act(() => facturerCommandeFournisseur(r._id), "Facture d'achat créée", (res) => onFactureCreee?.(res?.data?.depense))}><FaFileInvoice /></IconBtn>
                  <IconBtn title="Annuler" tone="danger" onClick={async () => { const m = await askMotif("Motif d'annulation :"); if (m) act(() => annulerCommandeFournisseur(r._id, m), "Bon de commande annulé"); }}><FaBan /></IconBtn>
                </>
              )}
            </div>
          ),
        },
      ]} />

      <FormModal show={!!edit} size="xl" title={edit?._id ? "Modifier le bon de commande" : "Nouveau bon de commande fournisseur"} onClose={() => setEdit(null)} onSubmit={save} busy={busy} submitLabel="Enregistrer en brouillon">
        {edit && (
          <>
            <div className="row g-3 mb-4">
              <Field label="Fournisseur" col="col-12 col-md-4">
                <select className="form-control-modern" value={edit.fournisseurRef} onChange={(e) => setEdit({ ...edit, fournisseurRef: e.target.value })}>
                  <option value="">— Saisie libre —</option>
                  {fournisseurs.map((f) => <option key={f._id} value={f._id}>{f.nom}</option>)}
                </select>
                {!edit.fournisseurRef && <input className="form-control-modern mt-2" placeholder="Nom du fournisseur" value={edit.fournisseur} onChange={(e) => setEdit({ ...edit, fournisseur: e.target.value })} />}
              </Field>
              <Field label="Date" col="col-6 col-md-3"><input type="date" className="form-control-modern" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
              <Field label="Livraison souhaitée" col="col-6 col-md-3"><input type="date" className="form-control-modern" value={edit.dateLivraisonPrevue} onChange={(e) => setEdit({ ...edit, dateLivraisonPrevue: e.target.value })} /></Field>
            </div>
            <div className="at-card-title"><FaTruck /> Articles commandés</div>
            <div className="doc-lignes">
              {edit.lignes.map((l, i) => {
                const a = l.stock ? articles.find((x) => x._id === l.stock) : null;
                return (
                  <div key={i} className="doc-ligne">
                    <div className="doc-ligne-tete">
                      <div className="doc-ligne-num">{i + 1}</div>
                      <div className="doc-ligne-article">
                        <SearchSelect options={optionsArticles} value={l.stock} onChange={(v) => choisirArticle(i, v)} placeholder="Rechercher un article (vide = ligne libre)" />
                        {!l.stock && <input className="form-control-modern mt-2" placeholder="Désignation (ligne libre)" value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />}
                        {a && (
                          <div className="doc-etat">
                            <span className="at-chip">Stock : <b>{a.quantite ?? 0}</b> {a.unite || ""}</span>
                            <span className="at-chip doc-champ-gris">TVA {Number(l.tauxTVA).toLocaleString("fr-FR")} % 🔒</span>
                            {a.dernierCoutAchat != null && <span className="at-chip">Dernier achat {tnd(a.dernierCoutAchat)} HT</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ paddingTop: 4 }}>{edit.lignes.length > 1 && <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setEdit({ ...edit, lignes: edit.lignes.filter((_, j) => j !== i) })}><FaTrash /></IconBtn>}</div>
                    </div>
                    <div className="doc-ligne-champs">
                      <div className="doc-champ"><label>Quantité</label><input type="number" min="1" step="1" className="form-control-modern" value={l.quantite} onChange={(e) => setLigne(i, { quantite: e.target.value })} /></div>
                      <div className="doc-champ"><label>PU TTC</label><input type="number" min="0" step="0.001" className="form-control-modern" value={l.prixTTC ?? ""} onChange={(e) => setLigne(i, { prixTTC: e.target.value, prixUnitaire: htDe(e.target.value, l.tauxTVA) })} /></div>
                      <div className="doc-champ"><label>TVA %</label><input type="number" min="0" max="100" step="0.01" className={`form-control-modern${l.stock ? " doc-champ-gris" : ""}`} value={l.tauxTVA} disabled={!!l.stock} title={l.stock ? "TVA du produit (non modifiable)" : undefined} onChange={(e) => setLigne(i, { tauxTVA: e.target.value, prixTTC: ttcDe(l.prixUnitaire, e.target.value) })} /></div>
                      <div className="doc-champ"><label>PU HT</label><input type="number" min="0" step="0.001" className="form-control-modern" value={l.prixUnitaire} onChange={(e) => setLigne(i, { prixUnitaire: e.target.value, prixTTC: ttcDe(e.target.value, l.tauxTVA) })} /></div>
                      <div className="doc-champ"><label style={{ textAlign: "right" }}>Montant HT</label><div className="doc-champ-total">{tnd(r3(Number(l.prixUnitaire || 0) * Number(l.quantite || 0)))}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setEdit({ ...edit, lignes: [...edit.lignes, ligneVide()] })}><FaPlus /> Ajouter une ligne</button>
              <span className="at-total">Total HT : {tnd(r3(totaux.ht))} · TTC : {tnd(r3(totaux.ttc))}</span>
            </div>
            <Field label="Observation"><input className="form-control-modern" value={edit.observation || ""} onChange={(e) => setEdit({ ...edit, observation: e.target.value })} /></Field>
          </>
        )}
      </FormModal>

      <FormModal show={!!view} size="lg" title={`Bon de commande ${view?.numero || "(brouillon)"}`} onClose={() => setView(null)}>
        {view && (
          <>
            <div className="row g-3 mb-3">
              <div className="col-6 col-md-3"><div className="at-stat-label">Statut</div><Badge s={view.statut} /></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Fournisseur</div><div className="at-stat-value">{view.fournisseurRef?.nom || view.fournisseur || "—"}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Total HT</div><div className="at-stat-value">{tnd(view.totalHT)}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Total TTC</div><div className="at-stat-value">{tnd(view.totalTTC)}</div></div>
            </div>
            {view.depense && <Alert type="success" msg={`Facture d'achat ${view.depense.numero} (${view.depense.statut})`} />}
            {view.motifAnnulation && <Alert type="warning" msg={`Annulé : ${view.motifAnnulation}`} />}
            <Table rows={view.lignes} cols={[
              { key: "designation", label: "Désignation" }, { key: "quantite", label: "Qté", right: true },
              { label: "PU HT", right: true, render: (l) => tnd(l.prixUnitaire) }, { label: "TVA %", right: true, render: (l) => l.tauxTVA },
              { label: "Montant HT", right: true, render: (l) => tnd(l.montantHT) }, { label: "Montant TTC", right: true, render: (l) => <b>{tnd(l.montantTTC)}</b> },
            ]} />
          </>
        )}
      </FormModal>
    </>
  );
};

export default CommandesFournisseur;
