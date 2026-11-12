import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaUserClock, FaTools, FaExclamationTriangle, FaCheckCircle, FaBoxOpen, FaHourglassHalf,
  FaUndo, FaCogs, FaInbox, FaUsers, FaMoneyBillWave, FaWallet, FaCoins, FaArrowRight,
} from "react-icons/fa";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import apiClient from "../../api/client";
import { getUsers } from "../../api/users";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, PeriodeFilter, Kpi, Table, Card, Alert } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, errMsg } from "../../utils/atelier";

// ============================================================
// ✅ MON TABLEAU DE BORD — réparateur / commercial
// L'admin peut afficher celui de n'importe quel employé.
// ============================================================
const duree = (h) => {
  if (h === null || h === undefined) return "—";
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} j ${h % 24} h`;
};

const colsDossiers = (extra = []) => [
  { label: "N°", render: (r) => <Link to={`/reparations/${r._id}`} className="md-num">{r.numero}</Link> },
  { label: "Client", render: (r) => <div className="md-client"><b>{r.client}</b>{r.telephone && <div className="md-muted">{r.telephone}</div>}</div> },
  { label: "Appareil", render: (r) => <span className="md-wrap">{r.appareil}</span> },
  { label: "Statut", render: (r) => <span className="md-statut" style={{ background: `${r.couleur}22`, color: r.couleur }}>{r.statut}</span> },
  ...extra,
];

const MonDashboard = () => {
  const { user, isAdmin } = useAuth();
  const admin = isAdmin();
  const [range, setRange] = useRange();
  // Admin : employé choisi (bouton 📊 de la page Utilisateurs → ?user=<id>)
  const [searchParams, setSearchParams] = useSearchParams();
  const cible = admin ? searchParams.get("user") || "" : "";
  const setCible = (id) => setSearchParams(id ? { user: id } : {});
  const [employes, setEmployes] = useState([]);
  const [res, setRes] = useState({ key: null, data: null, error: null });
  const key = `${range.from}|${range.to}|${cible}`;

  useEffect(() => {
    if (!admin) return;
    getUsers()
      .then((r) => setEmployes((r?.data || []).filter((u) => u.isActive !== false && u.role !== "SUPER_ADMIN")))
      .catch(() => setEmployes([]));
  }, [admin]);

  useEffect(() => {
    if (admin && !cible) return; // l'admin doit choisir un employé
    const params = { from: range.from, to: range.to, ...(cible ? { user: cible } : {}) };
    apiClient.get("/dashboard/me", { params })
      .then((r) => setRes({ key, data: r.data.data, error: null }))
      .catch((e) => setRes({ key, data: null, error: errMsg(e) }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = res.key !== key && !(admin && !cible);
  const d = loading ? null : res.data;
  const c = d?.compteurs;
  const nom = d?.utilisateur?.nom || user?.firstName || "";

  return (
    <Page>
      <PageHeader
        icon={<FaUserClock />}
        title={cible ? `Tableau de bord de ${nom}` : `Mon tableau de bord`}
        subtitle={cible ? "Vue admin d'un employé" : `Bonjour ${user?.firstName || user?.username || ""} 👋 — vos dossiers et vos gains`}
      >
        {admin && (
          <select className="form-control-modern md-select" value={cible} onChange={(e) => setCible(e.target.value)} aria-label="Employé">
            <option value="">— Choisir un employé —</option>
            {employes.filter((u) => ["REPARATEUR", "COMMERCIAL"].includes(u.role)).map((u) => (
              <option key={u._id} value={u._id}>
                {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username} ({u.role === "REPARATEUR" ? "réparateur" : "commercial"})
              </option>
            ))}
          </select>
        )}
      </PageHeader>

      <Alert msg={res.error} onClose={() => setRes({ ...res, error: null })} />

      {admin && !cible ? (
        <div className="card-modern md-choose">
          Choisissez un réparateur ou un commercial ci-dessus pour afficher son tableau de bord.
          <div className="md-muted">Votre propre tableau de bord est le tableau de bord général.</div>
        </div>
      ) : (
      <>

      {/* ---------- Ma journée ---------- */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><Kpi icon={<FaTools />} tone="primary" label="À traiter" value={c?.aTraiter ?? "…"} /></div>
        <div className="col-6 col-lg-3"><Kpi icon={<FaExclamationTriangle />} tone="danger" label="En retard (+48 h)" value={c?.enRetard ?? "…"} /></div>
        <div className="col-6 col-lg-3"><Kpi icon={<FaCheckCircle />} tone="success" label="Terminées aujourd'hui" value={c?.termineesAujourdhui ?? "…"} /></div>
        <div className="col-6 col-lg-3"><Kpi icon={<FaBoxOpen />} tone="warning" label="Prêtes à livrer" value={c?.pretesALivrer ?? "…"} /></div>
      </div>

      {(d?.sections?.atelier ?? true) && (
        <>
          <h2 className="md-h2">🔧 Mes réparations à traiter</h2>
          <Table
            rows={d?.aTraiter || []}
            empty={loading ? "Chargement…" : "Aucune réparation en cours — bravo !"}
            cols={colsDossiers([
              { label: "Depuis", right: true, render: (r) => (
                <span className={r.enRetard ? "md-retard" : ""}>{r.enRetard && <FaExclamationTriangle size={11} />} {duree(r.heures)}</span>
              ) },
            ])}
          />
          {(d?.pretes?.length || 0) > 0 && (
            <>
              <h2 className="md-h2">📦 Prêtes à livrer</h2>
              <Table rows={d.pretes} cols={colsDossiers([{ label: "Reste à payer", right: true, render: (r) => tnd(r.reste) }])} />
            </>
          )}
        </>
      )}

      {/* ---------- Mon activité sur la période ---------- */}
      <h2 className="md-h2">📊 Mon activité</h2>
      <PeriodeFilter range={range} onChange={setRange} />

      {(d?.sections?.atelier ?? true) && (
        <>
          <div className="md-section-label">Atelier — dossiers qui me sont affectés</div>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi icon={<FaCheckCircle />} tone="success" label="Réparations terminées" value={d?.atelier.terminees ?? "…"} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaHourglassHalf />} tone="primary" label="Délai moyen" value={d ? duree(d.atelier.delaiMoyenHeures) : "…"} hint="de la réception à la fin" /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaUndo />} tone="danger" label="Retours SAV" value={d?.atelier.savRetours ?? "…"} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaCogs />} tone="warning" label="Pièces consommées" value={d?.atelier.piecesConsommees ?? "…"} /></div>
          </div>
        </>
      )}

      {d?.sections?.accueil && (
        <>
          <div className="md-section-label">Accueil — dossiers que j'ai créés</div>
          <div className="row g-3 mb-3">
            <div className="col-6 col-lg-3"><Kpi icon={<FaInbox />} tone="primary" label="Réceptionnées" value={d.accueil.receptionnees} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaUsers />} tone="primary" label="Clients servis" value={d.accueil.clientsServis} /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="success" label="Encaissé (acomptes)" value={tnd(d.accueil.encaisse)} hint="dossiers réceptionnés sur la période" /></div>
            <div className="col-6 col-lg-3"><Kpi icon={<FaWallet />} tone="danger" label="Reste à encaisser" value={tnd(d.accueil.resteAEncaisser)} hint="tous mes dossiers" /></div>
          </div>
          {d.accueil.aEncaisser.length > 0 && (
            <Card title="Dossiers avec un reste à payer">
              <Table rows={d.accueil.aEncaisser.slice(0, 10)} cols={colsDossiers([{ label: "Reste", right: true, render: (r) => <b>{tnd(r.reste)}</b> }])} />
            </Card>
          )}
        </>
      )}

      {/* ---------- Ma rémunération ---------- */}
      <h2 className="md-h2">💰 Ma rémunération</h2>
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3"><Kpi icon={<FaCoins />} tone="success" label="Commissions validées" value={d ? tnd(d.remuneration.commissionsValidees) : "…"} /></div>
        <div className="col-6 col-lg-3"><Kpi icon={<FaHourglassHalf />} tone="warning" label="Commissions à valider" value={d ? tnd(d.remuneration.commissionsEnAttente) : "…"} /></div>
        <div className="col-6 col-lg-3"><Kpi icon={<FaWallet />} tone="primary" label="Gains de la période" value={d ? tnd(d.remuneration.gainsBruts) : "…"} hint="commissions validées + salaire + primes" /></div>
        <div className="col-6 col-lg-3">
          <Kpi icon={<FaMoneyBillWave />} tone="danger" label="Solde dû" value={d ? tnd(d.remuneration.soldeDu) : "…"}
            hint={d?.remuneration.dernierPaiement ? `dernier ${d.remuneration.dernierPaiement.type} : ${tnd(d.remuneration.dernierPaiement.montant)} le ${dateFr(d.remuneration.dernierPaiement.date)}` : "aucun paiement"} />
        </div>
      </div>
      {!cible && (
        <div className="mb-4">
          <Link to="/ma-remuneration" className="md-link">Voir le détail de ma rémunération <FaArrowRight size={11} /></Link>
        </div>
      )}

      {/* ---------- Graphiques ---------- */}
      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <Card title="Réparations terminées par jour">
            <div style={{ height: 240 }}>
              {d?.graphiques.termineesParJour.length ? (
                <ResponsiveContainer>
                  <BarChart data={d.graphiques.termineesParJour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={11} width={30} />
                    <Tooltip labelFormatter={(v) => dateFr(v)} formatter={(v) => [v, "terminées"]} />
                    <Bar dataKey="nb" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="md-empty">Aucune réparation terminée sur la période</div>}
            </div>
          </Card>
        </div>
        <div className="col-12 col-lg-5">
          <Card title="Mes réparations par famille">
            <div style={{ height: 240 }}>
              {d?.graphiques.parFamille.length ? (
                <ResponsiveContainer>
                  <BarChart data={d.graphiques.parFamille} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" allowDecimals={false} fontSize={11} />
                    <YAxis type="category" dataKey="famille" width={110} fontSize={11} />
                    <Tooltip formatter={(v) => [v, "réparations"]} />
                    <Bar dataKey="nb" fill="#4361ee" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="md-empty">Aucune réparation sur la période</div>}
            </div>
          </Card>
        </div>
      </div>
      </>
      )}
      <style>{styles}</style>
    </Page>
  );
};

// Période : mois en cours par défaut (même règle que les écrans atelier)
const useRange = () => usePeriode();

const styles = `
  .md-h2 { font-size: 16px; font-weight: 700; margin: 22px 0 10px; color: var(--gray-800); }
  .md-section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--gray-500); margin: 6px 0 8px; letter-spacing: .3px; }
  .md-num { font-family: monospace; font-weight: 800; color: var(--primary); text-decoration: none; white-space: nowrap; }
  .md-client { min-width: 0; max-width: 220px; overflow-wrap: anywhere; }
  .md-wrap { overflow-wrap: anywhere; }
  .md-muted { font-size: 11.5px; color: var(--gray-500); }
  .md-statut { padding: 2px 8px; border-radius: 8px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
  .md-retard { color: var(--danger, #dc2626); font-weight: 800; display: inline-flex; align-items: center; gap: 4px; }
  .md-select { min-width: 220px; max-width: 100%; }
  .md-link { font-size: 13px; font-weight: 700; color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
  .md-choose { padding: 28px; text-align: center; font-weight: 600; color: var(--gray-700); }
  .md-empty { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--gray-500); font-size: 13px; text-align: center; }
  [data-theme="dark"] .md-h2 { color: #e5e7eb; }
`;

export default MonDashboard;
