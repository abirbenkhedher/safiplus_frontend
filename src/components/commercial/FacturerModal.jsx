import { useEffect, useState } from "react";
import { getAFacturer, creerDepuis } from "../../api/ventes";
import { FormModal, Field, Alert } from "../atelier/ui";
import { tnd, dateFr, errMsg } from "../../utils/atelier";
import { ClientPicker } from "./commun";

// ============================================================
// ✅ Facture (ou devis) depuis des réparations et/ou des bons de livraison
// d'un même client — facture groupée possible.
// ============================================================
const FacturerModal = ({ client: clientInit, reparationId, type: typeInit = "FACTURE", onClose, onCreated }) => {
  const [client, setClient] = useState(clientInit || null);
  const [type, setType] = useState(typeInit);
  const [data, setData] = useState({ reparations: [], bls: [] });
  const [reps, setReps] = useState(reparationId ? [reparationId] : []);
  const [bls, setBls] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [dataClient, setDataClient] = useState(null); // client des données chargées
  useEffect(() => {
    if (!client?.id) return;
    getAFacturer(client.id).then((r) => { setData(r.data.data); setDataClient(client.id); }).catch((e) => setErr(errMsg(e)));
  }, [client?.id]);
  // Client retiré ou changé : on n'affiche pas les données du précédent
  const visibles = client?.id && dataClient === client.id ? data : { reparations: [], bls: [] };

  const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const total = visibles.reparations.filter((r) => reps.includes(r._id)).reduce((s, r) => s + r.prixTotal, 0)
    + visibles.bls.filter((b) => bls.includes(b._id)).reduce((s, b) => s + b.netAPayer, 0);

  const save = async () => {
    if (!reps.length && !bls.length) { setErr("Cochez au moins une réparation ou un bon de livraison"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await creerDepuis({ type, client: client.id, reparations: reps, bls: type === "FACTURE" ? bls : [] });
      onCreated?.(r.data.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  return (
    <FormModal show size="lg" title="Facturer des réparations / bons de livraison" onClose={onClose} onSubmit={save} busy={busy} submitLabel="Créer le brouillon">
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="row g-3 mb-3">
        <Field label="Client" col="col-12 col-md-8">
          <ClientPicker value={client?.id} label={client?.label} disabled={!!clientInit}
            onChange={(id, label) => { setClient(id ? { id, label } : null); setReps([]); setBls([]); }} />
        </Field>
        <Field label="Document" col="col-12 col-md-4">
          <select className="form-control-modern" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="FACTURE">Facture</option><option value="DEVIS">Devis</option>
          </select>
        </Field>
      </div>
      {client?.id && (
        <>
          <div className="at-card-title">Réparations non facturées</div>
          {visibles.reparations.length === 0 && <div className="at-muted mb-3">Aucune réparation à facturer pour ce client.</div>}
          {visibles.reparations.map((r) => (
            <div key={r._id} className="form-check mb-2">
              <input id={`r-${r._id}`} type="checkbox" className="form-check-input" checked={reps.includes(r._id)} onChange={() => toggle(reps, setReps, r._id)} />
              <label htmlFor={`r-${r._id}`} className="form-check-label" style={{ fontSize: 13.5 }}>
                <b>{r.numero}</b> · {dateFr(r.date)} · {r.appareil} {r.pannes ? `(${r.pannes})` : ""} · {r.statut}
                {" · "}<b>{tnd(r.prixTotal)}</b>{r.acompte > 0 ? <span className="at-muted"> (acompte {tnd(r.acompte)})</span> : null}
              </label>
            </div>
          ))}
          {type === "FACTURE" && visibles.bls.length > 0 && (
            <>
              <div className="at-card-title mt-3">Bons de livraison à facturer</div>
              {visibles.bls.map((b) => (
                <div key={b._id} className="form-check mb-2">
                  <input id={`b-${b._id}`} type="checkbox" className="form-check-input" checked={bls.includes(b._id)} onChange={() => toggle(bls, setBls, b._id)} />
                  <label htmlFor={`b-${b._id}`} className="form-check-label" style={{ fontSize: 13.5 }}>
                    <b>{b.numero}</b> · {dateFr(b.date)} · <b>{tnd(b.netAPayer)}</b>
                  </label>
                </div>
              ))}
            </>
          )}
          <div className="at-alert at-alert-info mt-3 mb-0">
            Sélection : <b>{tnd(total)}</b>. Le brouillon reste modifiable (remise, lignes supplémentaires) avant validation.
            Les pièces déjà consommées dans les réparations ne ressortent pas du stock.
          </div>
        </>
      )}
    </FormModal>
  );
};

export default FacturerModal;
