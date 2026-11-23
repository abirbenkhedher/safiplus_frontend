import { useEffect, useRef, useState } from "react";
import { FaTrash, FaUndo } from "react-icons/fa";
import { getArticlesComptoir, retourRapide, nouvelleCleVente, MODES_REGLEMENT } from "../../api/ventes";
import { FormModal, Alert, Field, IconBtn } from "../atelier/ui";
import { errMsg } from "../../utils/atelier";
import { ClientPicker } from "./commun";
import { imprimerDocument } from "./imprimer";

// ============================================================
// ✅ Retour client en un seul écran (comptoir)
// 1. scanner / chercher les articles rapportés + quantité
// 2. la vente d'origine est retrouvée par le serveur (client, ou n° du ticket)
// 3. retour en stock ou avoir sans retour ; remboursement ou crédit client
// 4. « Valider le retour » : bon de retour créé, validé et imprimé
// ============================================================
const RetourClientModal = ({ params, onClose, onDone }) => {
  const [client, setClient] = useState(null);
  const [numero, setNumero] = useState("");
  const [search, setSearch] = useState("");
  const [resultats, setResultats] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [nature, setNature] = useState("retour");
  const [mode, setMode] = useState("ESPECES");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [cle] = useState(() => nouvelleCleVente());
  const searchRef = useRef(null);

  const terme = search.trim();
  useEffect(() => {
    if (!terme) return undefined;
    const t = setTimeout(() => getArticlesComptoir(terme).then((r) => setResultats(r.data.data || [])).catch(() => setResultats([])), 200);
    return () => clearTimeout(t);
  }, [terme]);
  const visibles = terme ? resultats : [];

  const ajouter = (a) => {
    setLignes((ls) => {
      const i = ls.findIndex((l) => l.stock === a._id);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, quantite: Number(l.quantite) + 1 } : l));
      return [...ls, { stock: a._id, designation: a.designation, code: a.code, quantite: 1 }];
    });
    setSearch(""); setResultats([]);
    searchRef.current?.focus();
  };
  // Douchette : code + Entrée
  const onKey = async (e) => {
    if (e.key !== "Enter" || !terme) return;
    e.preventDefault();
    try {
      const list = (await getArticlesComptoir(terme)).data.data || [];
      const exact = list.find((a) => a.code && a.code.toLowerCase() === terme.toLowerCase());
      if (exact || list.length === 1) ajouter(exact || list[0]);
      else setResultats(list);
    } catch (er) { setErr(errMsg(er)); }
  };

  const valider = async () => {
    if (!lignes.length) { setErr("Scannez ou cherchez au moins un article rapporté"); return; }
    if (!client && !numero.trim() && !mode) { setErr("Sans client : remboursez (le crédit se garde au nom d'un client)"); return; }
    setBusy(true); setErr(null);
    try {
      const r = await retourRapide({
        client: client?.id || undefined, numero: numero.trim() || undefined, nature,
        lignes: lignes.map((l) => ({ stock: l.stock, quantite: Number(l.quantite) })),
        ...(mode ? { remboursement: { mode } } : {}),
      }, cle);
      (r.data.data || []).forEach((a) => imprimerDocument(a, params));
      onDone?.(r.data);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  return (
    <FormModal show size="lg" title="Retour client" onClose={onClose} onSubmit={valider} busy={busy} submitLabel="Valider le retour">
      <Alert msg={err} onClose={() => setErr(null)} />
      <div className="row g-3 mb-3">
        <Field label="Client (facultatif)" col="col-12 col-md-7" hint="Sinon : ventes au « Client comptoir »">
          <ClientPicker value={client?.id} label={client?.label} onChange={(id, label) => {
            setClient(id ? { id, label } : null);
            if (!id) setMode((m) => m || "ESPECES"); // pas de crédit sans client
          }} />
        </Field>
        <Field label="N° du ticket / de la facture" col="col-12 col-md-5" hint="Facultatif : retrouvé automatiquement">
          <input className="form-control-modern" placeholder="TK-2026-0012" value={numero} onChange={(e) => setNumero(e.target.value.toUpperCase())} />
        </Field>
      </div>

      <label className="form-label">Articles rapportés</label>
      <div className="at-picker mb-2">
        <input ref={searchRef} autoFocus className="form-control-modern" placeholder="Scanner ou rechercher l'article…"
          value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onKey} />
        {visibles.length > 0 && (
          <div className="at-picker-list">
            {visibles.map((a) => (
              <div key={a._id} role="button" className="at-picker-item" onClick={() => ajouter(a)}>
                <b>{a.designation}</b>{a.code ? ` · ${a.code}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
      {lignes.length === 0 && <div className="at-muted mb-3">Aucun article : scannez le code-barres de l'article rapporté.</div>}
      {lignes.map((l, i) => (
        <div key={l.stock} className="d-flex align-items-center gap-2 mb-2">
          <div style={{ flex: 1, minWidth: 0 }}><b>{l.designation}</b>{l.code ? <span className="at-muted"> · {l.code}</span> : null}</div>
          <input type="number" min="1" step="1" className="form-control-modern" style={{ width: 70, textAlign: "center" }} aria-label={`Quantité : ${l.designation}`}
            value={l.quantite} onChange={(e) => setLignes((ls) => ls.map((x, j) => (j === i ? { ...x, quantite: e.target.value } : x)))} />
          <IconBtn title="Retirer" tone="danger" onClick={() => setLignes((ls) => ls.filter((_, j) => j !== i))}><FaTrash /></IconBtn>
        </div>
      ))}

      <div className="row g-3 mt-1">
        <Field label="État de l'article" col="col-12 col-md-6">
          <select className="form-control-modern" value={nature} onChange={(e) => setNature(e.target.value)}>
            <option value="retour">Revendable : retour en stock</option>
            <option value="avoir">Défectueux / geste : pas de retour en stock</option>
          </select>
        </Field>
        <Field label="Remboursement" col="col-12 col-md-6">
          <select className="form-control-modern" value={mode} onChange={(e) => setMode(e.target.value)}>
            {MODES_REGLEMENT.filter(([v]) => v !== "TRAITE").map(([v, lb]) => <option key={v} value={v}>Rendre l'argent — {lb}</option>)}
            {client && <option value="">Garder en crédit client (échange, prochain achat)</option>}
          </select>
        </Field>
      </div>
      <div className="at-hint mt-2" style={{ fontStyle: "normal" }}>
        <FaUndo /> Le retour est rattaché à la dernière vente de cet article (au client choisi, ou au comptoir), jamais au-delà de la quantité vendue.
        Il est validé tout de suite et le bon est imprimé.
      </div>
    </FormModal>
  );
};

export default RetourClientModal;
