import { useEffect, useState } from "react";
import { FaCashRegister, FaLockOpen, FaLock, FaPlus, FaMinus, FaBan, FaEye, FaUndo, FaPrint } from "react-icons/fa";
import {
  getCaisseCourante, getSessionsCaisse, getSessionCaisse, ouvrirCaisse, mouvementCaisse, annulerMouvementCaisse,
  fermerCaisse, rouvrirCaisse, CATEGORIES_MOUVEMENT, BILLETS,
} from "../../api/caisse";
import { modeLabel } from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { isGlobalView } from "../../utils/boutiqueStorage";
import { Page, PageHeader, Alert, Card, Table, Kpi, IconBtn, FormModal, Field, PeriodeFilter } from "../../components/atelier/ui";
import { tnd, dateFr, errMsg, askMotif, userName, usePeriode } from "../../utils/atelier";

// ============================================================
// ✅ Caisse journalière (espèces)
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const heure = (d) => (d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
const CAT = Object.fromEntries(CATEGORIES_MOUVEMENT);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Lignes du calcul théorique (communes à la session courante et au détail). */
const lignesCalcul = (s, c) => [
  ["Fond de caisse initial", s.fondInitial, ""],
  ["+ Règlements en espèces", c.encaissementsEspeces, "Ventes comptoir, factures, avances (espèces)"],
  ["− Remboursements en espèces", -(c.remboursementsEspeces || 0), ""],
  ["+ Entrées diverses", c.entrees, ""],
  ["− Sorties diverses", -(c.sorties || 0), ""],
  ["+ Acomptes saisis dans les dossiers de réparation", c.acomptesReparations, "Considérés payés en espèces"],
];

const imprimerZ = (s) => {
  const c = s.totaux || s.calcul || {};
  const m3 = (v) => Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const rows = lignesCalcul(s, c).map(([l, v]) => `<tr><td>${esc(l)}</td><td class="r">${m3(v)}</td></tr>`).join("");
  const autres = Object.entries(c.autresModes || {}).map(([m, v]) => `<tr><td>${esc(modeLabel(m))}</td><td class="r">${m3(v)}</td></tr>`).join("");
  const w = window.open("", "_blank", "width=420,height=640");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Caisse ${esc(s.numero)}</title>
<style>@page{size:80mm auto;margin:3mm}body{font-family:"Courier New",monospace;font-size:12px;width:72mm;margin:0 auto}table{width:100%}.r{text-align:right}hr{border:0;border-top:1px dashed #000}</style></head><body>
<b>Clôture de caisse ${esc(s.numero)}</b><br/>Ouverture : ${heure(s.ouvertureLe)}<br/>Fermeture : ${heure(s.fermeLe)}<hr/>
<table>${rows}<tr><td><b>Théorique espèces</b></td><td class="r"><b>${m3(c.theorique)}</b></td></tr>
<tr><td>Compté</td><td class="r">${m3(s.montantCompte)}</td></tr><tr><td><b>Écart</b></td><td class="r"><b>${m3(s.ecart)}</b></td></tr>
<tr><td>Fond laissé</td><td class="r">${m3(s.fondLaisse)}</td></tr><tr><td>Remise en banque</td><td class="r">${m3(s.remiseBanque)}</td></tr></table>
${autres ? `<hr/><b>Autres modes (info)</b><table>${autres}</table>` : ""}
${s.observationFermeture ? `<hr/>${esc(s.observationFermeture)}` : ""}
<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
};

const Caisse = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("caisse");
  const canReopen = hasPermission("clotures_rouvrir");
  const lectureSeule = isGlobalView();
  const [courante, setCourante] = useState(undefined); // undefined = chargement, null = fermée
  const [derniere, setDerniere] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [range, setRange] = usePeriode();
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ouverture, setOuverture] = useState(null);
  const [mvt, setMvt] = useState(null);
  const [fermeture, setFermeture] = useState(null);
  const [vue, setVue] = useState(null);

  const loadCourante = () => getCaisseCourante().then((r) => { setCourante(r.data.data); setDerniere(r.data.derniere || null); }).catch((e) => setMsg({ text: errMsg(e) }));
  const loadSessions = () => getSessionsCaisse({ from: range.from, to: range.to }).then((r) => setSessions(r.data.data)).catch(() => {});
  const reload = () => { loadCourante(); loadSessions(); };
  useEffect(() => { loadCourante(); }, []);
  useEffect(() => { loadSessions(); }, [range]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, ok, after) => {
    setBusy(true);
    try { const r = await fn(); setMsg({ type: "success", text: ok }); after?.(r); reload(); } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const c = courante?.calcul;
  const totalComptage = fermeture ? r3(BILLETS.reduce((s, b) => s + b * (Number(fermeture.comptage[b]) || 0), 0)) : 0;
  const compteFermeture = fermeture ? (fermeture.parDetail ? totalComptage : Number(fermeture.montantCompte) || 0) : 0;

  return (
    <Page>
      <PageHeader icon={<FaCashRegister />} title="Caisse" subtitle="Ouverture, mouvements d'espèces et fermeture avec comptage">
        {canWrite && !lectureSeule && courante === null && (
          <button className="btn-modern btn-modern-primary" onClick={() => setOuverture({ fondInitial: derniere?.fondLaisse ?? 0, observation: "" })}><FaLockOpen /> Ouvrir la caisse</button>
        )}
        {canWrite && !lectureSeule && courante && (
          <>
            <button className="btn-modern btn-modern-outline" onClick={() => setMvt({ type: "ENTREE", categorie: "apport", montant: "", motif: "" })}><FaPlus /> Entrée</button>
            <button className="btn-modern btn-modern-outline" onClick={() => setMvt({ type: "SORTIE", categorie: "depense", montant: "", motif: "" })}><FaMinus /> Sortie</button>
            <button className="btn-modern btn-modern-primary" onClick={() => setFermeture({ parDetail: true, comptage: {}, montantCompte: "", fondLaisse: courante.fondInitial, observation: "" })}><FaLock /> Fermer la caisse</button>
          </>
        )}
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      {lectureSeule && <Alert type="warning" msg="Vue « Toutes les boutiques » : choisissez une boutique pour gérer sa caisse." />}

      {courante === null && (
        <Card>
          <div className="at-muted">
            Caisse fermée.{derniere ? ` Dernière fermeture : ${derniere.numero} le ${heure(derniere.fermeLe)} — fond laissé ${tnd(derniere.fondLaisse)}, écart ${tnd(derniere.ecart)}.` : ""}
          </div>
        </Card>
      )}

      {courante && c && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi tone="success" label={`Caisse ${courante.numero} ouverte`} value={heure(courante.ouvertureLe)} hint={`Fond ${tnd(courante.fondInitial)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="primary" label="Espèces théoriques" value={tnd(c.theorique)} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="info" label="Règlements espèces" value={tnd(c.encaissementsEspeces)} hint={`${courante.reglements.length} règlement(s)`} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="gray" label="Autres modes (info)" value={tnd(Object.values(c.autresModes || {}).reduce((s, v) => s + v, 0))}
              hint={Object.entries(c.autresModes || {}).map(([m, v]) => `${modeLabel(m)} ${tnd(v)}`).join(" · ") || "—"} /></div>
          </div>
          {courante.fondPropose !== null && courante.fondPropose !== undefined && r3(courante.fondPropose) !== r3(courante.fondInitial) && (
            <Alert type="warning" msg={`Fond d'ouverture (${tnd(courante.fondInitial)}) différent du fond laissé à la fermeture précédente (${tnd(courante.fondPropose)}).`} />
          )}
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-5">
              <Card title="Calcul des espèces théoriques">
                {lignesCalcul(courante, c).map(([l, v, h]) => (
                  <div key={l} className="d-flex justify-content-between" title={h}><span>{l}</span><b>{tnd(v)}</b></div>
                ))}
                <div className="d-flex justify-content-between at-total mt-2"><span>Théorique</span><span>{tnd(c.theorique)}</span></div>
                {c.acomptesDetails?.length > 0 && (
                  <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
                    Acomptes dossiers : {c.acomptesDetails.map((a) => `${a.numero} ${tnd(a.montant)}`).join(" · ")}
                  </div>
                )}
              </Card>
            </div>
            <div className="col-12 col-lg-7">
              <div className="at-card-title">Mouvements</div>
              <Table rows={courante.mouvements} empty="Aucune entrée ni sortie" cols={[
                { label: "Heure", render: (m) => heure(m.createdAt) },
                { label: "Type", render: (m) => <span className={`badge-modern badge-modern-${m.type === "ENTREE" ? "success" : "warning"}`}>{m.type === "ENTREE" ? "Entrée" : "Sortie"}</span> },
                { label: "Motif", render: (m) => <>{m.motif}<div className="at-muted" style={{ fontSize: 12 }}>{CAT[m.categorie]} · {userName(m.createdBy)}</div></> },
                { label: "Montant", right: true, render: (m) => <span style={{ textDecoration: m.statut === "annule" ? "line-through" : undefined }}>{tnd(m.montant)}</span> },
                { label: "", render: (m) => m.statut === "valide" && canWrite && (
                  <IconBtn title="Annuler" tone="danger" onClick={async () => { const x = await askMotif("Motif d'annulation :"); if (x) run(() => annulerMouvementCaisse(m._id, x), "Mouvement annulé"); }}><FaBan /></IconBtn>
                ) },
              ]} />
            </div>
          </div>
        </>
      )}

      <div className="at-card-title mt-2">Historique des caisses</div>
      <PeriodeFilter range={range} onChange={setRange} />
      <Table rows={sessions} empty="Aucune session sur cette période" cols={[
        { label: "N°", render: (s) => <b>{s.numero}</b> },
        { label: "Ouverture", render: (s) => <>{heure(s.ouvertureLe)}<div className="at-muted" style={{ fontSize: 12 }}>{userName(s.ouvertPar)}</div></> },
        { label: "Fermeture", render: (s) => (s.fermeLe ? <>{heure(s.fermeLe)}<div className="at-muted" style={{ fontSize: 12 }}>{userName(s.fermePar)}</div></> : <span className="badge-modern badge-modern-success">Ouverte</span>) },
        { label: "Fond", right: true, render: (s) => tnd(s.fondInitial) },
        { label: "Théorique", right: true, render: (s) => (s.totaux?.theorique !== undefined ? tnd(s.totaux.theorique) : "—") },
        { label: "Compté", right: true, render: (s) => (s.montantCompte !== null ? tnd(s.montantCompte) : "—") },
        { label: "Écart", right: true, render: (s) => (s.ecart !== null && s.ecart !== undefined ? <b style={{ color: s.ecart < 0 ? "#ef4444" : s.ecart > 0 ? "#f59e0b" : "#10b981" }}>{tnd(s.ecart)}</b> : "—") },
        { label: "", render: (s) => (
          <div className="at-actions">
            <IconBtn title="Détail" onClick={() => getSessionCaisse(s._id).then((r) => setVue(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }))}><FaEye /></IconBtn>
            {s.statut === "fermee" && <IconBtn title="Imprimer la clôture" onClick={() => imprimerZ(s)}><FaPrint /></IconBtn>}
            {s.statut === "fermee" && canReopen && !lectureSeule && (
              <IconBtn title="Rouvrir" onClick={async () => { const x = await askMotif("Motif de réouverture :"); if (x) run(() => rouvrirCaisse(s._id, x), "Caisse rouverte"); }}><FaUndo /></IconBtn>
            )}
          </div>
        ) },
      ]} />

      {/* ---------- Ouverture ---------- */}
      {ouverture && (
        <FormModal show title="Ouvrir la caisse" onClose={() => setOuverture(null)} busy={busy} submitLabel="Ouvrir"
          onSubmit={() => run(() => ouvrirCaisse({ fondInitial: Number(ouverture.fondInitial) || 0, observation: ouverture.observation }), "Caisse ouverte", () => setOuverture(null))}>
          <div className="row g-3">
            <Field label="Fond de caisse (espèces présentes)" hint={derniere ? `Laissé à la dernière fermeture : ${tnd(derniere.fondLaisse)}` : undefined}>
              <input type="number" min="0" step="0.001" className="form-control-modern" value={ouverture.fondInitial} onChange={(e) => setOuverture({ ...ouverture, fondInitial: e.target.value })} />
            </Field>
            <Field label="Observation"><input className="form-control-modern" value={ouverture.observation} onChange={(e) => setOuverture({ ...ouverture, observation: e.target.value })} /></Field>
          </div>
        </FormModal>
      )}

      {/* ---------- Entrée / sortie ---------- */}
      {mvt && courante && (
        <FormModal show title={mvt.type === "ENTREE" ? "Entrée d'espèces" : "Sortie d'espèces"} onClose={() => setMvt(null)} busy={busy}
          onSubmit={() => run(() => mouvementCaisse(courante._id, { ...mvt, montant: Number(mvt.montant) }), "Mouvement enregistré", () => setMvt(null))}>
          <div className="row g-3">
            <Field label="Catégorie" col="col-12 col-md-6">
              <select className="form-control-modern" value={mvt.categorie} onChange={(e) => setMvt({ ...mvt, categorie: e.target.value })}>
                {CATEGORIES_MOUVEMENT.filter(([v]) => (mvt.type === "ENTREE" ? ["apport", "autre"] : ["retrait_banque", "depense", "autre"]).includes(v))
                  .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Montant" col="col-12 col-md-6"><input type="number" min="0" step="0.001" required className="form-control-modern" value={mvt.montant} onChange={(e) => setMvt({ ...mvt, montant: e.target.value })} /></Field>
            <Field label="Motif"><input required className="form-control-modern" value={mvt.motif} onChange={(e) => setMvt({ ...mvt, motif: e.target.value })} /></Field>
          </div>
        </FormModal>
      )}

      {/* ---------- Fermeture ---------- */}
      {fermeture && courante && c && (
        <FormModal show size="lg" title={`Fermer la caisse ${courante.numero}`} onClose={() => setFermeture(null)} busy={busy} submitLabel="Fermer la caisse"
          onSubmit={() => run(() => fermerCaisse(courante._id, {
            comptage: fermeture.parDetail ? BILLETS.map((b) => ({ valeur: b, quantite: Number(fermeture.comptage[b]) || 0 })).filter((x) => x.quantite > 0) : [],
            montantCompte: fermeture.parDetail ? totalComptage : Number(fermeture.montantCompte),
            fondLaisse: Number(fermeture.fondLaisse) || 0, observation: fermeture.observation,
          }), "Caisse fermée", (r) => { setFermeture(null); imprimerZ(r.data.data); })}>
          <div className="form-check form-switch mb-3">
            <input id="detail" type="checkbox" role="switch" className="form-check-input" checked={fermeture.parDetail} onChange={(e) => setFermeture({ ...fermeture, parDetail: e.target.checked })} />
            <label htmlFor="detail" className="form-check-label" style={{ fontSize: 13.5 }}>Compter par billets et pièces</label>
          </div>
          {fermeture.parDetail ? (
            <div className="row g-2 mb-3">
              {BILLETS.map((b) => (
                <div key={b} className="col-6 col-md-4 d-flex align-items-center gap-2">
                  <span style={{ minWidth: 70 }}>{b >= 1 ? `${b} DT` : `${Math.round(b * 1000)} mill.`}</span>
                  <span>×</span>
                  <input type="number" min="0" step="1" className="form-control-modern" aria-label={`Nombre de ${b}`} value={fermeture.comptage[b] ?? ""}
                    onChange={(e) => setFermeture({ ...fermeture, comptage: { ...fermeture.comptage, [b]: e.target.value } })} />
                </div>
              ))}
            </div>
          ) : (
            <Field label="Montant compté"><input type="number" min="0" step="0.001" required className="form-control-modern mb-3" value={fermeture.montantCompte} onChange={(e) => setFermeture({ ...fermeture, montantCompte: e.target.value })} /></Field>
          )}
          <div className="d-flex justify-content-between"><span>Théorique</span><b>{tnd(c.theorique)}</b></div>
          <div className="d-flex justify-content-between"><span>Compté</span><b>{tnd(compteFermeture)}</b></div>
          <div className="d-flex justify-content-between at-total mb-3">
            <span>Écart</span>
            <span style={{ color: r3(compteFermeture - c.theorique) < 0 ? "#ef4444" : undefined }}>{tnd(r3(compteFermeture - c.theorique))}</span>
          </div>
          <div className="row g-3">
            <Field label="Fond laissé en caisse pour demain" col="col-12 col-md-6" hint={`Remise en banque : ${tnd(r3(compteFermeture - (Number(fermeture.fondLaisse) || 0)))}`}>
              <input type="number" min="0" step="0.001" className="form-control-modern" value={fermeture.fondLaisse} onChange={(e) => setFermeture({ ...fermeture, fondLaisse: e.target.value })} />
            </Field>
            <Field label="Observation (explication de l'écart…)" col="col-12 col-md-6">
              <input className="form-control-modern" value={fermeture.observation} onChange={(e) => setFermeture({ ...fermeture, observation: e.target.value })} />
            </Field>
          </div>
        </FormModal>
      )}

      {/* ---------- Détail d'une session ---------- */}
      {vue && (
        <FormModal show size="lg" title={`Caisse ${vue.numero}`} onClose={() => setVue(null)}>
          <div className="mb-2 at-muted">Ouverte le {heure(vue.ouvertureLe)}{vue.fermeLe ? ` · fermée le ${heure(vue.fermeLe)}` : " · en cours"}</div>
          {lignesCalcul(vue, vue.calcul || {}).map(([l, v]) => (
            <div key={l} className="d-flex justify-content-between"><span>{l}</span><b>{tnd(v)}</b></div>
          ))}
          <div className="d-flex justify-content-between at-total mt-2"><span>Théorique</span><span>{tnd(vue.calcul?.theorique)}</span></div>
          {vue.montantCompte !== null && (
            <>
              <div className="d-flex justify-content-between"><span>Compté</span><b>{tnd(vue.montantCompte)}</b></div>
              <div className="d-flex justify-content-between"><span>Écart</span><b>{tnd(vue.ecart)}</b></div>
              <div className="d-flex justify-content-between"><span>Remise en banque</span><b>{tnd(vue.remiseBanque)}</b></div>
            </>
          )}
          {vue.observationFermeture && <div className="at-muted mt-2">{vue.observationFermeture}</div>}
          <div className="at-card-title mt-3">Règlements en espèces</div>
          <Table rows={vue.reglements} empty="Aucun" cols={[
            { label: "N°", render: (r) => r.numero }, { label: "Date", render: (r) => heure(r.date) },
            { label: "Client", render: (r) => r.client?.nom || "—" },
            { label: "Montant", right: true, render: (r) => <span style={{ textDecoration: r.statut === "annule" ? "line-through" : undefined }}>{r.sens === "REMBOURSEMENT" ? "−" : ""}{tnd(r.montant)}</span> },
          ]} />
          <div className="at-card-title mt-3">Mouvements</div>
          <Table rows={vue.mouvements} empty="Aucun" cols={[
            { label: "Heure", render: (m) => heure(m.createdAt) }, { label: "Motif", render: (m) => `${m.type === "ENTREE" ? "Entrée" : "Sortie"} · ${m.motif}` },
            { label: "Montant", right: true, render: (m) => <span style={{ textDecoration: m.statut === "annule" ? "line-through" : undefined }}>{tnd(m.montant)}</span> },
          ]} />
          {(vue.rouvertures || []).length > 0 && <div className="at-muted mt-2">Réouvertures : {vue.rouvertures.map((x) => `${dateFr(x.date)} (${x.motif})`).join(" · ")}</div>}
        </FormModal>
      )}
    </Page>
  );
};

export default Caisse;
