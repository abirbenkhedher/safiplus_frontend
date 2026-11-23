import { useEffect, useMemo, useState } from "react";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import {
  FaPlus, FaCheck, FaBan, FaEdit, FaPaperclip, FaEye, FaFileInvoice, FaTrash, FaHourglassHalf, FaCheckCircle, FaFilePdf,
} from "react-icons/fa";
import { getDepenses, createDepense, updateDepense } from "../../api/depenses";
import { getFournisseurs, getParametresAtelier, validerDepense, annulerDepense, uploadPieceJointe, openPieceJointe } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import SearchSelect from "../../components/reparations/SearchSelect";
import TvaInput from "../../components/common/TvaInput";
import RemiseInput from "../../components/common/RemiseInput";
import { useArticles } from "../../hooks/useAtelierRefs";
import { useFamilles } from "../../hooks/useFamilles";
import { Page, PageHeader, Alert, Table, FormModal, Field, StatutBadge, PeriodeFilter, IconBtn, Kpi, Tabs } from "../../components/atelier/ui";
import CommandesFournisseur from "./CommandesFournisseur";
import { usePeriode, tnd, dateFr, errMsg, askMotif, isoDay, articleLabel } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
const LIGNE = { stock: "", designation: "", quantite: 1, prixUnitaire: 0, prixSaisis: "HT", remiseType: "montant", remise: 0, remisePct: 0, tauxTVA: 19, fraisImputables: 0 };
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
// ✅ Prix unitaire HT ↔ TTC d'une ligne : le champ tapé est conservé, l'autre est calculé
const puHT = (l) => (l.prixSaisis === "TTC" ? r3(Number(l.prixUnitaire || 0) / (1 + (Number(l.tauxTVA) || 0) / 100)) : l.prixUnitaire);
const puTTC = (l) => (l.prixSaisis === "TTC" ? l.prixUnitaire : r3(Number(l.prixUnitaire || 0) * (1 + (Number(l.tauxTVA) || 0) / 100)));
// ✅ Mêmes calculs que le modèle Depense (au millime) :
//   1) HT brut − remise de ligne (% ou montant HT) ; 2) remise globale répartie au prorata ;
//   3) TVA sur le HT net ; frais hors TVA ; coût de revient = HT + frais
const netHTM = (l) => {
  const t = Number(l.tauxTVA) || 0;
  const brut = Math.round(Number(l.prixUnitaire || 0) * 1000 * Number(l.quantite || 0));
  const brutHT = l.prixSaisis === "TTC" ? Math.round(brut / (1 + t / 100)) : brut;
  const rem = l.remiseType === "pct" ? Math.round((brutHT * (Number(l.remisePct) || 0)) / 100) : Math.round(Number(l.remise || 0) * 1000);
  return Math.max(0, brutHT - rem);
};
/** Une ligne (avant remise globale). */
const calcLigne = (l) => {
  const ht = netHTM(l);
  const tva = Math.round((ht * (Number(l.tauxTVA) || 0)) / 100);
  const frais = Math.round(Number(l.fraisImputables || 0) * 1000);
  return { ht: (ht + frais) / 1000, tva: tva / 1000, ttc: (ht + tva + frais) / 1000 };
};
/** Totaux de la facture d'achat avec la remise globale. */
const calcFacture = (lignes, type, valeur) => {
  const nets = lignes.map(netHTM);
  const somme = nets.reduce((s, n) => s + n, 0);
  const v = Number(valeur) || 0;
  const G = type === "montant" ? Math.min(Math.round(v * 1000), somme) : Math.round((somme * Math.min(100, v)) / 100);
  const parts = nets.map((n) => (somme > 0 ? Math.floor((G * n) / somme) : 0));
  let reste = G - parts.reduce((s, p) => s + p, 0);
  const ordre = nets.map((n, i) => i).sort((a, b) => nets[b] - nets[a]);
  for (let k = 0; reste > 0 && ordre.length; k = (k + 1) % ordre.length) { parts[ordre[k]] += 1; reste -= 1; }
  let ht = 0; let tva = 0; let frais = 0;
  lignes.forEach((l, i) => {
    const h = nets[i] - parts[i];
    ht += h; tva += Math.round((h * (Number(l.tauxTVA) || 0)) / 100); frais += Math.round(Number(l.fraisImputables || 0) * 1000);
  });
  return { avantRemise: somme / 1000, remise: G / 1000, ht: (ht + frais) / 1000, tva: tva / 1000, ttc: (ht + tva + frais) / 1000 };
};

