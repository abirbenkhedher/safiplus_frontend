import { useEffect, useState } from "react";
import { FaLock, FaLockOpen, FaEye, FaPrint, FaCalendarDay, FaCalendarAlt } from "react-icons/fa";
import { getClotures, cloturerJour, cloturerMois, rouvrirCloture } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, Card, Alert, Table, FormModal, StatutBadge, IconBtn } from "../../components/atelier/ui";
import { tnd, dateFr, userName, errMsg, askMotif, isoDay, isoMonth } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
const Clotures = () => {
  const { hasPermission } = useAuth();
  const canClose = hasPermission("clotures");
  const canReopen = hasPermission("clotures_rouvrir");
  const [rows, setRows] = useState([]);
  const [jour, setJour] = useState(isoDay());
  const [mois, setMois] = useState(isoMonth());
  const [view, setView] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => getClotures().then((r) => setRows(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  useEffect(() => { load(); }, []);

  const run = async (fn) => {
    setBusy(true);
    try { const r = await fn(); setMsg({ type: "success", text: r.data.message }); load(); }
    catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  return (
    <Page>
      <PageHeader icon={<FaLock />} title="Clôtures" subtitle="Une période clôturée est verrouillée : consommations, déclarations, commissions et paiements" />
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />

      {canClose && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-lg-6">
            <Card title="Clôture journalière" icon={<FaCalendarDay />} className="h-100">
              <p className="at-muted">Calcule et valide les commissions du jour, puis fige le journal par réparateur.</p>
              <div className="d-flex gap-2 align-items-end">
                <div className="flex-grow-1">
                  <label className="form-label">Jour</label>
                  <input type="date" className="form-control-modern" value={jour} onChange={(e) => setJour(e.target.value)} />
                </div>
                <button className="btn-modern btn-modern-primary" disabled={busy}
                  onClick={async () => (await confirmer({ message: `Clôturer le ${jour} ?` })) && run(() => cloturerJour(jour))}>
                  <FaLock /> Clôturer
                </button>
              </div>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card title="Clôture mensuelle" icon={<FaCalendarAlt />} className="h-100">
              <p className="at-muted">Génère les salaires depuis les contrats, valide les commissions du mois et fige le journal.</p>
              <div className="d-flex gap-2 align-items-end">
                <div className="flex-grow-1">
                  <label className="form-label">Mois</label>
                  <input type="month" className="form-control-modern" value={mois} onChange={(e) => setMois(e.target.value)} />
                </div>
                <button className="btn-modern btn-modern-primary" disabled={busy}
                  onClick={async () => (await confirmer({ message: `Clôturer ${mois} ?` })) && run(() => cloturerMois(mois))}>
                  <FaLock /> Clôturer
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <Table
        rows={rows}
        empty="Aucune clôture enregistrée"
        cols={[
          { label: "Type", render: (r) => <span className={`badge-modern badge-modern-${r.type === "journaliere" ? "primary" : "warning"}`}>{r.type === "journaliere" ? "Journalière" : "Mensuelle"}</span> },
          { label: "Période", render: (r) => <b>{r.periode}</b> },
          { label: "Statut", render: (r) => <StatutBadge statut={r.statut} /> },
          { label: "Clôturée", render: (r) => <div><div>{dateFr(r.clotureLe)}</div><div className="at-muted">{userName(r.cloturePar)}</div></div> },
          { label: "Commissions", right: true, render: (r) => tnd(r.totaux?.commissions) },
          { label: "Coût pièces", right: true, render: (r) => tnd(r.totaux?.coutPieces) },
          {
            label: "", render: (r) => (
              <div className="at-actions">
                <IconBtn title="Voir le journal" onClick={() => setView(r)}><FaEye /></IconBtn>
                {r.statut === "cloturee" && canReopen && (
                  <IconBtn title="Rouvrir" tone="danger" onClick={async () => { const m = await askMotif("Motif de réouverture :"); if (m) run(() => rouvrirCloture(r._id, m)); }}>
                    <FaLockOpen />
                  </IconBtn>
                )}
              </div>
            ),
          },
        ]}
      />

      <FormModal show={!!view} size="xl" title={`Journal ${view?.type === "journaliere" ? "du" : "de"} ${view?.periode || ""}`} onClose={() => setView(null)}>
        {view && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <StatutBadge statut={view.statut} />
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => window.print()}><FaPrint /> Imprimer</button>
            </div>
            <Table rows={view.journal || []} rowKey={(r) => r.reparateur} empty="Aucune activité sur la période" cols={[
              { label: "Réparateur", render: (r) => <b>{r.nom}</b> }, { key: "consommations", label: "Pièces", right: true },
              { label: "Coût pièces", right: true, render: (r) => tnd(r.coutPieces) },
              { label: "Commissions", right: true, render: (r) => tnd(r.commissions) },
              { label: "Salaires", right: true, render: (r) => tnd(r.salaires) },
              { label: "Primes / ajust.", right: true, render: (r) => tnd(r.primes) },
              { label: "Avances", right: true, render: (r) => tnd(r.avances) },
              { label: "Paiements", right: true, render: (r) => tnd(r.paiements) },
            ]} />
            <div className="at-card-title mt-4">Historique</div>
            <div className="d-flex flex-column gap-2">
              {(view.historique || []).map((h, i) => (
                <div key={i} className="at-chip" style={{ alignSelf: "flex-start" }}>
                  {h.action === "cloture" ? <FaLock /> : <FaLockOpen />} {dateFr(h.date)} · {h.action === "cloture" ? "Clôture" : "Réouverture"} par {userName(h.par)}{h.motif ? ` · ${h.motif}` : ""}
                </div>
              ))}
            </div>
          </>
        )}
      </FormModal>
    </Page>
  );
};

export default Clotures;
