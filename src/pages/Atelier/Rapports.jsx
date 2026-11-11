import { useEffect, useState } from "react";
import {
  FaFileExcel, FaPrint, FaChartPie, FaCashRegister, FaBoxOpen, FaChartLine, FaUsers, FaBuilding, FaBalanceScale,
  FaHourglassHalf, FaWallet, FaTable,
} from "react-icons/fa";
import { getDashboardAtelier, getRapport, downloadRapport } from "../../api/atelier";
import { Page, PageHeader, Card, Alert, Table, Kpi, PeriodeFilter } from "../../components/atelier/ui";
import { usePeriode, tnd, errMsg } from "../../utils/atelier";

const RAPPORTS = {
  "rentabilite-reparations": { label: "Rentabilité par réparation" },
  depenses: { label: "Dépenses", groupBy: { type: "Type", categorie: "Catégorie", fournisseur: "Fournisseur", mois: "Mois" } },
  achats: { label: "Achats et coûts moyens par article" },
  consommations: { label: "Consommations", groupBy: { article: "Article", reparateur: "Réparateur", jour: "Jour" } },
  reparateurs: { label: "Réparations terminées et CA par réparateur" },
  commissions: { label: "Commissions", groupBy: { jour: "Jour", mois: "Mois" } },
  soldes: { label: "Salaires, avances, paiements et soldes" },
};
const TOTAUX = { total: "Total", nombre: "Nombre", cout: "Coût", caHT: "CA HT", resultat: "Résultat", validees: "Validées", enAttente: "En attente", soldeDu: "Solde dû", gains: "Gains bruts" };
const MONEY_TOTALS = ["total", "cout", "caHT", "resultat", "validees", "enAttente", "soldeDu", "gains"];

const Rapports = () => {
  const [range, setRange] = usePeriode();
  const [dash, setDash] = useState(null);
  const [nom, setNom] = useState("rentabilite-reparations");
  const [groupBy, setGroupBy] = useState("");
  const [rapport, setRapport] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getDashboardAtelier(range).then((r) => setDash(r.data.data)).catch((e) => setMsg(errMsg(e)));
  }, [range]);

  useEffect(() => {
    const gb = RAPPORTS[nom].groupBy ? groupBy || Object.keys(RAPPORTS[nom].groupBy)[0] : undefined;
    getRapport(nom, { ...range, groupBy: gb }).then((r) => setRapport(r.data.data)).catch((e) => setMsg(errMsg(e)));
  }, [nom, groupBy, range]);

  const rent = dash?.rentabilite;
  const fmt = (c, v) => (c.money ? tnd(v) : v ?? "—");

  return (
    <Page>
      <PageHeader icon={<FaChartPie />} title="Tableau de bord atelier" subtitle="Coûts directs et charges générales distingués — aucune charge répartie artificiellement sur les dossiers">
        <button className="btn-modern btn-modern-outline" onClick={() => window.print()}><FaPrint /> Imprimer</button>
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange} />

      {rent && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaCashRegister />} tone="primary" label="CA HT" value={tnd(rent.caHT)} hint={`${rent.nbReparations} réparation(s) clôturée(s)`} /></div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaBoxOpen />} tone="danger" label="Coûts directs" value={tnd(rent.coutsDirects.total)} hint={`pièces ${tnd(rent.coutsDirects.pieces)}`} /></div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaChartLine />} tone="info" label="Marge brute" value={tnd(rent.margeBrute)} /></div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaUsers />} tone="warning" label="Rémunérations" value={tnd(rent.remunerations.total)} hint={`comm. ${tnd(rent.remunerations.commissions)} · sal. ${tnd(rent.remunerations.salaires)}`} /></div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaBuilding />} tone="gray" label="Charges générales" value={tnd(rent.chargesGenerales)} /></div>
          <div className="col-12 col-sm-6 col-xl-3">
            <Kpi icon={<FaBalanceScale />} tone={rent.resultatNet < 0 ? "danger" : "success"} label="Résultat net" value={tnd(rent.resultatNet)}
              valueColor={rent.resultatNet < 0 ? "var(--danger)" : "var(--success)"} />
          </div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaHourglassHalf />} tone="warning" label="Commissions à valider" value={tnd(dash.remunerations.commissionsEnAttente)} hint={`${dash.remunerations.nbCommissionsEnAttente} ligne(s)`} /></div>
          <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaWallet />} tone="primary" label="Solde dû aux réparateurs" value={tnd(dash.remunerations.soldeDuTotal)} /></div>
        </div>
      )}

      <Card title="Rapports détaillés" icon={<FaTable />} style={{ marginBottom: 16 }}>
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div style={{ minWidth: 280 }}>
            <label className="form-label">Rapport</label>
            <select className="form-control-modern" value={nom} onChange={(e) => { setNom(e.target.value); setGroupBy(""); }}>
              {Object.entries(RAPPORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {RAPPORTS[nom].groupBy && (
            <div style={{ minWidth: 180 }}>
              <label className="form-label">Regrouper par</label>
              <select className="form-control-modern" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                {Object.entries(RAPPORTS[nom].groupBy).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
          )}
          <button className="btn-modern btn-modern-success" onClick={() => downloadRapport(nom, { ...range, groupBy: groupBy || undefined }).catch((e) => setMsg(errMsg(e)))}>
            <FaFileExcel /> Export Excel
          </button>
        </div>
      </Card>

      {rapport && (
        <>
          <Table rows={rapport.lignes} cols={rapport.colonnes.map((c) => ({ label: c.label, right: c.money, render: (r) => fmt(c, r[c.key]) }))} />
          {rapport.totaux && (
            <div className="d-flex justify-content-end flex-wrap gap-2 mt-3">
              {Object.entries(rapport.totaux).map(([k, v]) => (
                <span key={k} className="at-chip"><b>{TOTAUX[k] || k}</b> {MONEY_TOTALS.includes(k) ? tnd(v) : v}</span>
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
};

export default Rapports;
