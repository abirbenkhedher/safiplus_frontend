import { useEffect, useState } from "react";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import {
  FaPlus, FaCheck, FaBan, FaEdit, FaPaperclip, FaEye, FaFileInvoice, FaTrash, FaHourglassHalf, FaCheckCircle, FaFilePdf,
} from "react-icons/fa";
import { getDepenses, createDepense, updateDepense } from "../../api/depenses";
import { getFournisseurs, validerDepense, annulerDepense, uploadPieceJointe, openPieceJointe } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { ArticleSelect } from "../../components/atelier/pickers";
import { useArticles } from "../../hooks/useAtelierRefs";
import { Page, PageHeader, Alert, Table, FormModal, Field, StatutBadge, PeriodeFilter, IconBtn, Kpi } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg, askMotif, isoDay } from "../../utils/atelier";

const LIGNE = { stock: "", designation: "", quantite: 1, prixUnitaire: 0, remise: 0, fraisImputables: 0 };
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const montantLigne = (l) => r3(Number(l.quantite) * Number(l.prixUnitaire) - Number(l.remise || 0) + Number(l.fraisImputables || 0));
const LINE_GRID = { gridTemplateColumns: "minmax(220px, 3fr) repeat(4, minmax(90px, 1fr)) minmax(110px, 1fr) 32px" };

