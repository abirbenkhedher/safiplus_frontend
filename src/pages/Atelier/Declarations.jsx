import { useEffect, useState } from "react";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import { FaPlus, FaCheck, FaBan, FaEdit, FaEye, FaClipboardCheck, FaTrash, FaInfoCircle } from "react-icons/fa";
import {
  getDeclarations, createDeclaration, updateDeclaration, validerDeclaration, annulerDeclaration, getParametresAtelier,
} from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { ArticleSelect, ReparateurSelect, ReparationPicker } from "../../components/atelier/pickers";
import { useArticles, useReparateurs } from "../../hooks/useAtelierRefs";
import { Page, PageHeader, Alert, Table, FormModal, Field, StatutBadge, PeriodeFilter, IconBtn } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, userName, errMsg, askMotif, isoDay } from "../../utils/atelier";

const LIGNE = { stock: "", quantite: 1, reparation: null, reparationNumero: null };
const LIEN = { obligatoire: "obligatoire", facultatif: "facultatif", desactive: "désactivé" };
const LINE_GRID = { gridTemplateColumns: "minmax(220px, 3fr) 100px minmax(180px, 2fr) 32px" };

const Declarations = () => {
  const { user, hasPermission } = useAuth();
  const canValidate = hasPermission("consommations_valider");
  const canCancel = hasPermission("operations_annuler");
  const articles = useArticles();
  const reparateurs = useReparateurs();
  const [params, setParams] = useState(null);
  const [range, setRange] = usePeriode();
  const [rows, setRows] = useState([]);
  const [edit, setEditRaw] = useState(null);
  // ✅ Vue globale = consultation : pas d'ouverture du formulaire
  const setEdit = (v) => { if (v && !edit && blockInGlobalView()) return; setEditRaw(v); };
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getDeclarations(range).then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  useEffect(() => { load(); }, [range]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getParametresAtelier().then((r) => setParams(r.data.data)).catch(() => {}); }, []);

  const lien = params?.lienDeclarationReparation || "facultatif";
  const desactivee = params?.modeSaisieConsommation === "reparation";
  const setLigne = (i, patch) => setEdit((e) => ({ ...e, lignes: e.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  const save = async () => {
    setBusy(true);
    try {
      const body = {
        jour: edit.jour, reparateur: edit.reparateur || undefined, observation: edit.observation,
        lignes: edit.lignes.map((l) => ({ stock: l.stock, quantite: Number(l.quantite), reparation: l.reparation || null })),
      };
      if (edit._id) await updateDeclaration(edit._id, body);
      else await createDeclaration(body);
      setEdit(null);
      load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const act = async (fn) => {
    try {
      const r = await fn();
      setMsg({ type: "success", text: r.data.message + (r.data.alertes?.length ? ` — ${r.data.alertes.length} alerte(s) commission` : "") });
      load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
  };

  return (
    <Page>
      <PageHeader icon={<FaClipboardCheck />} title="Déclarations journalières" subtitle={`Consommations groupées par réparateur et par jour · lien avec un dossier : ${LIEN[lien]}`}>
        {!desactivee && (
          <button className="btn-modern btn-modern-primary" onClick={() => setEdit({ jour: isoDay(), reparateur: "", observation: "", lignes: [{ ...LIGNE }] })}>
            <FaPlus /> Nouvelle déclaration
          </button>
        )}
      </PageHeader>
      {desactivee && <Alert type="warning" msg="Cette boutique saisit les consommations uniquement dans les dossiers de réparation." />}
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange} />

      <Table
        rows={rows}
        empty="Aucune déclaration sur cette période"
        cols={[
          { label: "Jour", render: (r) => <b>{dateFr(r.date)}</b> },
          { label: "Réparateur", render: (r) => userName(r.reparateur) },
          { label: "Lignes", right: true, render: (r) => r.lignes.length },
          { label: "Coût", right: true, render: (r) => (r.statut === "brouillon" ? "—" : <b>{tnd(r.coutTotal)}</b>) },
          { label: "Statut", render: (r) => <StatutBadge statut={r.statut} /> },
          {
            label: "", render: (r) => (
              <div className="at-actions">
                <IconBtn title="Détail" onClick={() => setView(r)}><FaEye /></IconBtn>
                {r.statut === "brouillon" && (
                  <IconBtn title="Modifier" onClick={() => setEdit({
                    ...r, reparateur: r.reparateur?._id,
                    lignes: r.lignes.map((l) => ({ stock: l.stock, quantite: l.quantite, reparation: l.reparation?._id || null, reparationNumero: l.reparation?.numero })),
                  })}><FaEdit /></IconBtn>
                )}
                {r.statut === "brouillon" && canValidate && (
                  <IconBtn title="Valider" tone="success" onClick={() => act(() => validerDeclaration(r._id))}><FaCheck /></IconBtn>
                )}
                {(r.statut === "brouillon" || (r.statut === "validee" && canCancel)) && (
                  <IconBtn title="Annuler" tone="danger" onClick={() => {
                    const m = r.statut === "brouillon" ? "Brouillon annulé" : askMotif("Motif d'annulation :");
                    if (m) act(() => annulerDeclaration(r._id, m));
                  }}><FaBan /></IconBtn>
                )}
              </div>
            ),
          },
        ]}
      />

      <FormModal show={!!edit} size="xl" title={edit?._id ? `Déclaration du ${edit.jour}` : "Nouvelle déclaration journalière"} onClose={() => setEdit(null)} onSubmit={save} busy={busy} submitLabel="Enregistrer en brouillon">
        {edit && (
          <>
            <div className="row g-3 mb-4">
              <Field label="Jour" col="col-12 col-md-4"><input type="date" className="form-control-modern" disabled={!!edit._id} value={edit.jour} onChange={(e) => setEdit({ ...edit, jour: e.target.value })} /></Field>
              {canValidate && !edit._id && (
                <Field label="Réparateur" col="col-12 col-md-5">
                  <ReparateurSelect reparateurs={reparateurs} value={edit.reparateur} allLabel={`Moi (${userName(user)})`} onChange={(v) => setEdit({ ...edit, reparateur: v })} />
                </Field>
              )}
            </div>

            <div className="at-card-title">Pièces consommées</div>
            <div className="at-lines">
              <div className="at-line d-none d-lg-grid" style={{ ...LINE_GRID, background: "var(--at-head-bg)" }}>
                {["Article", "Quantité", lien !== "desactive" ? `Dossier (${LIEN[lien]})` : "", ""].map((h, i) => <div key={i} className="form-label mb-0">{h}</div>)}
              </div>
              {edit.lignes.map((l, i) => (
                <div key={i} className="at-line" style={LINE_GRID}>
                  <ArticleSelect articles={articles} required value={l.stock} onChange={(v) => setLigne(i, { stock: v })} />
                  <input type="number" min="1" step="1" className="form-control-modern" aria-label="Quantité" value={l.quantite} onChange={(e) => setLigne(i, { quantite: e.target.value })} />
                  <div>
                    {lien !== "desactive" && (
                      <ReparationPicker value={l.reparation} label={l.reparationNumero} onChange={(id, numero) => setLigne(i, { reparation: id, reparationNumero: numero })} />
                    )}
                  </div>
                  <div style={{ paddingTop: 5 }}>
                    {edit.lignes.length > 1 && <IconBtn title="Supprimer la ligne" tone="danger" onClick={() => setEdit({ ...edit, lignes: edit.lignes.filter((_, j) => j !== i) })}><FaTrash /></IconBtn>}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" className="btn-modern btn-modern-outline btn-sm mb-3" onClick={() => setEdit({ ...edit, lignes: [...edit.lignes, { ...LIGNE }] })}><FaPlus /> Ajouter une ligne</button>
            <div className="at-alert at-alert-info mb-0">
              <span><FaInfoCircle /> Une pièce déjà saisie dans le dossier lié est automatiquement exclue à la validation (anti-doublon).
                {lien === "obligatoire" && " Le rattachement à un dossier est obligatoire dans cette boutique."}</span>
            </div>
          </>
        )}
      </FormModal>

      <FormModal show={!!view} size="lg" title={`Déclaration du ${view ? dateFr(view.date) : ""} — ${userName(view?.reparateur)}`} onClose={() => setView(null)}>
        {view && (
          <>
            <div className="d-flex gap-3 align-items-center mb-3 flex-wrap">
              <StatutBadge statut={view.statut} />
              {view.statut !== "brouillon" && <span className="at-stat-value">Coût total : {tnd(view.coutTotal)}</span>}
              {view.valideePar && <span className="at-muted">Validée le {dateFr(view.valideeLe)} par {userName(view.valideePar)}</span>}
            </div>
            <Table rows={view.lignes} cols={[
              { key: "designation", label: "Article" }, { key: "quantite", label: "Qté", right: true },
              { label: "Dossier", render: (l) => l.reparation?.numero || "—" },
              { label: "Coût u.", right: true, render: (l) => tnd(l.coutUnitaire) },
              { label: "Coût", right: true, render: (l) => tnd(l.coutTotal) },
              { label: "Valorisation", render: (l) => l.sourceCout || "—" },
              { label: "Statut", render: (l) => <span title={l.motifExclusion}><StatutBadge statut={l.statut} /></span> },
            ]} />
          </>
        )}
      </FormModal>
    </Page>
  );
};

export default Declarations;
