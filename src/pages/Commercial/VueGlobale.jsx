import { useEffect, useState } from "react";
import { FaGlobe, FaTools, FaCashRegister, FaCoins, FaMoneyBillWave } from "react-icons/fa";
import { getVueGlobale } from "../../api/caisse";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, Alert, Table, Kpi, PeriodeFilter, Card } from "../../components/atelier/ui";
import { usePeriode, tnd, errMsg } from "../../utils/atelier";

// ============================================================
// ✅ Vue globale : atelier + commerce, sans double comptage
// ============================================================
const Barre = ({ part, total, couleur }) => (
  <div style={{ background: "var(--at-head-bg, #f1f5f9)", borderRadius: 4, height: 10, flex: 1 }}>
    <div style={{ width: `${total > 0 ? Math.round((Math.max(0, part) / total) * 100) : 0}%`, height: "100%", borderRadius: 4, background: couleur }} />
  </div>
);

const VueGlobale = () => {
  const { isAllBoutiques } = useAuth();
  const [range, setRange] = usePeriode();
  const [g, setG] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (!isAllBoutiques) return;
    getVueGlobale({ from: range.from, to: range.to }).then((r) => setG(r.data.data)).catch((e) => setMsg(errMsg(e)));
  }, [range, isAllBoutiques]);

  // ✅ Réservée à la vue « Toutes les boutiques »
  if (!isAllBoutiques) {
    return (
      <Page>
        <PageHeader icon={<FaGlobe />} title="Vue globale" />
        <Alert type="info" msg="La vue globale est disponible uniquement en vue « Toutes les boutiques » (sélecteur de boutique en haut de l'écran)." />
      </Page>
    );
  }

  const t = g?.totaux;
  return (
    <Page>
      <PageHeader icon={<FaGlobe />} title="Vue globale" subtitle="Chiffre d'affaires de l'entreprise : atelier + commerce, chaque vente comptée une seule fois" />
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <PeriodeFilter range={range} onChange={setRange} />

      {t && (
        <>
          {g.basesMixtes && (
            <Alert type="warning" msg="Attention : vos boutiques n'ont pas la même base de prix (TTC / HT). Les totaux additionnent des montants de bases différentes." />
          )}
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi icon={<FaCoins />} tone="primary" label="Chiffre d'affaires total" value={tnd(t.total.ca)} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="success" label="Encaissé total" value={tnd(t.total.encaisse)} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaTools />} tone="info" label="Atelier (réparations)" value={tnd(t.reparations.ca)} hint={`${t.reparations.nombre} réparation(s) · encaissé ${tnd(t.reparations.encaisse)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaCashRegister />} tone="warning" label="Commerce (hors réparations)" value={tnd(t.commerce.ca)} hint={`${t.commerce.documents} document(s) · encaissé ${tnd(t.commerce.encaisse)}`} /></div>
          </div>

          <Card title="Répartition du chiffre d'affaires" className="mb-3">
            <div className="d-flex align-items-center gap-2 mb-2"><span style={{ width: 120 }}>Atelier</span><Barre part={t.reparations.ca} total={t.total.ca} couleur="#4361ee" /><b className="at-num" style={{ width: 130, textAlign: "right" }}>{tnd(t.reparations.ca)}</b></div>
            <div className="d-flex align-items-center gap-2"><span style={{ width: 120 }}>Commerce</span><Barre part={t.commerce.ca} total={t.total.ca} couleur="#f59e0b" /><b className="at-num" style={{ width: 130, textAlign: "right" }}>{tnd(t.commerce.ca)}</b></div>
          </Card>

          <Table rows={g.boutiques} rowKey={(l) => l.boutique._id} empty="Aucune boutique" cols={[
            { label: "Boutique", render: (l) => <><b>{l.boutique.nom}</b> <span className="at-muted">({l.base})</span></> },
            { label: "Atelier", right: true, render: (l) => tnd(l.reparations.ca) },
            { label: "Commerce", right: true, render: (l) => tnd(l.commerce.ca) },
            { label: "Total", right: true, render: (l) => <b>{tnd(l.total.ca)}</b> },
            { label: "Encaissé", right: true, render: (l) => tnd(l.total.encaisse) },
          ]} />

          <div className="at-alert at-alert-info mt-3 mb-0">
            <b>Règle de calcul (sans double comptage)</b> : une réparation est comptée une seule fois, depuis son dossier
            (prix + imprévus acceptés des réparations reçues dans la période, comme dans les Statistiques ; encaissé = acomptes).
            Le commerce ajoute uniquement les lignes hors réparation (articles, services, tickets), nettes des avoirs,
            et les règlements hors part reportée sur les acomptes des réparations. Les réparations facturées sur la période
            ({tnd(t.reparations.facturees)}) ne sont donc pas ajoutées une deuxième fois. Montants sur la base de saisie de chaque boutique (TTC ou HT).
          </div>
        </>
      )}
    </Page>
  );
};

export default VueGlobale;
