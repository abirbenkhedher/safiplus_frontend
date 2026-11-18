import { useEffect, useState } from "react";
import {
  FaPrint, FaCheck, FaEdit, FaTrash, FaBan, FaExchangeAlt, FaUndo, FaMoneyBillWave, FaThumbsUp, FaThumbsDown, FaFileInvoice,
} from "react-icons/fa";
import {
  getDocument, validerDocument, deleteDocument, annulerDocument, transformerDocument, creerAvoir, statutDevis, modeLabel,
  typeDocDe, MODES_REGLEMENT,
} from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { FormModal, Alert, Table } from "../atelier/ui";
import { tnd, dateFr, errMsg, askMotif, userName } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
import { StatutDoc, PaiementBadge } from "./commun";
import { calcLigne, montantEnLettres, remiseLabel } from "./calculs";
import { imprimerDocument, imprimerTicket } from "./imprimer";
import ReglementModal from "./ReglementModal";

// ============================================================
// ✅ Détail d'un document de vente + actions selon type / statut
// ============================================================
const DocumentView = ({ id, params, onClose, onChanged, onEdit, onOpen }) => {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("ventes");
  const canPay = hasPermission("reglements");
  const [doc, setDoc] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [encaisser, setEncaisser] = useState(false);
  const [rembourser, setRembourser] = useState(false);
  const [validationAvoir, setValidationAvoir] = useState(null); // { mode } : avoir / bon de retour

  const load = () => getDocument(id).then((r) => setDoc(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  // Le parent remonte le composant à chaque document (key = id)
  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!id) return null;

  const run = async (fn, ok, after) => {
    setBusy(true);
    try {
      const r = await fn();
      setMsg({ type: "success", text: r?.data?.rembourse !== undefined && r?.data?.message ? r.data.message : ok });
      onChanged?.();
      if (after) after(r?.data?.data);
      else await load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const t = doc ? typeDocDe(doc) : null;
  const s = doc?.statut;
  const brouillon = s === "brouillon";
  const ouvrirNouveau = (d) => { if (d) onEdit?.(d); };

  const actions = doc && (
    <div className="d-flex flex-wrap gap-2">
      <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => imprimerDocument(doc, params)}><FaPrint /> Imprimer / PDF</button>
      {canWrite && brouillon && (
        <>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => onEdit?.(doc)}><FaEdit /> Modifier</button>
          <button type="button" className="btn-modern btn-modern-primary btn-sm" disabled={busy} onClick={async () => {
            // ✅ Avoir / bon de retour : choix du remboursement (l'argent sort)
            if (doc.type === "AVOIR") { setValidationAvoir({ mode: "ESPECES" }); return; }
            const stock = ["BL", "FACTURE"].includes(doc.type) && doc.lignes.some((l) => l.type === "article" && !l.stockSorti);
            const ok = await confirmer({
              title: `Valider ${t.label.toLowerCase()}`, confirmText: "Valider",
              message: `Le document recevra son numéro définitif${["FACTURE", "AVOIR"].includes(doc.type) ? " et ne sera plus modifiable" : ""}.${stock ? "\nLes articles sortiront du stock." : ""}${doc.type === "AVOIR" && doc.lignes.some((l) => l.retourStock) ? "\nLes articles cochés reviendront en stock." : ""}`,
            });
            if (ok) run(() => validerDocument(doc._id), "Document validé");
          }}><FaCheck /> Valider</button>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" disabled={busy} onClick={async () => {
            if (await confirmer({ message: "Supprimer ce brouillon ?", variant: "danger", confirmText: "Supprimer" })) {
              run(() => deleteDocument(doc._id), "Brouillon supprimé", () => onClose());
            }
          }}><FaTrash /> Supprimer</button>
        </>
      )}
      {canWrite && doc.type === "DEVIS" && s === "valide" && (
        <>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => statutDevis(doc._id, "accepte"), "Devis accepté")}><FaThumbsUp /> Accepté</button>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => statutDevis(doc._id, "refuse"), "Devis refusé")}><FaThumbsDown /> Refusé</button>
        </>
      )}
      {canWrite && doc.type === "DEVIS" && s === "refuse" && (
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => statutDevis(doc._id, "valide"), "Devis remis en cours")}><FaUndo /> Remettre en cours</button>
      )}
      {canWrite && doc.type === "DEVIS" && ["valide", "accepte"].includes(s) && (
        <>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => transformerDocument(doc._id, "BC"), "Bon de commande créé (brouillon)", ouvrirNouveau)}><FaExchangeAlt /> → Bon de commande</button>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => transformerDocument(doc._id, "BL"), "Bon de livraison créé (brouillon)", ouvrirNouveau)}><FaExchangeAlt /> → Bon de livraison</button>
          <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => run(() => transformerDocument(doc._id, "FACTURE"), "Facture créée (brouillon)", ouvrirNouveau)}><FaFileInvoice /> → Facture</button>
        </>
      )}
      {canWrite && doc.type === "BC" && s === "valide" && (
        <>
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => transformerDocument(doc._id, "BL"), "Bon de livraison créé (brouillon)", ouvrirNouveau)}><FaExchangeAlt /> → Bon de livraison</button>
          <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => run(() => transformerDocument(doc._id, "FACTURE"), "Facture créée (brouillon)", ouvrirNouveau)}><FaFileInvoice /> → Facture</button>
        </>
      )}
      {canWrite && doc.type === "BL" && s === "valide" && (
        <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => run(() => transformerDocument(doc._id, "FACTURE"), "Facture créée (brouillon)", ouvrirNouveau)}><FaFileInvoice /> → Facture</button>
      )}
      {canWrite && ["DEVIS", "BC", "BL"].includes(doc.type) && ["valide", "accepte", "refuse"].includes(s) && (
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={async () => {
          const m = await askMotif("Motif d'annulation :");
          if (m) run(() => annulerDocument(doc._id, m), doc.type === "BL" ? "BL annulé (articles remis en stock)" : `${t.label} annulé`);
        }}><FaBan /> Annuler</button>
      )}
      {doc.type === "TICKET" && (
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => imprimerTicket(doc, { params })}><FaPrint /> Ticket 80 mm</button>
      )}
      {doc.type === "AVOIR" && s === "valide" && canPay && (
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setRembourser(true)}><FaMoneyBillWave /> Rembourser le client</button>
      )}
      {["FACTURE", "TICKET"].includes(doc.type) && s === "valide" && (
        <>
          {canPay && doc.paiement?.reste > 0 && (
            <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => setEncaisser(true)}><FaMoneyBillWave /> Encaisser</button>
          )}
          {canWrite && Number(doc.montantAvoirs || 0) < Number(doc.netAPayer) && (
            <>
              {doc.lignes.some((l) => l.type === "article" && l.stockSorti) && (
                <button type="button" className="btn-modern btn-modern-outline btn-sm" title="La marchandise revient en stock et l'argent est rendu"
                  onClick={() => run(() => creerAvoir(doc._id, "retour"), "Bon de retour créé (brouillon) : ajustez les quantités puis validez", ouvrirNouveau)}><FaUndo /> Bon de retour</button>
              )}
              <button type="button" className="btn-modern btn-modern-outline btn-sm" title="L'argent est rendu, la marchandise ne revient pas en stock"
                onClick={() => run(() => creerAvoir(doc._id, "avoir"), "Avoir créé (brouillon) : ajustez les lignes puis validez", ouvrirNouveau)}><FaUndo /> Faire un avoir</button>
            </>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {validationAvoir && doc && (
        <FormModal show title={`Valider ${t.label.toLowerCase()}`} submitLabel="Valider" busy={busy} onClose={() => setValidationAvoir(null)}
          onSubmit={() => {
            const body = validationAvoir.mode ? { remboursement: { mode: validationAvoir.mode } } : {};
            setValidationAvoir(null);
            run(() => validerDocument(doc._id, body), `${t.label} validé`);
          }}>
          <div className="at-alert at-alert-info">
            {doc.nature === "retour"
              ? "Bon de retour : les articles reviennent en stock et l'argent est rendu au client."
              : "Avoir : l'argent est rendu au client, les articles ne reviennent PAS en stock."}
            {" "}Le numéro devient définitif.
          </div>
          <label className="form-label">Rendre l'argent</label>
          <select className="form-control-modern" value={validationAvoir.mode} onChange={(e) => setValidationAvoir({ mode: e.target.value })}>
            {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>Rembourser maintenant — {l}</option>)}
            <option value="">Ne pas rembourser : garder en crédit client</option>
          </select>
          <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
            Seule la part déjà payée de la facture est remboursée ; si la facture n'était pas payée, l'avoir diminue simplement ce que le client doit.
          </div>
        </FormModal>
      )}
      <FormModal show size="xl" title={doc ? `${t.label} ${doc.numero || "(brouillon)"}` : "Chargement…"} onClose={onClose}>
        <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
        {doc && (
          <>
            <div className="mb-3">{actions}</div>
            <div className="row g-3 mb-3">
              <div className="col-6 col-md-3"><div className="at-stat-label">Statut</div><StatutDoc statut={s} type={doc.type} /> <PaiementBadge paiement={doc.paiement} /></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Client</div><div className="at-stat-value">{doc.clientSnapshot?.nom || doc.client?.nom}</div><div className="at-muted">{doc.client?.phone}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Date</div><div className="at-stat-value">{dateFr(doc.date)}</div>
                {doc.dateEcheance && (doc.type === "FACTURE" || doc.modePaiement === "TRAITE") && <div className="at-muted">Échéance {dateFr(doc.dateEcheance)}</div>}
                {doc.modePaiement && <div className="at-muted">Paiement : <b>{modeLabel(doc.modePaiement)}</b></div>}
                {doc.dateValidite && doc.type === "DEVIS" && <div className="at-muted">Valable jusqu'au {dateFr(doc.dateValidite)}</div>}
              </div>
              <div className="col-6 col-md-3"><div className="at-stat-label">{doc.type === "AVOIR" ? "Total avoir" : "Net à payer"}</div><div className="at-stat-value">{tnd(doc.netAPayer)}</div></div>
            </div>
            {doc.motifAnnulation && <Alert type="warning" msg={`Annulé : ${doc.motifAnnulation}`} />}
            {(doc.origines?.length > 0 || doc.factureOrigine || doc.derives?.length > 0 || doc.avoirs?.length > 0) && (
              <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <span className="at-muted">Documents liés :</span>
                {[...(doc.origines || []), ...(doc.factureOrigine ? [{ ...doc.factureOrigine, type: "FACTURE" }] : []), ...(doc.derives || []), ...(doc.avoirs || []).map((a) => ({ ...a, type: "AVOIR" }))].map((x) => (
                  <button key={x._id} type="button" className="at-chip" style={{ border: "none", cursor: "pointer" }} onClick={() => onOpen?.(x._id)}>
                    {typeDocDe(x).label} {x.numero || "(brouillon)"}
                  </button>
                ))}
              </div>
            )}

            <Table rows={doc.lignes} empty="Aucune ligne" cols={[
              { label: "Désignation", render: (l) => <>{l.designation}{l.type === "article" && l.stockSorti && doc.type !== "AVOIR" ? <span className="at-muted"> · stock sorti</span> : null}{doc.type === "AVOIR" && l.retourStock ? <span className="at-muted"> · retour stock</span> : null}</> },
              { label: "Qté", right: true, render: (l) => l.quantite },
              { label: `PU ${doc.prixSaisis}`, right: true, render: (l) => tnd(l.prixUnitaire) },
              { label: "Remise", right: true, render: (l) => remiseLabel(l) || "—" },
              { label: "TVA", right: true, render: (l) => `${l.tauxTVA} %` },
              // Totaux de ligne avant remise globale (la remise globale figure dans les totaux)
              { label: "Total HT", right: true, render: (l) => tnd(calcLigne(l, doc.prixSaisis).ht) },
              { label: "Total TTC", right: true, render: (l) => <b>{tnd(brouillon ? calcLigne(l, doc.prixSaisis).ttc : l.montantTTC)}</b> },
            ]} />
            <div className="d-flex justify-content-end mt-2">
              <div style={{ minWidth: 280 }}>
                {Number(doc.remiseGlobaleMontant) > 0 && (
                  <>
                    <div className="d-flex justify-content-between"><span>Total avant remise ({doc.prixSaisis})</span><b>{tnd(doc.totalAvantRemise)}</b></div>
                    <div className="d-flex justify-content-between" style={{ color: "#dc2626" }}>
                      <span>Remise globale{doc.remiseGlobaleType === "pct" ? ` (${doc.remiseGlobaleValeur} %)` : ""}</span><b>− {tnd(doc.remiseGlobaleMontant)}</b>
                    </div>
                  </>
                )}
                <div className="d-flex justify-content-between"><span>Total HT</span><b>{tnd(doc.totalHT)}</b></div>
                {(doc.tvaParTaux || []).map((x) => (
                  <div key={x.taux} className="d-flex justify-content-between at-muted"><span>TVA {x.taux} % (base {tnd(x.base)})</span><span>{tnd(x.montant)}</span></div>
                ))}
                {Number(doc.timbreFiscal) > 0 && <div className="d-flex justify-content-between"><span>Timbre fiscal</span><b>{tnd(doc.timbreFiscal)}</b></div>}
                <div className="d-flex justify-content-between at-total"><span>{doc.type === "AVOIR" ? "Total avoir" : "Net à payer"}</span><span>{tnd(doc.netAPayer)}</span></div>
              </div>
            </div>
            <div className="at-muted mt-1" style={{ textAlign: "right", fontStyle: "italic" }}>{montantEnLettres(doc.netAPayer)}</div>

            {["FACTURE", "TICKET"].includes(doc.type) && s === "valide" && doc.paiement && (
              <>
                <div className="at-card-title mt-4">Paiement</div>
                <div className="row g-3 mb-2">
                  <div className="col-6 col-md-3"><div className="at-stat-label">Dû (après avoirs)</div><div className="at-stat-value">{tnd(doc.paiement.du)}</div></div>
                  <div className="col-6 col-md-3"><div className="at-stat-label">Réglé</div><div className="at-stat-value" style={{ color: "#10b981" }}>{tnd(doc.paiement.regle)}</div></div>
                  <div className="col-6 col-md-3"><div className="at-stat-label">Reste à payer</div><div className="at-stat-value" style={{ color: doc.paiement.reste > 0 ? "#ef4444" : undefined }}>{tnd(doc.paiement.reste)}</div></div>
                  {doc.paiement.credit > 0 && <div className="col-6 col-md-3"><div className="at-stat-label">Trop-perçu (crédit)</div><div className="at-stat-value">{tnd(doc.paiement.credit)}</div></div>}
                </div>
                {doc.reparations?.length > 0 && (
                  <div className="at-hint mb-2" style={{ fontStyle: "normal" }}>Les acomptes saisis dans les dossiers de réparation sont comptés comme réglés.</div>
                )}
                <Table rows={doc.reglements || []} empty="Aucun règlement enregistré sur cette facture" cols={[
                  { label: "N°", render: (r) => <b>{r.numero}</b> },
                  { label: "Date", render: (r) => dateFr(r.date) },
                  { label: "Mode", render: (r) => `${modeLabel(r.mode)}${r.reference ? ` · ${r.reference}` : ""}` },
                  { label: "Montant affecté", right: true, render: (r) => tnd(r.montantFacture) },
                  { label: "", render: (r) => (r.statut === "annule" ? <span className="badge-modern badge-modern-danger">Annulé</span> : null) },
                ]} />
              </>
            )}
            {doc.observation && <div className="at-muted mt-3">Observation : {doc.observation}</div>}
            <div className="at-muted mt-2" style={{ fontSize: 12 }}>
              Créé par {userName(doc.createdBy)}{doc.validePar ? ` · validé par ${userName(doc.validePar)} le ${dateFr(doc.valideLe)}` : ""}
            </div>
          </>
        )}
      </FormModal>
      {encaisser && doc && (
        <ReglementModal
          client={{ id: doc.client?._id, label: doc.client?.nom }}
          factureId={doc._id}
          modeInitial={doc.modePaiement || undefined}
          echeanceInitiale={doc.modePaiement === "TRAITE" ? doc.dateEcheance : undefined}
          onClose={() => setEncaisser(false)}
          onSaved={(r) => { setEncaisser(false); setMsg({ type: "success", text: `Règlement ${r.numero} enregistré` }); onChanged?.(); load(); }}
        />
      )}
      {rembourser && doc && (
        <ReglementModal
          remboursement
          client={{ id: doc.client?._id, label: doc.client?.nom }}
          onClose={() => setRembourser(false)}
          onSaved={(r) => { setRembourser(false); setMsg({ type: "success", text: `Remboursement ${r.numero} enregistré` }); onChanged?.(); }}
        />
      )}
    </>
  );
};

export default DocumentView;
