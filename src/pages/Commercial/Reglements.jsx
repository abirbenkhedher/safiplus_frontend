import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaHandHoldingUsd, FaPlus, FaBan, FaUndoAlt, FaPrint, FaCheck, FaTimes, FaEye, FaLink } from "react-icons/fa";
import {
  getJournal, getCreances, getReleve, getReglements, annulerReglement, etatCheque, affecterReglement, modeLabel, MODES_REGLEMENT,
  getParametresVente,
} from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import { Page, PageHeader, Alert, Table, PeriodeFilter, IconBtn, Kpi, Tabs, Card } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg, askMotif } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
import { ClientPicker } from "../../components/commercial/commun";
import { clientLabel } from "../../components/commercial/calculs";
import ReglementModal from "../../components/commercial/ReglementModal";
import DocumentView from "../../components/commercial/DocumentView";

// ============================================================
// ✅ Règlements clients : journal, chèques, créances, relevé
// ============================================================
const ONGLETS = [["journal", "Encaissements"], ["cheques", "Chèques en portefeuille"], ["creances", "Créances clients"], ["releve", "Relevé client"]];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const imprimerReleve = (r) => {
  const m3 = (v) => Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const lignes = r.ecritures.map((e) => `<tr><td>${dateFr(e.date)}</td><td>${esc(e.libelle)}</td><td class="r">${e.debit ? m3(e.debit) : ""}</td><td class="r">${e.credit ? m3(e.credit) : ""}</td><td class="r">${m3(e.solde)}</td></tr>`).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"/><title>Relevé ${esc(r.client.nom)}</title>
<style>@page{size:A4;margin:14mm}body{font-family:Arial,sans-serif;font-size:11.5px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:5px}th{background:#f1f1f1;text-align:left}.r{text-align:right;white-space:nowrap}</style></head><body>
<h2>Relevé de compte client</h2><p><b>${esc(r.client.nom)}</b> (${esc(r.client.code || "")}) · ${esc(r.client.phone || "")}${r.client.matriculeFiscal ? ` · MF ${esc(r.client.matriculeFiscal)}` : ""}<br/>Édité le ${new Date().toLocaleDateString("fr-FR")}</p>
<table><thead><tr><th>Date</th><th>Libellé</th><th class="r">Débit</th><th class="r">Crédit</th><th class="r">Solde</th></tr></thead><tbody>${lignes}</tbody></table>
<p style="font-size:14px"><b>Solde : ${m3(r.solde.solde)} TND</b> ${r.solde.solde > 0 ? "(à payer par le client)" : r.solde.solde < 0 ? "(crédit en faveur du client)" : ""}</p>
${r.totalNonFacture > 0 ? `<p>Réparations non facturées restant dues : ${m3(r.totalNonFacture)} TND</p>` : ""}
<script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
};

const Reglements = () => {
  const { hasPermission } = useAuth();
  const canPay = hasPermission("reglements");
  const canCancel = hasPermission("operations_annuler");
  const [sp, setSp] = useSearchParams();
  const [tab, setTab] = useState(ONGLETS.some(([k]) => k === sp.get("tab")) ? sp.get("tab") : "journal");
  const [range, setRange] = usePeriode();
  const [mode, setMode] = useState("");
  const [journal, setJournal] = useState(null);
  const [cheques, setCheques] = useState([]);
  const [creances, setCreances] = useState([]);
  const [client, setClient] = useState(sp.get("client") ? { id: sp.get("client"), label: "" } : null);
  const [releve, setReleve] = useState(null);
  const [msg, setMsg] = useState(null);
  const [nouveau, setNouveau] = useState(null); // { remboursement, client }
  const [viewId, setViewId] = useState(null);
  const [params, setParams] = useState(null);

  const loadJournal = () => getJournal({ from: range.from, to: range.to }).then((r) => setJournal(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  const loadCheques = () => getReglements({ mode: "CHEQUE", statut: "valide", etatCheque: "en_portefeuille" }).then((r) => setCheques(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  const loadCreances = () => getCreances().then((r) => setCreances(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  const loadReleve = () => {
    if (!client?.id) return;
    getReleve(client.id).then((r) => { setReleve(r.data.data); if (!client.label) setClient((c) => ({ ...c, label: clientLabel(r.data.data.client) })); }).catch((e) => setMsg({ text: errMsg(e) }));
  };
  const reload = () => { if (tab === "journal") loadJournal(); if (tab === "cheques") loadCheques(); if (tab === "creances") loadCreances(); if (tab === "releve") loadReleve(); };

  useEffect(() => { reload(); }, [tab, range, client?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getParametresVente().then((r) => setParams(r.data.data)).catch(() => {}); }, []);
  const changeTab = (t) => { setTab(t); setSp(t === "journal" ? {} : { tab: t, ...(t === "releve" && client?.id ? { client: client.id } : {}) }, { replace: true }); };
  const voirReleve = (id, label) => { setReleve(null); setClient({ id, label }); setTab("releve"); setSp({ tab: "releve", client: id }, { replace: true }); };

  const act = async (fn, ok) => { try { await fn(); setMsg({ type: "success", text: ok }); reload(); } catch (e) { setMsg({ text: errMsg(e) }); } };
  const annuler = async (r) => { const m = await askMotif("Motif d'annulation du règlement :"); if (m) act(() => annulerReglement(r._id, m), "Règlement annulé (montants remis à payer)"); };
  const ouvrirNouveau = (opts) => { if (!blockInGlobalView()) setNouveau(opts); };

  const regs = (journal?.reglements || []).filter((r) => !mode || r.mode === mode);
  const actionsReglement = (r) => (
    <div className="at-actions">
      {r.statut === "valide" && canPay && r.sens === "ENCAISSEMENT" && r.montant - (r.montantAffecte || 0) > 0.0005 && (
        <IconBtn title="Affecter l'avance aux factures impayées" onClick={() => act(() => affecterReglement(r._id, {}), "Avance affectée aux factures impayées")}><FaLink /></IconBtn>
      )}
      {r.statut === "valide" && canCancel && <IconBtn title="Annuler (contre-écriture)" tone="danger" onClick={() => annuler(r)}><FaBan /></IconBtn>}
    </div>
  );

  return (
    <Page>
      <PageHeader icon={<FaHandHoldingUsd />} title="Règlements & créances" subtitle="Encaissements clients, chèques, soldes et relevés">
        {canPay && (
          <>
            <button className="btn-modern btn-modern-outline" onClick={() => ouvrirNouveau({ remboursement: true, client: tab === "releve" ? client : null })}><FaUndoAlt /> Remboursement</button>
            <button className="btn-modern btn-modern-primary" onClick={() => ouvrirNouveau({ remboursement: false, client: tab === "releve" ? client : null })}><FaPlus /> Encaissement</button>
          </>
        )}
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      <Tabs tabs={ONGLETS} value={tab} onChange={changeTab} />

      {tab === "journal" && (
        <>
          <PeriodeFilter range={range} onChange={setRange}>
            <div>
              <label className="form-label">Mode</label>
              <select className="form-control-modern" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="">Tous</option>
                {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </PeriodeFilter>
          {journal && (
            <div className="row g-3 mb-3">
              <div className="col-6 col-lg-3"><Kpi tone="success" label="Encaissé" value={tnd(journal.totaux.encaisse)} /></div>
              <div className="col-6 col-lg-3"><Kpi tone="warning" label="Remboursé" value={tnd(journal.totaux.rembourse)} /></div>
              <div className="col-12 col-lg-6"><Kpi tone="primary" label="Net par mode" value={tnd(journal.totaux.net)}
                hint={Object.entries(journal.totaux.parMode).map(([m, v]) => `${modeLabel(m)} ${tnd(v)}`).join(" · ") || "—"} /></div>
            </div>
          )}
          <Table rows={regs} empty="Aucun règlement sur cette période" cols={[
            { label: "N°", render: (r) => <b>{r.numero}</b> },
            { label: "Date", render: (r) => dateFr(r.date) },
            { label: "Client", render: (r) => <button type="button" className="at-link" onClick={() => voirReleve(r.client?._id, clientLabel(r.client))}>{r.client?.nom}</button> },
            { label: "Mode", render: (r) => `${modeLabel(r.mode)}${r.reference ? ` · ${r.reference}` : ""}` },
            { label: "Factures", render: (r) => (r.affectations || []).map((a) => a.document?.numero).filter(Boolean).join(", ") || (r.sens === "REMBOURSEMENT" ? "Remboursement" : "Avance") },
            { label: "Montant", right: true, render: (r) => <b style={{ color: r.sens === "REMBOURSEMENT" ? "#f59e0b" : undefined }}>{r.sens === "REMBOURSEMENT" ? "−" : ""}{tnd(r.montant)}</b> },
            { label: "Non affecté", right: true, render: (r) => (r.sens === "ENCAISSEMENT" && r.montant - (r.montantAffecte || 0) > 0.0005 ? tnd(r.montant - r.montantAffecte) : "—") },
            { label: "Statut", render: (r) => (r.statut === "annule" ? <span className="badge-modern badge-modern-danger" title={r.motifAnnulation}>Annulé</span> : <span className="badge-modern badge-modern-success">Valide</span>) },
            { label: "", render: actionsReglement },
          ]} />
        </>
      )}

      {tab === "cheques" && (
        <Table rows={cheques} empty="Aucun chèque en portefeuille" cols={[
          { label: "N°", render: (r) => <b>{r.numero}</b> },
          { label: "Reçu le", render: (r) => dateFr(r.date) },
          { label: "Échéance", render: (r) => dateFr(r.dateEcheance) },
          { label: "Client", render: (r) => r.client?.nom },
          { label: "Chèque", render: (r) => [r.reference, r.banque].filter(Boolean).join(" · ") || "—" },
          { label: "Montant", right: true, render: (r) => <b>{tnd(r.montant)}</b> },
          {
            label: "", render: (r) => canPay && (
              <div className="at-actions">
                <IconBtn title="Encaissé (banque)" tone="success" onClick={() => act(() => etatCheque(r._id, "encaisse"), "Chèque encaissé")}><FaCheck /></IconBtn>
                <IconBtn title="Impayé (rejeté)" tone="danger" onClick={async () => {
                  if (await confirmer({ title: "Chèque impayé", message: `Le règlement ${r.numero} sera annulé et les factures redeviendront à payer.`, confirmText: "Confirmer" })) {
                    act(() => etatCheque(r._id, "impaye"), "Chèque impayé : règlement annulé");
                  }
                }}><FaTimes /></IconBtn>
              </div>
            ),
          },
        ]} />
      )}

      {tab === "creances" && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi tone="danger" label="Total dû par les clients" value={tnd(creances.filter((c) => c.solde > 0).reduce((s, c) => s + c.solde, 0))} hint={`${creances.filter((c) => c.solde > 0).length} client(s)`} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="success" label="Crédits / avances clients" value={tnd(-creances.filter((c) => c.solde < 0).reduce((s, c) => s + c.solde, 0))} /></div>
          </div>
          <Table rows={creances} rowKey={(r) => r.client} empty="Aucun solde client ouvert" cols={[
            { label: "Client", render: (c) => <b>{c.clientInfo?.nom || "—"}</b> },
            { label: "Téléphone", render: (c) => c.clientInfo?.phone || "—" },
            { label: "Facturé", right: true, render: (c) => tnd(c.totalFacture) },
            { label: "Réglé", right: true, render: (c) => tnd(c.totalRegle) },
            { label: "Avances", right: true, render: (c) => tnd(c.avance) },
            { label: "Solde", right: true, render: (c) => <b style={{ color: c.solde > 0 ? "#ef4444" : "#10b981" }}>{tnd(c.solde)}</b> },
            { label: "Factures impayées", right: true, render: (c) => (c.nbImpayees ? `${c.nbImpayees} (depuis ${dateFr(c.plusAncienne)})` : "—") },
            { label: "", render: (c) => <div className="at-actions"><IconBtn title="Relevé" onClick={() => voirReleve(c.client, clientLabel(c.clientInfo))}><FaEye /></IconBtn></div> },
          ]} />
        </>
      )}

      {tab === "releve" && (
        <>
          <Card className="mb-3">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-7">
                <label className="form-label">Client</label>
                <ClientPicker value={client?.id} label={client?.label} onChange={(id, label) => { setReleve(null); setClient(id ? { id, label } : null); setSp(id ? { tab: "releve", client: id } : { tab: "releve" }, { replace: true }); }} />
              </div>
              {releve && (
                <div className="col-12 col-md-5 d-flex gap-2 justify-content-md-end flex-wrap">
                  <button type="button" className="btn-modern btn-modern-outline" onClick={() => imprimerReleve(releve)}><FaPrint /> Imprimer le relevé</button>
                </div>
              )}
            </div>
          </Card>
          {releve && (
            <>
              <div className="row g-3 mb-3">
                <div className="col-6 col-lg-3"><Kpi tone={releve.solde.solde > 0 ? "danger" : "success"} label="Solde" value={tnd(releve.solde.solde)} hint={releve.solde.solde > 0 ? "À payer par le client" : releve.solde.solde < 0 ? "Crédit du client" : "Soldé"} /></div>
                <div className="col-6 col-lg-3"><Kpi tone="primary" label="Facturé (net d'avoirs)" value={tnd(releve.solde.totalFacture)} /></div>
                <div className="col-6 col-lg-3"><Kpi tone="success" label="Réglé sur factures" value={tnd(releve.solde.totalRegle)} /></div>
                <div className="col-6 col-lg-3"><Kpi tone="warning" label="Réparations non facturées (reste)" value={tnd(releve.totalNonFacture)} /></div>
              </div>
              <div className="at-card-title">Écritures</div>
              <Table rows={releve.ecritures} rowKey={(e, i) => `${e.ref}-${i}`} empty="Aucune écriture" cols={[
                { label: "Date", render: (e) => dateFr(e.date) },
                { label: "Libellé", key: "libelle" },
                { label: "Débit", right: true, render: (e) => (e.debit ? tnd(e.debit) : "") },
                { label: "Crédit", right: true, render: (e) => (e.credit ? tnd(e.credit) : "") },
                { label: "Solde", right: true, render: (e) => <b>{tnd(e.solde)}</b> },
              ]} />
              <div className="at-card-title mt-4">Factures</div>
              <Table rows={releve.factures} empty="Aucune facture" cols={[
                { label: "N°", render: (f) => <button type="button" className="at-link" onClick={() => setViewId(f._id)}>{f.numero}</button> },
                { label: "Date", render: (f) => dateFr(f.date) },
                { label: "Net à payer", right: true, render: (f) => tnd(f.netAPayer) },
                { label: "Dû (après avoirs)", right: true, render: (f) => tnd(f.du) },
                { label: "Réglé", right: true, render: (f) => tnd(f.regle) },
                { label: "Reste", right: true, render: (f) => <b style={{ color: f.reste > 0 ? "#ef4444" : undefined }}>{tnd(f.reste)}</b> },
              ]} />
              {releve.reparationsNonFacturees.length > 0 && (
                <>
                  <div className="at-card-title mt-4">Réparations non facturées avec reste à payer</div>
                  <Table rows={releve.reparationsNonFacturees} cols={[
                    { label: "Dossier", render: (r) => <b>{r.numero}</b> },
                    { label: "Date", render: (r) => dateFr(r.date) },
                    { label: "Prix", right: true, render: (r) => tnd(r.prixTotal) },
                    { label: "Acompte", right: true, render: (r) => tnd(r.acompte) },
                    { label: "Reste", right: true, render: (r) => <b>{tnd(r.reste)}</b> },
                  ]} />
                </>
              )}
            </>
          )}
        </>
      )}

      {nouveau && (
        <ReglementModal
          client={nouveau.client?.id ? nouveau.client : null}
          remboursement={nouveau.remboursement}
          onClose={() => setNouveau(null)}
          onSaved={(r) => { setNouveau(null); setMsg({ type: "success", text: `${r.sens === "REMBOURSEMENT" ? "Remboursement" : "Règlement"} ${r.numero} enregistré` }); reload(); }}
        />
      )}
      {viewId && (
        <DocumentView key={viewId} id={viewId} params={params} onClose={() => { setViewId(null); reload(); }} onChanged={reload} onOpen={setViewId}
          onEdit={() => setMsg({ type: "info", text: "Ouvrez « Devis & factures » pour modifier un brouillon." })} />
      )}
    </Page>
  );
};

export default Reglements;
