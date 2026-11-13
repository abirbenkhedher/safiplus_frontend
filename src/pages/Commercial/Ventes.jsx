import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FaFileInvoiceDollar, FaPlus, FaTools, FaEye, FaCheckCircle, FaUndo, FaMoneyBillWave, FaExclamationTriangle } from "react-icons/fa";
import { getDocuments, getParametresVente, getSynthese, TYPES_DOC } from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import { Page, PageHeader, Alert, Table, PeriodeFilter, IconBtn, Kpi, Tabs } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg } from "../../utils/atelier";
import { StatutDoc, PaiementBadge } from "../../components/commercial/commun";

import DocumentEditor from "../../components/commercial/DocumentEditor";
import DocumentView from "../../components/commercial/DocumentView";
import FacturerModal from "../../components/commercial/FacturerModal";

// ============================================================
// ✅ Gestion commerciale : devis, bons de livraison, factures, avoirs
// ============================================================
const ONGLETS = [["FACTURE", "Factures"], ["DEVIS", "Devis"], ["BL", "Bons de livraison"], ["TICKET", "Tickets comptoir"], ["AVOIR", "Avoirs"]];
const STATUTS = {
  FACTURE: [["brouillon", "Brouillon"], ["valide", "Validée"]],
  AVOIR: [["brouillon", "Brouillon"], ["valide", "Validé"]],
  TICKET: [["valide", "Validé"]],
  DEVIS: [["brouillon", "Brouillon"], ["valide", "Validé"], ["accepte", "Accepté"], ["refuse", "Refusé"], ["transforme", "Transformé"], ["annule", "Annulé"]],
  BL: [["brouillon", "Brouillon"], ["valide", "Validé"], ["transforme", "Facturé"], ["annule", "Annulé"]],
};

