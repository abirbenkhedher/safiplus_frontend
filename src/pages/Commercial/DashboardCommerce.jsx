import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome, FaCashRegister, FaFileInvoiceDollar, FaMoneyBillWave, FaExclamationTriangle, FaBoxOpen, FaClipboardList, FaLock, FaLockOpen,
} from "react-icons/fa";
import { getTableauDeBordCommerce } from "../../api/caisse";
import { modeLabel, TYPES_DOC } from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, Alert, Card, Table, Kpi } from "../../components/atelier/ui";
import { tnd, errMsg } from "../../utils/atelier";

// ============================================================
// ✅ Tableau de bord de l'espace Commerce
// ============================================================
const DashboardCommerce = () => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getTableauDeBordCommerce().then((r) => setD(r.data.data)).catch((e) => setMsg(errMsg(e)));
  }, []);

  const ventesJour = d ? d.jour.factures.ttc + d.jour.tickets.ttc - d.jour.avoirs.ttc : 0;
  const ventesMois = d ? d.mois.factures.ttc + d.mois.tickets.ttc - d.mois.avoirs.ttc : 0;
  const raccourcis = [
    ["comptoir", "/comptoir", <FaCashRegister key="c" />, "Vente comptoir", ["comptoir", "ventes"]],
    ["facture", "/ventes", <FaFileInvoiceDollar key="f" />, "Devis & factures", ["ventes", "ventes:read"]],
    ["reglement", "/reglements", <FaMoneyBillWave key="r" />, "Encaisser un client", ["reglements"]],
    ["caisse", "/caisse", <FaLock key="k" />, "Caisse", ["caisse"]],
  ].filter(([, , , , perms]) => perms.some((p) => hasPermission(p)));

  return (
    <Page>
      <PageHeader icon={<FaHome />} title="Tableau de bord commerce" subtitle="Ventes, encaissements et points d'attention du jour">
        {raccourcis.map(([k, to, icon, label]) => (
          <Link key={k} to={to} className={`btn-modern ${k === "comptoir" ? "btn-modern-primary" : "btn-modern-outline"}`}>{icon} {label}</Link>
        ))}
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />

      {d && (
        <>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi icon={<FaCashRegister />} tone="primary" label="Ventes du jour (TTC)" value={tnd(ventesJour)}
              hint={`${d.jour.tickets.nombre} ticket(s) · ${d.jour.factures.nombre} facture(s)`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="success" label="Encaissé aujourd'hui" value={tnd(d.jour.encaissements.net)}
              hint={Object.entries(d.jour.encaissements.parMode || {}).map(([m, v]) => `${modeLabel(m)} ${tnd(v)}`).join(" · ") || "—"} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaFileInvoiceDollar />} tone="info" label="Ventes du mois (TTC)" value={tnd(ventesMois)} hint={`CA net HT ${tnd(d.mois.caNetHT)}`} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaBoxOpen />} tone="info" label="Marge articles du mois" value={tnd(d.mois.articles.marge)} hint={`Ventes HT ${tnd(d.mois.articles.venteHT)}`} /></div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3">
              <div role="button" onClick={() => navigate("/caisse")} style={{ cursor: "pointer" }}>
                {d.caisse
                  ? <Kpi icon={d.caisse.ouverte ? <FaLockOpen /> : <FaLock />} tone={d.caisse.ouverte ? "success" : "gray"} label="Caisse"
                      value={d.caisse.ouverte ? d.caisse.numero : "Fermée"} hint={d.caisse.ouverte ? `Espèces théoriques ${tnd(d.caisse.theorique)}` : "Ouvrez la caisse pour encaisser en espèces"} />
                  : <Kpi icon={<FaLock />} tone="gray" label="Caisse" value="—" hint="Choisissez une boutique" />}
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div role="button" onClick={() => navigate("/ventes?type=FACTURE")} style={{ cursor: "pointer" }}>
                <Kpi icon={<FaExclamationTriangle />} tone={d.facturesEnRetard.nombre ? "danger" : "gray"} label="Factures échues impayées"
                  value={d.facturesEnRetard.nombre} hint={tnd(d.facturesEnRetard.montant)} />
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div role="button" onClick={() => navigate("/ventes?type=DEVIS")} style={{ cursor: "pointer" }}>
                <Kpi icon={<FaClipboardList />} tone="warning" label="Devis en cours" value={d.devisEnCours.nombre}
                  hint={`${tnd(d.devisEnCours.montant)} · ${d.devisEnCours.acceptes} accepté(s) à transformer`} />
              </div>
            </div>
            <div className="col-6 col-lg-3">
              <div role="button" onClick={() => navigate("/reglements?tab=creances")} style={{ cursor: "pointer" }}>
                <Kpi icon={<FaMoneyBillWave />} tone="danger" label="Créances clients" value={tnd(d.mois.creancesClients)}
                  hint={d.alertesStock ? `${d.alertesStock} article(s) sous le seuil de stock` : undefined} />
              </div>
            </div>
          </div>

          <Card title="Dernières ventes">
            <Table rows={d.dernieresVentes} empty="Aucune vente" cols={[
              { label: "Document", render: (v) => <b>{TYPES_DOC[v.type]?.label} {v.numero}</b> },
              { label: "Date", render: (v) => new Date(v.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) },
              { label: "Client", render: (v) => v.clientSnapshot?.nom || "—" },
              { label: "Montant", right: true, render: (v) => tnd(v.netAPayer) },
            ]} />
          </Card>
        </>
      )}
    </Page>
  );
};

export default DashboardCommerce;
