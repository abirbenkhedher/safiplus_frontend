import { useEffect, useState } from "react";
import { FaChartBar, FaFileExcel, FaFileInvoiceDollar, FaPercent, FaMoneyBillWave, FaBoxOpen, FaExclamationTriangle, FaCashRegister } from "react-icons/fa";
import { getRapportCommercial, telechargerRapportCommercial } from "../../api/caisse";
import { modeLabel } from "../../api/ventes";
import { Page, PageHeader, Alert, Card, Table, Kpi, PeriodeFilter } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg } from "../../utils/atelier";

// ============================================================
// ✅ Rapport commercial : CA, TVA, encaissements, marge, créances, caisse
// ============================================================
const RapportCommercial = () => {
  const [range, setRange] = usePeriode();
  const [r, setR] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRapportCommercial({ from: range.from, to: range.to }).then((x) => setR(x.data.data)).catch((e) => setMsg(errMsg(e)));
  }, [range]);

  const exporter = async () => {
    setBusy(true);
    try { await telechargerRapportCommercial({ from: range.from, to: range.to }); } catch (e) { setMsg(errMsg(e)); }
    setBusy(false);
  };
  const maxJour = r ? Math.max(1, ...r.parJour.map((j) => Math.abs(j.ttc))) : 1;

  return (
    <Page>
      <PageHeader icon={<FaChartBar />} title="Statistiques commerciales" subtitle="Chiffre d'affaires, TVA, encaissements, marge et créances de la période">
        <button className="btn-modern btn-modern-primary" onClick={exporter} disabled={busy}><FaFileExcel /> {busy ? "Export…" : "Exporter en Excel"}</button>
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange} />

      {r && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi icon={<FaFileInvoiceDollar />} tone="primary" label="CA net HT" value={tnd(r.ca.netHT)} hint={`TTC ${tnd(r.ca.netTTC)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaPercent />} tone="warning" label="TVA nette à payer" value={tnd(r.tva.nette)} hint={`Collectée ${tnd(r.tva.collectee)} − déductible ${tnd(r.tva.deductible)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="success" label="Encaissé (net)" value={tnd(r.encaissements.net)} hint={Object.entries(r.encaissements.parMode || {}).map(([m, v]) => `${modeLabel(m)} ${tnd(v)}`).join(" · ") || "—"} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaBoxOpen />} tone="info" label="Marge sur articles" value={tnd(r.articles.marge)} hint={`Ventes HT ${tnd(r.articles.venteHT)} · coût ${tnd(r.articles.cout)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaExclamationTriangle />} tone="danger" label="Créances clients (total)" value={tnd(r.creances.total)} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaCashRegister />} tone={r.caisse.totalEcarts < 0 ? "danger" : "gray"} label="Écarts de caisse" value={tnd(r.caisse.totalEcarts)} hint={`${r.caisse.sessions.length} fermeture(s)`} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="gray" label="Timbres fiscaux" value={tnd(r.ca.timbres)} /></div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-6">
              <Card title="Chiffre d'affaires">
                <Table rows={[
                  { k: "Factures", ...r.ca.factures, s: 1 }, { k: "Tickets comptoir", ...r.ca.tickets, s: 1 }, { k: "Avoirs", ...r.ca.avoirs, s: -1 },
                ]} rowKey={(x) => x.k} cols={[
                  { label: "", render: (x) => <b>{x.k}</b> },
                  { label: "Nombre", right: true, render: (x) => x.nombre },
                  { label: "HT", right: true, render: (x) => tnd(x.s * x.ht) },
                  { label: "TVA", right: true, render: (x) => tnd(x.s * x.tva) },
                  { label: "TTC", right: true, render: (x) => tnd(x.s * x.ttc) },
                ]} />
              </Card>
            </div>
            <div className="col-12 col-lg-6">
              <Card title="TVA par taux">
                <Table rows={r.tva.parTaux} rowKey={(t) => t.taux} empty="Aucune TVA sur la période" cols={[
                  { label: "Taux", render: (t) => `${t.taux} %` },
                  { label: "Collectée", right: true, render: (t) => tnd(t.collectee) },
                  { label: "Déductible", right: true, render: (t) => tnd(t.deductible) },
                  { label: "Nette", right: true, render: (t) => <b>{tnd(t.nette)}</b> },
                ]} />
                <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
                  Déductible = factures d'achat validées ({r.tva.achats.nombre}, HT {tnd(r.tva.achats.ht)}). À rapprocher avec votre comptable.
                </div>
              </Card>
            </div>
          </div>

          <Card title="Ventes et encaissements par jour" className="mb-3">
            {r.parJour.length === 0 && <div className="at-muted">Aucune activité.</div>}
            {r.parJour.map((j) => (
              <div key={j.jour} className="d-flex align-items-center gap-2 mb-1" style={{ fontSize: 13 }}>
                <span style={{ width: 86 }}>{dateFr(j.jour)}</span>
                <div style={{ flex: 1, background: "var(--at-head-bg, #f1f5f9)", borderRadius: 4, height: 14 }}>
                  <div style={{ width: `${Math.round((Math.abs(j.ttc) / maxJour) * 100)}%`, height: "100%", borderRadius: 4, background: j.ttc < 0 ? "#ef4444" : "#4361ee" }} />
                </div>
                <span className="at-num" style={{ width: 120, textAlign: "right" }}>{tnd(j.ttc)}</span>
                <span className="at-num at-muted" style={{ width: 140, textAlign: "right" }}>encaissé {tnd(j.encaisse)}</span>
              </div>
            ))}
          </Card>

          <div className="row g-3">
            <div className="col-12 col-lg-7">
              <div className="at-card-title">Meilleures ventes (articles)</div>
              <Table rows={r.articles.top} rowKey={(a, i) => `${a.code}-${i}`} empty="Aucun article vendu" cols={[
                { label: "Article", render: (a) => <>{a.designation}{a.code ? <span className="at-muted"> · {a.code}</span> : null}</> },
                { label: "Qté", right: true, render: (a) => a.quantite },
                { label: "Vente HT", right: true, render: (a) => tnd(a.ht) },
                { label: "Marge", right: true, render: (a) => <b>{tnd(a.marge)}</b> },
              ]} />
            </div>
            <div className="col-12 col-lg-5">
              <div className="at-card-title">Clients qui doivent le plus</div>
              <Table rows={r.creances.clients} rowKey={(c, i) => `${c.nom}-${i}`} empty="Aucune créance" cols={[
                { label: "Client", render: (c) => <>{c.nom}<div className="at-muted" style={{ fontSize: 12 }}>{c.phone}</div></> },
                { label: "Factures", right: true, render: (c) => c.nbImpayees },
                { label: "Solde", right: true, render: (c) => <b style={{ color: "#ef4444" }}>{tnd(c.solde)}</b> },
              ]} />
            </div>
          </div>
        </>
      )}
    </Page>
  );
};

export default RapportCommercial;