const Ventes = () => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("ventes");
  const [sp, setSp] = useSearchParams();
  const [type, setTypeRaw] = useState(ONGLETS.some(([k]) => k === sp.get("type")) ? sp.get("type") : "FACTURE");
  const setType = (t) => { setTypeRaw(t); setStatut(""); setPaiement(""); setSp(t === "FACTURE" ? {} : { type: t }, { replace: true }); };
  const [range, setRange] = usePeriode();
  const [statut, setStatut] = useState("");
  const [paiement, setPaiement] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [synthese, setSynthese] = useState(null);
  const [params, setParams] = useState(null);
  const [msg, setMsg] = useState(null);
  const [edit, setEditRaw] = useState(null);
  const [viewId, setViewId] = useState(() => sp.get("doc")); // lien direct depuis un dossier de réparation
  const [facturer, setFacturer] = useState(false);
  // ✅ Vue globale = consultation
  const setEdit = (v) => { if (v && blockInGlobalView()) return; setEditRaw(v); };

  const load = () => {
    getDocuments({ type, statut: statut || undefined, paiement: paiement || undefined, from: range.from, to: range.to, search: search.trim() || undefined })
      .then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
    getSynthese({ from: range.from, to: range.to }).then((r) => setSynthese(r.data.data)).catch(() => setSynthese(null));
  };
  useEffect(() => { load(); }, [type, statut, paiement, range]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [search]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getParametresVente().then((r) => setParams(r.data.data)).catch(() => {}); }, []);

  const ouvrirApresEnregistrement = (d) => { setEditRaw(null); setMsg({ type: "success", text: "Brouillon enregistré" }); load(); setViewId(d._id); };
  const label = TYPES_DOC[type];

  const cols = [
    { label: "N°", render: (r) => <b>{r.numero || <span className="at-muted">brouillon</span>}</b> },
    { label: "Date", render: (r) => dateFr(r.date) },
    { label: "Client", render: (r) => r.clientSnapshot?.nom || r.client?.nom || "—" },
    { label: "Total HT", right: true, render: (r) => tnd(r.totalHT) },
    { label: type === "AVOIR" ? "Total avoir" : "Net à payer", right: true, render: (r) => <b>{tnd(r.netAPayer)}</b> },
  ];
  if (type === "FACTURE" || type === "TICKET") {
    cols.push({ label: "Reste", right: true, render: (r) => (r.paiement ? <span style={{ color: r.paiement.reste > 0 ? "#ef4444" : undefined }}>{tnd(r.paiement.reste)}</span> : "—") });
  }
  cols.push(
    { label: "Statut", render: (r) => <div className="d-flex gap-1 flex-wrap"><StatutDoc statut={r.statut} type={r.type} /><PaiementBadge paiement={r.paiement} /></div> },
    { label: "", render: (r) => <div className="at-actions"><IconBtn title="Ouvrir" onClick={() => setViewId(r._id)}><FaEye /></IconBtn></div> },
  );

  return (
    <Page>
      <PageHeader icon={<FaFileInvoiceDollar />} title="Devis & factures" subtitle="Devis, bons de livraison, factures et avoirs de la boutique">
        {canWrite && (
          <>
            <button className="btn-modern btn-modern-outline" onClick={() => { if (!blockInGlobalView()) setFacturer(true); }}><FaTools /> Facturer des réparations</button>
            {type === "TICKET" && (
              <Link className="btn-modern btn-modern-primary" to="/comptoir"><FaPlus /> Vente comptoir</Link>
            )}
            {!["AVOIR", "TICKET"].includes(type) && (
              <button className="btn-modern btn-modern-primary" onClick={() => setEdit({ type, lignes: [] })}><FaPlus /> {type === "FACTURE" ? "Nouvelle facture" : `Nouveau ${label.label.toLowerCase()}`}</button>
            )}
          </>
        )}
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />

      {synthese && (
        <div className="row g-3 mb-3">
          <div className="col-6 col-lg-3"><Kpi icon={<FaCheckCircle />} tone="primary" label="Facturé TTC (période)" value={tnd(synthese.factures.ttc)} hint={`${synthese.factures.nombre} facture(s) · comptoir ${tnd(synthese.tickets?.ttc || 0)}`} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaUndo />} tone="warning" label="Avoirs (période)" value={tnd(synthese.avoirs.ttc)} hint={`CA net HT ${tnd(synthese.caNetHT)}`} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="success" label="Encaissé (période)" value={tnd(synthese.encaissements.net)} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaExclamationTriangle />} tone="danger" label="Créances clients (total)" value={tnd(synthese.creancesClients)} /></div>
        </div>
      )}

      <Tabs tabs={ONGLETS} value={type} onChange={setType} />
      <PeriodeFilter range={range} onChange={setRange}>
        <div>
          <label className="form-label">Statut</label>
          <select className="form-control-modern" value={statut} onChange={(e) => setStatut(e.target.value)}>
            <option value="">Tous</option>
            {STATUTS[type].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {type === "FACTURE" && (
          <div>
            <label className="form-label">Paiement</label>
            <select className="form-control-modern" value={paiement} onChange={(e) => setPaiement(e.target.value)}>
              <option value="">Tous</option><option value="impaye">À encaisser</option>
              <option value="non_paye">Non payées</option><option value="partiel">Partiellement payées</option><option value="paye">Payées</option>
            </select>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 180 }}>
          <label className="form-label">Recherche</label>
          <input className="form-control-modern" placeholder="N°, client, désignation…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </PeriodeFilter>
      {type === "AVOIR" && <div className="at-hint mb-2" style={{ fontStyle: "normal" }}>Un avoir se crée depuis une facture validée (bouton « Faire un avoir » dans la facture).</div>}

      <Table rows={rows} cols={cols} empty={`Aucun(e) ${label.label.toLowerCase()} sur cette période`} />

      {edit && (
        <DocumentEditor
          key={edit._id || "nouveau"}
          doc={edit}
          params={params}
          onClose={() => setEditRaw(null)}
          onSaved={ouvrirApresEnregistrement}
        />
      )}
      {viewId && (
        <DocumentView
          key={viewId}
          id={viewId}
          params={params}
          onClose={() => { setViewId(null); load(); }}
          onChanged={load}
          onOpen={(id) => setViewId(id)}
          onEdit={(d) => { setViewId(null); setEdit(d); }}
        />
      )}
      {facturer && (
        <FacturerModal
          onClose={() => setFacturer(false)}
          onCreated={(d) => { setFacturer(false); load(); setEdit(d); }}
        />
      )}
    </Page>
  );
};

export default Ventes;
