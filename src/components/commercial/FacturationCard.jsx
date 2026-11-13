import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileInvoiceDollar, FaPlus } from "react-icons/fa";
import { getDocumentsReparation, getParametresVente, TYPES_DOC } from "../../api/ventes";
import { useAuth } from "../../context/AuthContext";
import { blockInGlobalView } from "../../utils/boutiqueStorage";
import { Card, Table, Alert } from "../atelier/ui";
import { tnd, dateFr, errMsg } from "../../utils/atelier";
import { StatutDoc, PaiementBadge } from "./commun";
import { clientLabel } from "./calculs";
import FacturerModal from "./FacturerModal";
import DocumentEditor from "./DocumentEditor";

/**
 * ✅ Gestion commerciale : devis / factures liés à une réparation
 * + création de la facture (ou du devis) depuis le dossier.
 */
const FacturationCard = ({ reparation, onChanged }) => {
  const { hasPermission, hasModule } = useAuth();
  const navigate = useNavigate();
  const canRead = hasModule("commercial") && (hasPermission("ventes") || hasPermission("ventes:read") || hasPermission("reglements"));
  const canWrite = canRead && hasPermission("ventes");
  const [docs, setDocs] = useState([]);
  const [msg, setMsg] = useState(null);
  const [facturer, setFacturer] = useState(null); // "FACTURE" | "DEVIS"
  const [edit, setEdit] = useState(null);
  const [params, setParams] = useState(null);

  const load = () => getDocumentsReparation(reparation._id).then((r) => setDocs(r.data.data || [])).catch((e) => setMsg(errMsg(e)));
  useEffect(() => { if (canRead && reparation?._id) load(); }, [reparation?._id, reparation?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (canWrite) getParametresVente().then((r) => setParams(r.data.data)).catch(() => {}); }, [canWrite]);
  if (!canRead) return null;

  const factureActive = docs.find((d) => d.type === "FACTURE" && ["brouillon", "valide"].includes(d.statut));
  const ouvrir = (d) => navigate(`/ventes?${d.type !== "FACTURE" ? `type=${d.type}&` : ""}doc=${d._id}`);
  const lancer = (type) => { if (!blockInGlobalView()) setFacturer(type); };

  return (
    <div className="atelier-page mb-3">
      <Card
        title="Facturation"
        icon={<FaFileInvoiceDollar />}
        actions={canWrite && (
          <>
            <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => lancer("DEVIS")}><FaPlus /> Devis</button>
            {!factureActive && <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={() => lancer("FACTURE")}><FaPlus /> Facturer</button>}
          </>
        )}
      >
        <Alert msg={msg} onClose={() => setMsg(null)} />
        {docs.length === 0 ? (
          <div className="at-muted">Aucun devis ni facture pour ce dossier.</div>
        ) : (
          <Table rows={docs} cols={[
            { label: "Document", render: (d) => <button type="button" className="at-link" onClick={() => ouvrir(d)}>{TYPES_DOC[d.type]?.label} {d.numero || "(brouillon)"}</button> },
            { label: "Date", render: (d) => dateFr(d.date) },
            { label: "Montant", right: true, render: (d) => tnd(d.netAPayer) },
            { label: "Reste", right: true, render: (d) => (d.paiement ? tnd(d.paiement.reste) : "—") },
            { label: "Statut", render: (d) => <div className="d-flex gap-1 flex-wrap"><StatutDoc statut={d.statut} type={d.type} /><PaiementBadge paiement={d.paiement} /></div> },
          ]} />
        )}
      </Card>
      {facturer && (
        <FacturerModal
          type={facturer}
          client={{ id: reparation.client?._id || reparation.client, label: clientLabel(reparation.client) }}
          reparationId={reparation._id}
          onClose={() => setFacturer(null)}
          onCreated={(d) => { setFacturer(null); load(); setEdit(d); }}
        />
      )}
      {edit && (
        <DocumentEditor
          doc={edit}
          params={params}
          onClose={() => setEdit(null)}
          onSaved={(d) => { setEdit(null); load(); onChanged?.(); ouvrir(d); }}
        />
      )}
    </div>
  );
};

export default FacturationCard;
