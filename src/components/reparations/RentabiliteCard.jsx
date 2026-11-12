import { useEffect, useState } from "react";
import { FaCoins, FaUsers, FaPlus, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { getRentabiliteReparation } from "../../api/atelier";
import { updateReparation } from "../../api/reparations";
import { useAuth } from "../../context/AuthContext";
import { Card, Table, StatutBadge, Alert, IconBtn } from "../atelier/ui";
import { tnd, userName, errMsg } from "../../utils/atelier";

/**
 * ✅ Module atelier : coût des pièces, marge, commissions d'un dossier
 * + répartition explicite des commissions (intervention partagée).
 */
const RentabiliteCard = ({ reparation, users = [], onChanged }) => {
  const { hasPermission } = useAuth();
  const canView = hasPermission("rapports") || hasPermission("statistiques");
  const canSplit = hasPermission("commissions_valider") || hasPermission("remuneration_regles");
  const [data, setData] = useState(null);
  const [split, setSplit] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => getRentabiliteReparation(reparation._id).then((r) => setData(r.data.data)).catch((e) => setMsg(errMsg(e)));
  useEffect(() => { if (canView && reparation?._id) load(); }, [reparation?._id, reparation?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!canView && !canSplit) return null;

  const saveSplit = async () => {
    const total = split.reduce((s, r) => s + Number(r.pourcentage || 0), 0);
    if (split.length && Math.abs(total - 100) > 0.001) { setMsg(`La répartition doit totaliser 100 % (actuellement ${total} %)`); return; }
    try {
      await updateReparation(reparation._id, { repartitionCommission: split.filter((r) => r.reparateur) });
      setSplit(null);
      setMsg(null);
      onChanged?.();
      setTimeout(load, 600);
    } catch (e) { setMsg(errMsg(e)); }
  };

  const repart = reparation.repartitionCommission || [];
  const nomDe = (id) => userName(users.find((u) => u._id === (id?._id || id))) || "—";
  const totalSplit = split ? split.reduce((s, r) => s + Number(r.pourcentage || 0), 0) : 0;

  const STATS = data ? [
    ["CA HT", data.caHT, null],
    ["Coût des pièces", data.coutPieces, "var(--danger)"],
    ["Marge avant commission", data.margeAvantCommission, null],
    ["Commissions", data.commissions, "var(--warning)"],
    ["Résultat", data.resultatApresCommission, data.resultatApresCommission < 0 ? "var(--danger)" : "var(--success)"],
  ] : [];

  return (
    <div className="atelier-page mb-3">
      <Card
        title="Coûts, marge et commissions"
        icon={<FaCoins />}
        actions={canSplit && !split && (
          <button type="button" className="btn-modern btn-modern-outline btn-sm"
            onClick={() => setSplit(repart.length ? repart.map((r) => ({ reparateur: r.reparateur?._id || r.reparateur, pourcentage: r.pourcentage })) : [{ reparateur: reparation.reparateur?._id || "", pourcentage: 100 }])}>
            <FaUsers /> Répartir la commission
          </button>
        )}
      >
        <Alert msg={msg} onClose={() => setMsg(null)} />

        {data && (
          <div className="row g-3 mb-3">
            {STATS.map(([l, v, color]) => (
              <div key={l} className="col-6 col-md">
                <div className="at-stat-label">{l}</div>
                <div className="at-stat-value" style={color ? { color } : undefined}>{tnd(v)}</div>
              </div>
            ))}
          </div>
        )}
        {data?.coutEstime && (
          <div className="at-alert at-alert-warning">
            <span><FaExclamationTriangle /> Certains coûts sont estimés (aucun coût d'achat exploitable) : renseignez un coût manuel sur l'article ou validez les factures d'achat.</span>
          </div>
        )}
        {data && data.lignes.length > 0 && (
          <Table rows={data.lignes} rowKey={(r, i) => i} cols={[
            { label: "Pièce", render: (l) => l.designation || "—" }, { key: "quantite", label: "Qté", right: true },
            { label: "Coût unitaire", right: true, render: (l) => tnd(l.coutUnitaire) }, { label: "Coût", right: true, render: (l) => <b>{tnd(l.coutTotal)}</b> },
            { label: "Valorisation", render: (l) => <span className={`badge-modern badge-modern-${l.sourceCout === "ESTIME" ? "warning" : "gray"}`}>{l.sourceCout === "ESTIME" ? "Estimé" : l.sourceCout}</span> },
          ]} />
        )}
        {data && data.detailCommissions.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mt-3">
            {data.detailCommissions.map((c) => (
              <span key={c._id} className="at-chip">{userName(c.reparateur)} · <b>{tnd(c.montant)}</b> <StatutBadge statut={c.statut} /></span>
            ))}
          </div>
        )}

        {!split && repart.length > 0 && (
          <div className="at-muted mt-3">Répartition : {repart.map((r) => `${nomDe(r.reparateur)} ${r.pourcentage} %`).join(" · ")}</div>
        )}
        {split && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--gray-100)" }}>
            <div className="at-card-title">Répartition de la commission <span className={`badge-modern badge-modern-${Math.abs(totalSplit - 100) < 0.001 ? "success" : "danger"}`}>{totalSplit} %</span></div>
            {split.map((r, i) => (
              <div key={i} className="d-flex gap-2 mb-2 align-items-center">
                <select className="form-control-modern" value={r.reparateur} onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, reparateur: e.target.value } : x)))}>
                  <option value="">— Réparateur —</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{userName(u)}</option>)}
                </select>
                <input type="number" min="0" max="100" step="0.01" style={{ width: 110 }} className="form-control-modern" value={r.pourcentage}
                  onChange={(e) => setSplit(split.map((x, j) => (j === i ? { ...x, pourcentage: e.target.value } : x)))} />
                <IconBtn title="Retirer" tone="danger" onClick={() => setSplit(split.filter((_, j) => j !== i))}><FaTrash /></IconBtn>
              </div>
            ))}
            <div className="d-flex gap-2 mt-2 flex-wrap">
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setSplit([...split, { reparateur: "", pourcentage: 0 }])}><FaPlus /> Réparateur</button>
              <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={saveSplit}>Enregistrer</button>
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setSplit(null)}>Annuler</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RentabiliteCard;
