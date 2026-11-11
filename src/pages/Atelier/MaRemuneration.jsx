import { useEffect, useState } from "react";
import { FaWallet, FaCheckCircle, FaHourglassHalf, FaCoins, FaMoneyBillWave } from "react-icons/fa";
import { getMaRemuneration } from "../../api/atelier";
import { Page, PageHeader, Alert, Table, Kpi, PeriodeFilter, StatutBadge } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg } from "../../utils/atelier";

const MODES = { salaire: "Salaire fixe", commission: "Commission", mixte: "Mixte (salaire + commission)" };
const CALC = { pourcentage: "Pourcentage", fixe_unite: "Fixe / unité", forfait_intervention: "Forfait intervention", palier: "Barème" };

/** Espace personnel : chaque réparateur consulte ses gains, commissions et solde. */
const MaRemuneration = () => {
  const [range, setRange] = usePeriode();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => { getMaRemuneration(range).then((r) => setData(r.data.data)).catch((e) => setMsg(errMsg(e))); }, [range]);
  const p = data?.solde?.periode;
  const c = data?.solde?.cumul;
  const contrat = data?.contrat;

  return (
    <Page>
      <PageHeader
        icon={<FaWallet />}
        title="Ma rémunération"
        subtitle={contrat ? `Contrat : ${MODES[contrat.mode]}${contrat.mode !== "commission" ? ` — ${tnd(contrat.salaire)} / ${contrat.periodicite}` : ""}` : "Aucun contrat enregistré"}
      />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange} />
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaCheckCircle />} tone="success" label="Commissions validées" value={tnd(p?.commissionsValidees || 0)} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaHourglassHalf />} tone="warning" label="En attente de validation" value={tnd(p?.commissionsEnAttente || 0)} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaCoins />} tone="primary" label="Gains bruts (période)" value={tnd(p?.gainsBruts || 0)} hint={`dont salaires ${tnd(p?.salaires || 0)}`} /></div>
        <div className="col-12 col-sm-6 col-xl-3"><Kpi icon={<FaMoneyBillWave />} tone="danger" label="Solde restant dû" value={tnd(c?.soldeDu || 0)} hint={`avances ${tnd(c?.avances || 0)} · payé ${tnd(c?.paiements || 0)}`} /></div>
      </div>
      <Table
        rows={data?.commissions || []}
        empty="Aucune commission sur cette période"
        cols={[
          { label: "Date", render: (r) => dateFr(r.dateSource) },
          { label: "Dossier", render: (r) => (r.reparation?.numero ? <b>{r.reparation.numero}</b> : "Déclaration") },
          { label: "Calcul", render: (r) => `${CALC[r.regleSnapshot?.typeCalcul] || "—"}${r.regleSnapshot?.typeCalcul === "pourcentage" ? ` ${r.regleSnapshot.taux} %` : ""}` },
          { label: "Montant", right: true, render: (r) => <b style={{ color: r.montant < 0 ? "var(--danger)" : undefined }}>{tnd(r.montant)}</b> },
          { label: "Statut", render: (r) => <StatutBadge statut={r.statut} /> },
        ]}
      />
    </Page>
  );
};

export default MaRemuneration;