const Achats = () => {
  const { hasPermission } = useAuth();
  const canValidate = hasPermission("achats");
  const canCancel = hasPermission("operations_annuler");
  const articles = useArticles();
  const [fournisseurs, setFournisseurs] = useState([]);
  const familles = useFamilles();
  const [range, setRange] = usePeriode();
  const [statut, setStatut] = useState("");
  const [rows, setRows] = useState([]);
  const [edit, setEditRaw] = useState(null);
  // ✅ Vue globale = consultation : pas d'ouverture du formulaire
  const setEdit = (v) => { if (v && !edit && blockInGlobalView()) return; setEditRaw(v); };
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tvaDefaut, setTvaDefaut] = useState(19);
  const [tauxProposes, setTauxProposes] = useState([7, 19]);
  // ✅ Onglets : factures d'achat | bons de commande fournisseur
  const [onglet, setOnglet] = useState("factures");

  const load = () =>
    getDepenses({ type: "ACHAT", statut: statut || undefined, dateDebut: range.from, dateFin: range.to, limit: 500 })
      .then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  useEffect(() => { load(); }, [range, statut]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getFournisseurs({ actifs: "true" }).then((r) => setFournisseurs(r.data.data)).catch(() => {}); }, []);
  // ✅ Taux de TVA par défaut des lignes = taux des paramètres atelier de la boutique
  useEffect(() => {
    getParametresAtelier().then((r) => {
      const t = Number(r.data?.data?.tauxTVA); if (t >= 0) setTvaDefaut(t);
      if (Array.isArray(r.data?.data?.tauxTVAAutorises)) setTauxProposes(r.data.data.tauxTVAAutorises);
    }).catch(() => {});
  }, []);
  const nouvelleLigne = () => ({ ...LIGNE, tauxTVA: tvaDefaut });

  const openNew = () => setEdit({ famille: "", fournisseurRef: "", factureNumero: "", dateDepense: isoDay(), modePaiement: "ESPECES", observation: "", remiseGlobaleType: "pct", remiseGlobaleValeur: "", lignes: [nouvelleLigne()] });
  const setLigne = (i, k, v) => setEdit((e) => ({ ...e, lignes: e.lignes.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  // ✅ Recherche d'article ; au choix : TVA du produit (figée) + dernier prix d'achat HT proposé
  const optionsArticles = useMemo(() => articles.map((a) => ({
    value: a._id, label: `${a.code ? `${a.code} — ` : ""}${articleLabel(a)} (stock ${a.quantite ?? 0})`,
  })), [articles]);
  const choisirArticle = (i, id) => {
    const a = articles.find((x) => x._id === id);
    setEdit((e) => ({
      ...e,
      lignes: e.lignes.map((l, j) => {
        if (j !== i) return l;
        if (!a) return { ...l, stock: "" };
        const pu = a.dernierCoutAchat ?? a.cmp;
        return {
          ...l, stock: id, designation: "",
          tauxTVA: a.tauxTVA ?? tvaDefaut,
          ...(pu !== null && pu !== undefined && !Number(l.prixUnitaire) ? { prixUnitaire: r3(pu), prixSaisis: "HT" } : {}),
        };
      }),
    }));
  };

  const save = async () => {
    setBusy(true);
    try {
      const f = fournisseurs.find((x) => x._id === edit.fournisseurRef);
      const body = {
        type: "ACHAT", famille: edit.famille || null, fournisseurRef: edit.fournisseurRef || null, fournisseur: f?.nom || edit.fournisseur || "",
        factureNumero: edit.factureNumero, dateDepense: edit.dateDepense, modePaiement: edit.modePaiement,
        observation: edit.observation,
        remiseGlobaleType: edit.remiseGlobaleType || "pct", remiseGlobaleValeur: Number(edit.remiseGlobaleValeur) || 0,
        lignes: edit.lignes.map((l) => ({ ...l, stock: l.stock || null })),
      };
      if (edit._id) await updateDepense(edit._id, body);
      else await createDepense(body);
      setEdit(null);
      setMsg({ type: "success", text: "Facture enregistrée en brouillon" });
      load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const act = async (fn, ok) => {
    try { await fn(); setMsg({ type: "success", text: ok }); load(); } catch (e) { setMsg({ text: errMsg(e) }); }
  };

  const totaux = calcFacture(edit?.lignes || [], edit?.remiseGlobaleType, edit?.remiseGlobaleValeur);
  const sumBy = (st) => r3(rows.filter((r) => r.statut === st).reduce((s, r) => s + (r.montant || 0), 0));
  const nbBrouillons = rows.filter((r) => r.statut === "brouillon").length;

  return (
    <Page>
      <PageHeader icon={<FaFileInvoice />} title="Achats" subtitle="Bons de commande fournisseur et factures d'achat (la validation d'une facture met à jour le stock et le coût moyen)">
        {onglet === "factures" && <button className="btn-modern btn-modern-primary" onClick={openNew}><FaPlus /> Nouvelle facture</button>}
      </PageHeader>
      <Tabs tabs={[["factures", "Factures d'achat"], ["commandes", "Bons de commande"]]} value={onglet} onChange={setOnglet} />
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      {onglet === "commandes" ? (
        <CommandesFournisseur onFactureCreee={(d) => { setOnglet("factures"); setStatut("brouillon"); load(); if (d) setMsg({ type: "success", text: `Facture d'achat ${d.numero} créée en brouillon : vérifiez les quantités et prix reçus puis validez-la (entrée en stock).` }); }} />
      ) : (<>

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4"><Kpi icon={<FaCheckCircle />} tone="success" label="Achats validés" value={tnd(sumBy("validee"))} hint={`${rows.filter((r) => r.statut === "validee").length} facture(s)`} /></div>
        <div className="col-6 col-md-4"><Kpi icon={<FaHourglassHalf />} tone="warning" label="Brouillons à valider" value={nbBrouillons} hint={tnd(sumBy("brouillon"))} /></div>
        <div className="col-6 col-md-4"><Kpi icon={<FaBan />} tone="gray" label="Annulées" value={tnd(sumBy("annulee"))} /></div>
      </div>

      <PeriodeFilter range={range} onChange={setRange}>
        <div>
          <label className="form-label">Statut</label>
          <select className="form-control-modern" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous</option><option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option><option value="annulee">Annulée</option>
          </select>
        </div>
      </PeriodeFilter>

      <Table
        rows={rows}
        empty="Aucune facture d'achat sur cette période"
        cols={[
          { label: "N°", render: (r) => <b>{r.numero}</b> },
          { label: "Date", render: (r) => dateFr(r.dateDepense) },
          { label: "Fournisseur", render: (r) => r.fournisseurRef?.nom || r.fournisseur || "—" },
          { label: "Réf. facture", render: (r) => r.factureNumero || "—" },
          { label: "Lignes", right: true, render: (r) => r.lignes?.length || 0 },
          { label: "Montant TTC", right: true, render: (r) => <b>{tnd(r.montant)}</b> },
          { label: "Statut", render: (r) => <StatutBadge statut={r.statut} /> },
          {
            label: "", render: (r) => (
              <div className="at-actions">
                <IconBtn title="Détail" onClick={() => setView(r)}><FaEye /></IconBtn>
                {r.statut === "brouillon" && (
                  <IconBtn title="Modifier" onClick={() => setEdit({ ...r, famille: r.famille?._id || r.famille || "", fournisseurRef: r.fournisseurRef?._id || "", dateDepense: isoDay(new Date(r.dateDepense)), remiseGlobaleType: r.remiseGlobaleType || "pct", remiseGlobaleValeur: r.remiseGlobaleValeur || "", lignes: r.lignes.map((l) => ({ ...l, prixSaisis: l.prixSaisis || r.prixSaisis || "HT", tauxTVA: l.tauxTVA ?? 0, stock: l.stock || "", remiseType: l.remiseType || "montant" })) })}>
                    <FaEdit />
                  </IconBtn>
                )}
                {r.statut === "brouillon" && canValidate && (
                  <IconBtn title="Valider" tone="success" onClick={async () => (await confirmer({ message: `Valider ${r.numero} ? Le stock et les coûts seront mis à jour.` })) && act(() => validerDepense(r._id), "Facture validée")}>
                    <FaCheck />
                  </IconBtn>
                )}
                {r.statut === "validee" && canCancel && (
                  <IconBtn title="Annuler (contre-écriture)" tone="danger" onClick={async () => { const m = await askMotif("Motif d'annulation :"); if (m) act(() => annulerDepense(r._id, m), "Facture annulée"); }}>
                    <FaBan />
                  </IconBtn>
                )}
              </div>
            ),
          },
        ]}
      />
      </>)}

      {/* ---------- Saisie ---------- */}
      <FormModal show={!!edit} size="xl" title={edit?._id ? `Modifier ${edit.numero}` : "Nouvelle facture d'achat"} onClose={() => setEdit(null)} onSubmit={save} busy={busy} submitLabel="Enregistrer en brouillon">
        {edit && (
          <>
            <div className="row g-3 mb-4">
              <Field label="Fournisseur" col="col-12 col-md-4">
                <select className="form-control-modern" value={edit.fournisseurRef} onChange={(e) => setEdit({ ...edit, fournisseurRef: e.target.value })}>
                  <option value="">— Aucun —</option>
                  {fournisseurs.map((f) => <option key={f._id} value={f._id}>{f.nom}</option>)}
                </select>
              </Field>
              <Field label="N° facture fournisseur" col="col-6 col-md-3"><input className="form-control-modern" value={edit.factureNumero} onChange={(e) => setEdit({ ...edit, factureNumero: e.target.value })} /></Field>
              <Field label="Date" col="col-6 col-md-2"><input type="date" className="form-control-modern" value={edit.dateDepense} onChange={(e) => setEdit({ ...edit, dateDepense: e.target.value })} /></Field>
              <Field label="Mode de paiement" col="col-12 col-md-3">
                <select className="form-control-modern" value={edit.modePaiement} onChange={(e) => setEdit({ ...edit, modePaiement: e.target.value })}>
                  {[["ESPECES", "Espèces"], ["CHEQUE", "Chèque"], ["TRAITE", "Traite"], ["VIREMENT", "Virement"], ["CARTE", "Carte"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            <div className="at-card-title">Lignes de la facture</div>
            <div className="doc-lignes">
              {edit.lignes.map((l, i) => {
                const a = l.stock ? articles.find((x) => x._id === l.stock) : null;
                const tvaA = Number(l.tauxTVA) || 0;
                const prixChange = (champ, v) => setEdit((e) => ({ ...e, lignes: e.lignes.map((x, j) => (j === i ? { ...x, prixUnitaire: v, prixSaisis: champ } : x)) }));
                return (
                  <div key={i} className="doc-ligne">
                    {/* Ligne 1 : article (recherche) ou désignation libre */}
                    <div className="doc-ligne-tete">
                      <div className="doc-ligne-num">{i + 1}</div>
                      <div className="doc-ligne-article">
                        <SearchSelect options={optionsArticles} value={l.stock} onChange={(v) => choisirArticle(i, v)} placeholder="Rechercher un article (vide = ligne libre)" />
                        {a && (
                          // ✅ État actuel du produit : stock, TVA figée, dernier achat, CMP
                          <div className="doc-etat">
                            <span className="at-chip">Stock : <b>{a.quantite ?? 0}</b> {a.unite || ""}</span>
                            <span className="at-chip doc-champ-gris">TVA {tvaA.toLocaleString("fr-FR")} % 🔒</span>
                            {a.dernierCoutAchat != null && <span className="at-chip">Dernier achat {tnd(a.dernierCoutAchat)} HT · {tnd(r3(a.dernierCoutAchat * (1 + tvaA / 100)))} TTC</span>}
                            {a.cmp != null && <span className="at-chip">CMP {tnd(a.cmp)} HT</span>}
                          </div>
                        )}
                        {!l.stock && <input className="form-control-modern mt-2" placeholder="Désignation (ligne libre)" value={l.designation} onChange={(e) => setLigne(i, "designation", e.target.value)} />}
                      </div>
                      <div style={{ paddingTop: 4 }}>
                        {edit.lignes.length > 1 && <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setEdit({ ...edit, lignes: edit.lignes.filter((_, j) => j !== i) })}><FaTrash /></IconBtn>}
                      </div>
                    </div>
                    {/* Ligne 2 : Quantité → PU TTC → TVA → PU HT → Remise → Frais → Montant (alignés) */}
                    <div className="doc-ligne-champs">
                      <div className="doc-champ">
                        <label>Quantité</label>
                        <input type="number" step="0.001" min="0" className="form-control-modern" value={l.quantite} onChange={(e) => setLigne(i, "quantite", e.target.value)} />
                      </div>
                      <div className="doc-champ">
                        <label>PU TTC</label>
                        <input type="number" step="0.001" min="0" className="form-control-modern" value={puTTC(l)}
                          style={l.prixSaisis === "TTC" ? { fontWeight: 600 } : undefined} onChange={(e) => prixChange("TTC", e.target.value)} />
                      </div>
                      <div className="doc-champ">
                        <label>TVA %</label>
                        {l.stock
                          ? <input className="form-control-modern doc-champ-gris" disabled title="TVA du produit (non modifiable)" value={`${tvaA.toLocaleString("fr-FR")} %`} />
                          : <TvaInput value={l.tauxTVA} onChange={(v) => setLigne(i, "tauxTVA", v)} taux={tauxProposes} />}
                      </div>
                      <div className="doc-champ">
                        <label>PU HT</label>
                        <input type="number" step="0.001" min="0" className="form-control-modern" value={puHT(l)}
                          style={l.prixSaisis !== "TTC" ? { fontWeight: 600 } : undefined} onChange={(e) => prixChange("HT", e.target.value)} />
                      </div>
                      <div className="doc-champ">
                        <label>Remise {l.remiseType === "pct" ? "(%)" : "(DT HT)"}</label>
                        <RemiseInput type={l.remiseType === "pct" ? "pct" : "montant"} valeur={l.remiseType === "pct" ? l.remisePct : l.remise}
                          onChange={(type, v) => setEdit((e) => ({ ...e, lignes: e.lignes.map((x, j) => (j === i ? (type === "pct" ? { ...x, remiseType: "pct", remisePct: v, remise: 0 } : { ...x, remiseType: "montant", remise: v, remisePct: 0 }) : x)) }))} />
                      </div>
                      <div className="doc-champ">
                        <label>Frais (hors TVA)</label>
                        <input type="number" step="0.001" min="0" className="form-control-modern" value={l.fraisImputables} onChange={(e) => setLigne(i, "fraisImputables", e.target.value)} />
                      </div>
                      <div className="doc-champ">
                        <label style={{ textAlign: "right" }}>Montant TTC</label>
                        <div className="doc-champ-total">{tnd(calcLigne(l).ttc)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-2">
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setEdit({ ...edit, lignes: [...edit.lignes, nouvelleLigne()] })}><FaPlus /> Ajouter une ligne</button>
              {/* ✅ Remise sur toute la facture d'achat (HT, répartie au prorata → coût et CMP justes) */}
              <div className="doc-champ" style={{ width: 210 }}>
                <label>Remise globale {edit.remiseGlobaleType === "montant" ? "(DT HT)" : "(%)"}</label>
                <RemiseInput type={edit.remiseGlobaleType || "pct"} valeur={edit.remiseGlobaleValeur} ariaLabel="Remise globale"
                  onChange={(type, v) => setEdit((e) => ({ ...e, remiseGlobaleType: type, remiseGlobaleValeur: v }))} />
              </div>
            </div>
            <div className="mb-3" style={{ textAlign: "right" }}>
              {totaux.remise > 0 && (
                <div className="at-muted">Total HT avant remise : <b>{tnd(totaux.avantRemise)}</b> · Remise globale : <b style={{ color: "#dc2626" }}>− {tnd(totaux.remise)}</b></div>
              )}
              <div className="at-muted">Total HT (coût du stock) : <b>{tnd(totaux.ht)}</b> · TVA : <b>{tnd(totaux.tva)}</b></div>
              <span className="at-total">Total TTC : {tnd(totaux.ttc)}</span>
            </div>
            <Field label="Famille (lignes hors stock, statistiques Bénéfice)">
              <select className="form-control-modern" value={edit.famille || ""} onChange={(e) => setEdit({ ...edit, famille: e.target.value })}>
                <option value="">Générale — répartie sur toutes les familles</option>
                {familles.map((f) => <option key={f._id} value={f._id}>{f.nom}</option>)}
              </select>
            </Field>
            <Field label="Observation"><input className="form-control-modern" value={edit.observation || ""} onChange={(e) => setEdit({ ...edit, observation: e.target.value })} /></Field>
          </>
        )}
      </FormModal>

      {/* ---------- Détail ---------- */}
      <FormModal show={!!view} size="lg" title={`Facture ${view?.numero || ""}`} onClose={() => setView(null)}>
        {view && (
          <>
            <div className="row g-3 mb-3">
              <div className="col-6 col-md-3"><div className="at-stat-label">Statut</div><StatutBadge statut={view.statut} /></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Fournisseur</div><div className="at-stat-value">{view.fournisseurRef?.nom || view.fournisseur || "—"}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Date</div><div className="at-stat-value">{dateFr(view.dateDepense)}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Total TTC</div><div className="at-stat-value">{tnd(view.montant)}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Total HT</div><div className="at-stat-value">{tnd(view.montantHT ?? view.montant)}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">TVA</div><div className="at-stat-value">{tnd(view.montantTVA || 0)}</div></div>
            </div>
            {view.modeStockApplique && <div className="at-muted mb-2">Mode de stock appliqué à la validation : <b>{view.modeStockApplique}</b></div>}
            {view.motifAnnulation && <Alert type="warning" msg={`Annulée : ${view.motifAnnulation}`} />}
            <Table rows={view.lignes} cols={[
              { key: "designation", label: "Désignation" }, { key: "quantite", label: "Qté", right: true },
              { label: "TVA %", right: true, render: (l) => l.tauxTVA ?? 0 },
              { label: "PU HT", right: true, render: (l) => tnd(puHT({ ...l, prixSaisis: l.prixSaisis || view.prixSaisis })) },
              { label: "PU TTC", right: true, render: (l) => tnd(puTTC({ ...l, prixSaisis: l.prixSaisis || view.prixSaisis })) },
              { label: "Remise HT", right: true, render: (l) => tnd(l.remise) },
              { label: "Frais", right: true, render: (l) => tnd(l.fraisImputables) }, { label: "Coût de revient u. HT", right: true, render: (l) => tnd(l.coutUnitaireRevient) },
              { label: "Montant TTC", right: true, render: (l) => <b>{tnd(l.montant)}</b> },
            ]} />
            <div className="at-card-title mt-4">Pièces justificatives</div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {(view.piecesJointes || []).length === 0 && <span className="at-muted">Aucune pièce jointe</span>}
              {(view.piecesJointes || []).map((p) => (
                <button key={p._id} type="button" className="at-chip" style={{ border: "none", cursor: "pointer" }} onClick={() => openPieceJointe(view._id, p._id)}>
                  <FaFilePdf /> {p.nom}
                </button>
              ))}
            </div>
            {view.statut !== "annulee" && (
              <label className="btn-modern btn-modern-outline btn-sm" style={{ cursor: "pointer" }}>
                <FaPaperclip /> Joindre un fichier (PDF / image)
                <input type="file" hidden accept="application/pdf,image/*" onChange={async (e) => {
                  const f = e.target.files[0];
                  if (!f) return;
                  try {
                    const r = await uploadPieceJointe(view._id, f);
                    setView({ ...view, piecesJointes: r.data.data });
                  } catch (err) { setMsg({ text: errMsg(err) }); }
                }} />
              </label>
            )}
          </>
        )}
      </FormModal>
    </Page>
  );
};

export default Achats;