const Achats = () => {
  const { hasPermission } = useAuth();
  const canValidate = hasPermission("achats");
  const canCancel = hasPermission("operations_annuler");
  const articles = useArticles();
  const [fournisseurs, setFournisseurs] = useState([]);
  const [range, setRange] = usePeriode();
  const [statut, setStatut] = useState("");
  const [rows, setRows] = useState([]);
  const [edit, setEditRaw] = useState(null);
  // ✅ Vue globale = consultation : pas d'ouverture du formulaire
  const setEdit = (v) => { if (v && !edit && blockInGlobalView()) return; setEditRaw(v); };
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getDepenses({ type: "ACHAT", statut: statut || undefined, dateDebut: range.from, dateFin: range.to, limit: 500 })
      .then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  useEffect(() => { load(); }, [range, statut]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getFournisseurs({ actifs: "true" }).then((r) => setFournisseurs(r.data.data)).catch(() => {}); }, []);

  const openNew = () => setEdit({ fournisseurRef: "", factureNumero: "", dateDepense: isoDay(), modePaiement: "ESPECES", observation: "", lignes: [{ ...LIGNE }] });
  const setLigne = (i, k, v) => setEdit((e) => ({ ...e, lignes: e.lignes.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));

  const save = async () => {
    setBusy(true);
    try {
      const f = fournisseurs.find((x) => x._id === edit.fournisseurRef);
      const body = {
        type: "ACHAT", fournisseurRef: edit.fournisseurRef || null, fournisseur: f?.nom || edit.fournisseur || "",
        factureNumero: edit.factureNumero, dateDepense: edit.dateDepense, modePaiement: edit.modePaiement,
        observation: edit.observation,
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

  const total = edit ? r3(edit.lignes.reduce((s, l) => s + montantLigne(l), 0)) : 0;
  const sumBy = (st) => r3(rows.filter((r) => r.statut === st).reduce((s, r) => s + (r.montant || 0), 0));
  const nbBrouillons = rows.filter((r) => r.statut === "brouillon").length;

  return (
    <Page>
      <PageHeader icon={<FaFileInvoice />} title="Factures d'achat" subtitle="La validation met à jour le stock et le coût moyen selon le mode de la boutique">
        <button className="btn-modern btn-modern-primary" onClick={openNew}><FaPlus /> Nouvelle facture</button>
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4"><Kpi icon={<FaCheckCircle />} tone="success" label="Achats validés" value={tnd(sumBy("validee"))} hint={`${rows.filter((r) => r.statut === "validee").length} facture(s)`} /></div>
        <div className="col-12 col-md-4"><Kpi icon={<FaHourglassHalf />} tone="warning" label="Brouillons à valider" value={nbBrouillons} hint={tnd(sumBy("brouillon"))} /></div>
        <div className="col-12 col-md-4"><Kpi icon={<FaBan />} tone="gray" label="Annulées" value={tnd(sumBy("annulee"))} /></div>
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
          { label: "Montant", right: true, render: (r) => <b>{tnd(r.montant)}</b> },
          { label: "Statut", render: (r) => <StatutBadge statut={r.statut} /> },
          {
            label: "", render: (r) => (
              <div className="at-actions">
                <IconBtn title="Détail" onClick={() => setView(r)}><FaEye /></IconBtn>
                {r.statut === "brouillon" && (
                  <IconBtn title="Modifier" onClick={() => setEdit({ ...r, fournisseurRef: r.fournisseurRef?._id || "", dateDepense: isoDay(new Date(r.dateDepense)), lignes: r.lignes.map((l) => ({ ...l, stock: l.stock || "" })) })}>
                    <FaEdit />
                  </IconBtn>
                )}
                {r.statut === "brouillon" && canValidate && (
                  <IconBtn title="Valider" tone="success" onClick={() => window.confirm(`Valider ${r.numero} ? Le stock et les coûts seront mis à jour.`) && act(() => validerDepense(r._id), "Facture validée")}>
                    <FaCheck />
                  </IconBtn>
                )}
                {r.statut === "validee" && canCancel && (
                  <IconBtn title="Annuler (contre-écriture)" tone="danger" onClick={() => { const m = askMotif("Motif d'annulation :"); if (m) act(() => annulerDepense(r._id, m), "Facture annulée"); }}>
                    <FaBan />
                  </IconBtn>
                )}
              </div>
            ),
          },
        ]}
      />

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
                  {[["ESPECES", "Espèces"], ["CHEQUE", "Chèque"], ["VIREMENT", "Virement"], ["CARTE", "Carte"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>

            <div className="at-card-title">Lignes de la facture</div>
            <div className="at-lines">
              <div className="at-line d-none d-lg-grid" style={{ ...LINE_GRID, background: "var(--at-head-bg)" }}>
                {["Article (ou ligne libre)", "Quantité", "Prix unitaire", "Remise", "Frais", "Montant", ""].map((h, i) => (
                  <div key={i} className="form-label mb-0" style={i === 5 ? { textAlign: "right" } : undefined}>{h}</div>
                ))}
              </div>
              {edit.lignes.map((l, i) => (
                <div key={i} className="at-line" style={LINE_GRID}>
                  <div>
                    <ArticleSelect articles={articles} value={l.stock} onChange={(v) => setLigne(i, "stock", v)} />
                    {!l.stock && <input className="form-control-modern mt-2" placeholder="Désignation (ligne libre)" value={l.designation} onChange={(e) => setLigne(i, "designation", e.target.value)} />}
                  </div>
                  {["quantite", "prixUnitaire", "remise", "fraisImputables"].map((k) => (
                    <input key={k} type="number" step="0.001" min="0" className="form-control-modern" aria-label={k} value={l[k]} onChange={(e) => setLigne(i, k, e.target.value)} />
                  ))}
                  <div className="at-num" style={{ textAlign: "right", fontWeight: 600, paddingTop: 11 }}>{tnd(montantLigne(l))}</div>
                  <div style={{ paddingTop: 5 }}>
                    {edit.lignes.length > 1 && <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setEdit({ ...edit, lignes: edit.lignes.filter((_, j) => j !== i) })}><FaTrash /></IconBtn>}
                  </div>
                </div>
              ))}
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setEdit({ ...edit, lignes: [...edit.lignes, { ...LIGNE }] })}><FaPlus /> Ajouter une ligne</button>
              <span className="at-total">Total : {tnd(total)}</span>
            </div>
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
              <div className="col-6 col-md-3"><div className="at-stat-label">Montant</div><div className="at-stat-value">{tnd(view.montant)}</div></div>
            </div>
            {view.modeStockApplique && <div className="at-muted mb-2">Mode de stock appliqué à la validation : <b>{view.modeStockApplique}</b></div>}
            {view.motifAnnulation && <Alert type="warning" msg={`Annulée : ${view.motifAnnulation}`} />}
            <Table rows={view.lignes} cols={[
              { key: "designation", label: "Désignation" }, { key: "quantite", label: "Qté", right: true },
              { label: "PU", right: true, render: (l) => tnd(l.prixUnitaire) }, { label: "Remise", right: true, render: (l) => tnd(l.remise) },
              { label: "Frais", right: true, render: (l) => tnd(l.fraisImputables) }, { label: "Coût de revient u.", right: true, render: (l) => tnd(l.coutUnitaireRevient) },
              { label: "Montant", right: true, render: (l) => <b>{tnd(l.montant)}</b> },
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
