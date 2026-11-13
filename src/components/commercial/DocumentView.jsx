import { useEffect, useState } from "react";
import {
  FaPrint, FaCheck, FaEdit, FaTrash, FaBan, FaExchangeAlt, FaUndo, FaMoneyBillWave, FaThumbsUp, FaThumbsDown, FaFileInvoice,
} from "react-icons/fa";
import {
  getDocument, validerDocument, deleteDocument, annulerDocument, transformerDocument, creerAvoir, statutDevis, TYPES_DOC, modeLabel,
} from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { FormModal, Alert, Table } from "../atelier/ui";
import { tnd, dateFr, errMsg, askMotif, userName } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
import { StatutDoc, PaiementBadge } from "./commun";
import { calcLigne, montantEnLettres } from "./calculs";
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

  const load = () => getDocument(id).then((r) => setDoc(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
  // Le parent remonte le composant à chaque document (key = id)
  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!id) return null;

  const run = async (fn, ok, after) => {
    setBusy(true);
    try {
      const r = await fn();
      setMsg({ type: "success", text: ok });
      onChanged?.();
      if (after) after(r?.data?.data);
      else await load();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const t = doc ? TYPES_DOC[doc.type] : null;
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
          <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => transformerDocument(doc._id, "BL"), "Bon de livraison créé (brouillon)", ouvrirNouveau)}><FaExchangeAlt /> → Bon de livraison</button>
          <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => run(() => transformerDocument(doc._id, "FACTURE"), "Facture créée (brouillon)", ouvrirNouveau)}><FaFileInvoice /> → Facture</button>
        </>
      )}
      {canWrite && doc.type === "BL" && s === "valide" && (
        <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => run(() => transformerDocument(doc._id, "FACTURE"), "Facture créée (brouillon)", ouvrirNouveau)}><FaFileInvoice /> → Facture</button>
      )}
      {canWrite && ["DEVIS", "BL"].includes(doc.type) && ["valide", "accepte", "refuse"].includes(s) && (
        <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={async () => {
          const m = await askMotif("Motif d'annulation :");
          if (m) run(() => annulerDocument(doc._id, m), doc.type === "BL" ? "BL annulé (articles remis en stock)" : "Devis annulé");
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
            <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => run(() => creerAvoir(doc._id), "Avoir créé (brouillon) : ajustez les lignes puis validez", ouvrirNouveau)}><FaUndo /> Faire un avoir</button>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <FormModal show size="xl" title={doc ? `${t.label} ${doc.numero || "(brouillon)"}` : "Chargement…"} onClose={onClose}>
        <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
        {doc && (
          <>
            <div className="mb-3">{actions}</div>
            <div className="row g-3 mb-3">
              <div className="col-6 col-md-3"><div className="at-stat-label">Statut</div><StatutDoc statut={s} type={doc.type} /> <PaiementBadge paiement={doc.paiement} /></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Client</div><div className="at-stat-value">{doc.clientSnapshot?.nom || doc.client?.nom}</div><div className="at-muted">{doc.client?.phone}</div></div>
              <div className="col-6 col-md-3"><div className="at-stat-label">Date</div><div className="at-stat-value">{dateFr(doc.date)}</div>
                {doc.dateEcheance && doc.type === "FACTURE" && <div className="at-muted">Échéance {dateFr(doc.dateEcheance)}</div>}
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
                    {TYPES_DOC[x.type]?.label} {x.numero || "(brouillon)"}
                  </button>
                ))}
              </div>
            )}

            <Table rows={doc.lignes} empty="Aucune ligne" cols={[
              { label: "Désignation", render: (l) => <>{l.designation}{l.type === "article" && l.stockSorti && doc.type !== "AVOIR" ? <span className="at-muted"> · stock sorti</span> : null}{doc.type === "AVOIR" && l.retourStock ? <span className="at-muted"> · retour stock</span> : null}</> },
              { label: "Qté", right: true, render: (l) => l.quantite },
              { label: `PU ${doc.prixSaisis}`, right: true, render: (l) => tnd(l.prixUnitaire) },
              { label: "Remise", right: true, render: (l) => (l.remisePct ? `${l.remisePct} %` : "—") },
              { label: "TVA", right: true, render: (l) => `${l.tauxTVA} %` },
              { label: "Total HT", right: true, render: (l) => tnd(brouillon ? calcLigne(l, doc.prixSaisis).ht : l.montantHT) },
              { label: "Total TTC", right: true, render: (l) => <b>{tnd(brouillon ? calcLigne(l, doc.prixSaisis).ttc : l.montantTTC)}</b> },
            ]} />
            <div className="d-flex justify-content-end mt-2">
              <div style={{ minWidth: 280 }}>
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
