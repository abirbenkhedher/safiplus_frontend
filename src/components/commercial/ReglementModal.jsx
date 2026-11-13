import { useEffect, useState } from "react";
import { createReglement, getFacturesImpayees, getSolde, MODES_REGLEMENT } from "../../api/ventes";
import { FormModal, Field, Alert } from "../atelier/ui";
import { tnd, dateFr, errMsg, isoDay } from "../../utils/atelier";
import { ClientPicker } from "./commun";

// ============================================================
// ✅ Encaissement client : un règlement peut solder plusieurs factures.
// La partie non affectée reste en avance (crédit du client).
// Remboursement : rend tout ou partie du crédit du client.
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;

const ReglementModal = ({ client: clientInit, factureId, remboursement = false, onClose, onSaved }) => {
  const [client, setClient] = useState(clientInit || null);
  const [factures, setFactures] = useState([]);
  const [choix, setChoix] = useState({}); // id → montant
  const [solde, setSolde] = useState(null);
  const [f, setF] = useState({ mode: "ESPECES", montant: "", date: isoDay(), reference: "", banque: "", dateEcheance: "", etatCheque: "en_portefeuille", observation: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!client?.id) return;
    getSolde(client.id).then((r) => setSolde(r.data.data)).catch(() => setSolde(null));
    if (remboursement) return;
    getFacturesImpayees(client.id).then((r) => {
      const list = r.data.data || [];
      setFactures(list);
      if (factureId) {
        const fa = list.find((x) => x._id === factureId);
        if (fa) {
          setChoix({ [fa._id]: fa.paiement.reste });
          setF((x) => ({ ...x, montant: fa.paiement.reste }));
        }
      }
    }).catch((e) => setErr(errMsg(e)));
  }, [client?.id, factureId, remboursement]);

  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const totalAffecte = r3(Object.values(choix).reduce((s, v) => s + (Number(v) || 0), 0));
  const avance = r3((Number(f.montant) || 0) - totalAffecte);

  const toggle = (fa) => {
    const n = { ...choix };
    if (n[fa._id] !== undefined) delete n[fa._id];
    else n[fa._id] = fa.paiement.reste;
    setChoix(n);
    const tot = r3(Object.values(n).reduce((s, v) => s + (Number(v) || 0), 0));
    if (tot > 0) setF((x) => ({ ...x, montant: tot }));
  };

  const save = async () => {
    if (!client?.id) { setErr("Choisissez un client"); return; }
    if (!(Number(f.montant) > 0)) { setErr("Montant invalide"); return; }
    if (avance < 0) { setErr("Le total affecté dépasse le montant du règlement"); return; }
    setBusy(true); setErr(null);
    try {
      const affectations = Object.entries(choix).filter(([, m]) => Number(m) > 0).map(([document, montant]) => ({ document, montant: Number(montant) }));
      const r = await createReglement({
        client: client.id, sens: remboursement ? "REMBOURSEMENT" : "ENCAISSEMENT",
        mode: f.mode, montant: Number(f.montant), date: f.date, reference: f.reference, banque: f.banque,
        dateEcheance: f.mode === "CHEQUE" && f.dateEcheance ? f.dateEcheance : null,
        etatCheque: f.mode === "CHEQUE" ? f.etatCheque : undefined,
        observation: f.observation,
        affectations, auto: false,
      });
      onSaved?.(r.data.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const credit = solde && solde.solde < 0 ? -solde.solde : 0;

  return (
    <FormModal show size="lg" title={remboursement ? "Remboursement client" : "Encaissement client"} onClose={onClose} onSubmit={save} busy={busy} submitLabel="Enregistrer">
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="row g-3 mb-3">
        <Field label="Client" col="col-12 col-md-7">
          <ClientPicker value={client?.id} label={client?.label} disabled={!!clientInit}
            onChange={(id, label) => { setClient(id ? { id, label } : null); setChoix({}); setFactures([]); setSolde(null); }} />
        </Field>
        {solde && (
          <div className="col-12 col-md-5">
            <div className="at-stat-label">Solde du client</div>
            <div className="at-stat-value" style={{ color: solde.solde > 0 ? "#ef4444" : solde.solde < 0 ? "#10b981" : undefined }}>
              {solde.solde > 0 ? `Doit ${tnd(solde.solde)}` : solde.solde < 0 ? `Crédit ${tnd(-solde.solde)}` : "Soldé"}
            </div>
          </div>
        )}
      </div>

      {!remboursement && client?.id && (
        <>
          <div className="at-card-title">Factures à régler</div>
          {factures.length === 0 && <div className="at-muted mb-3">Aucune facture impayée : le montant sera enregistré en avance (crédit client).</div>}
          {factures.map((fa) => (
            <div key={fa._id} className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <input type="checkbox" className="form-check-input" checked={choix[fa._id] !== undefined} onChange={() => toggle(fa)} id={`fa-${fa._id}`} />
              <label htmlFor={`fa-${fa._id}`} style={{ minWidth: 220 }}>
                <b>{fa.numero}</b> · {dateFr(fa.date)} · reste <b>{tnd(fa.paiement.reste)}</b>
              </label>
              {choix[fa._id] !== undefined && (
                <input type="number" step="0.001" min="0" max={fa.paiement.reste} className="form-control-modern" style={{ maxWidth: 150 }}
                  value={choix[fa._id]} onChange={(e) => setChoix((c) => ({ ...c, [fa._id]: e.target.value }))} />
              )}
            </div>
          ))}
        </>
      )}

      <div className="row g-3 mt-1">
        <Field label="Montant (TND)" col="col-6 col-md-4">
          <input type="number" step="0.001" min="0" required className="form-control-modern" value={f.montant} onChange={(e) => set("montant", e.target.value)} />
        </Field>
        <Field label="Mode" col="col-6 col-md-4">
          <select className="form-control-modern" value={f.mode} onChange={(e) => set("mode", e.target.value)}>
            {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Date" col="col-6 col-md-4"><input type="date" className="form-control-modern" value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
        {f.mode !== "ESPECES" && (
          <Field label={f.mode === "CHEQUE" ? "N° de chèque" : "Référence"} col="col-6 col-md-4">
            <input className="form-control-modern" value={f.reference} onChange={(e) => set("reference", e.target.value)} />
          </Field>
        )}
        {["CHEQUE", "VIREMENT"].includes(f.mode) && (
          <Field label="Banque" col="col-6 col-md-4"><input className="form-control-modern" value={f.banque} onChange={(e) => set("banque", e.target.value)} /></Field>
        )}
        {f.mode === "CHEQUE" && (
          <>
            <Field label="Échéance du chèque" col="col-6 col-md-4"><input type="date" className="form-control-modern" value={f.dateEcheance} onChange={(e) => set("dateEcheance", e.target.value)} /></Field>
            <Field label="État" col="col-6 col-md-4">
              <select className="form-control-modern" value={f.etatCheque} onChange={(e) => set("etatCheque", e.target.value)}>
                <option value="en_portefeuille">En portefeuille</option><option value="encaisse">Encaissé (banque)</option>
              </select>
            </Field>
          </>
        )}
        <Field label="Observation" col="col-12"><input className="form-control-modern" value={f.observation} onChange={(e) => set("observation", e.target.value)} /></Field>
      </div>

      {!remboursement && Number(f.montant) > 0 && (
        <div className="at-alert at-alert-info mt-3 mb-0">
          Affecté aux factures : <b>{tnd(totalAffecte)}</b>
          {avance > 0 && <> · En avance (crédit client) : <b>{tnd(avance)}</b></>}
        </div>
      )}
      {remboursement && <div className="at-alert at-alert-info mt-3 mb-0">Crédit disponible : <b>{tnd(credit)}</b></div>}
    </FormModal>
  );
};

export default ReglementModal;
