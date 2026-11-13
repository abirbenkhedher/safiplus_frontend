import { useEffect, useRef, useState } from "react";
import { FaCashRegister, FaTrash, FaPlus, FaMinus, FaPrint, FaCheckCircle, FaReceipt, FaCoins, FaPen } from "react-icons/fa";
import {
  getArticlesComptoir, venteComptoir, getComptoirJour, getParametresVente, nouvelleCleVente, MODES_REGLEMENT, modeLabel,
} from "../../api/ventes";
import { getCaisseCourante } from "../../api/caisse";
import { useAuth } from "../../context/AuthContext";
import { isGlobalView } from "../../utils/boutiqueStorage";
import { Page, PageHeader, Alert, Card, Table, Kpi, IconBtn } from "../../components/atelier/ui";
import { tnd, errMsg } from "../../utils/atelier";
import { ClientPicker } from "../../components/commercial/commun";
import { calcLigne, calcTotaux } from "../../components/commercial/calculs";
import { imprimerTicket, imprimerDocument } from "../../components/commercial/imprimer";

// ============================================================
// ✅ Vente comptoir : panier → encaissement → ticket
// Le ticket est validé (sortie de stock au coût CMP/FIFO) et encaissé
// en une seule opération. Sans client : « Client comptoir ».
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const AUTO_PRINT_KEY = "comptoirImpressionAuto";
const lireAutoPrint = () => { try { return localStorage.getItem(AUTO_PRINT_KEY) !== "0"; } catch { return true; } };

const Comptoir = () => {
  const { hasPermission } = useAuth();
  const voirMarge = hasPermission("ventes") || hasPermission("rapports");
  const lectureSeule = isGlobalView();
  const [params, setParams] = useState(null);
  const [search, setSearch] = useState("");
  const [resultats, setResultats] = useState([]);
  const [panier, setPanier] = useState([]);
  const [client, setClient] = useState(null);
  const [mixte, setMixte] = useState(false);
  const [mode, setMode] = useState("ESPECES");
  const [recu, setRecu] = useState("");
  const [paiements, setPaiements] = useState([{ mode: "ESPECES", montant: "" }, { mode: "CARTE", montant: "" }]);
  const [cle, setCle] = useState(() => nouvelleCleVente());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [derniere, setDerniere] = useState(null);
  const [jour, setJour] = useState(null);
  const [autoPrint, setAutoPrint] = useState(lireAutoPrint);
  const searchRef = useRef(null);

  const prixSaisis = params?.prixTTC === false ? "HT" : "TTC";
  const tva = Number(params?.tauxTVA ?? 19);
  const tot = calcTotaux(panier, prixSaisis);
  const recuTotal = mixte ? r3(paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0)) : (recu === "" ? tot.net : Number(recu) || 0);
  const especes = mixte ? paiements.filter((p) => p.mode === "ESPECES").reduce((s, p) => s + (Number(p.montant) || 0), 0) : (mode === "ESPECES" ? recuTotal : 0);
  const rendu = r3(Math.max(0, recuTotal - tot.net));
  const manque = r3(Math.max(0, tot.net - recuTotal));

  const [caisse, setCaisse] = useState(undefined); // undefined = inconnu, null = fermée
  const loadJour = () => {
    getComptoirJour().then((r) => setJour(r.data.data)).catch(() => {});
    getCaisseCourante().then((r) => setCaisse(r.data.data ? { numero: r.data.data.numero, theorique: r.data.data.calcul?.theorique } : null)).catch(() => {});
  };
  useEffect(() => {
    getParametresVente().then((r) => setParams(r.data.data)).catch((e) => setMsg({ text: errMsg(e) }));
    loadJour();
  }, []);
  const terme = search.trim();
  useEffect(() => {
    if (terme.length < 1) return undefined;
    const t = setTimeout(() => getArticlesComptoir(terme).then((r) => setResultats(r.data.data || [])).catch(() => setResultats([])), 200);
    return () => clearTimeout(t);
  }, [terme]);
  const visibles = terme ? resultats : [];

  const ajouter = (a) => {
    setPanier((p) => {
      const i = p.findIndex((l) => l.stock === a._id);
      if (i >= 0) return p.map((l, j) => (j === i ? { ...l, quantite: Number(l.quantite) + 1 } : l));
      return [...p, { type: "article", stock: a._id, designation: a.designation, code: a.code, dispo: a.quantite, quantite: 1, prixUnitaire: a.prix, remisePct: 0, tauxTVA: a.tauxTVA ?? tva }];
    });
    setSearch("");
    setResultats([]);
    searchRef.current?.focus();
  };
  const ajouterLibre = () => setPanier((p) => [...p, { type: "libre", designation: "", quantite: 1, prixUnitaire: 0, remisePct: 0, tauxTVA: tva }]);
  const setLigne = (i, patch) => setPanier((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  // Douchette : le code suivi de Entrée ajoute directement l'article
  const onSearchKey = async (e) => {
    if (e.key !== "Enter" || !terme) return;
    e.preventDefault();
    try {
      const r = await getArticlesComptoir(terme);
      const list = r.data.data || [];
      const exact = list.find((a) => a.code && a.code.toLowerCase() === terme.toLowerCase());
      if (exact || list.length === 1) ajouter(exact || list[0]);
      else setResultats(list);
    } catch (err) { setMsg({ text: errMsg(err) }); }
  };

  const reinitialiser = () => {
    setPanier([]); setClient(null); setRecu(""); setMixte(false); setMode("ESPECES");
    setPaiements([{ mode: "ESPECES", montant: "" }, { mode: "CARTE", montant: "" }]);
    setCle(nouvelleCleVente());
    searchRef.current?.focus();
  };

  const encaisser = async () => {
    if (!panier.length) { setMsg({ text: "Le panier est vide" }); return; }
    if (panier.some((l) => l.type === "libre" && !String(l.designation).trim())) { setMsg({ text: "Désignation obligatoire pour une ligne libre" }); return; }
    if (!client && manque > 0) { setMsg({ text: `Il manque ${tnd(manque)}. Choisissez un client pour vendre à crédit.` }); return; }
    if (rendu > 0 && rendu > r3(especes)) { setMsg({ text: "Seules les espèces peuvent dépasser le total (monnaie rendue)." }); return; }
    setBusy(true); setMsg(null);
    try {
      const body = {
        client: client?.id || undefined,
        prixSaisis,
        lignes: panier.map((l) => ({
          type: l.type, stock: l.stock || null, designation: l.type === "libre" ? l.designation : "",
          quantite: Number(l.quantite), prixUnitaire: Number(l.prixUnitaire), remisePct: Number(l.remisePct) || 0, tauxTVA: Number(l.tauxTVA) || 0,
        })),
        paiements: mixte
          ? paiements.filter((p) => Number(p.montant) > 0).map((p) => ({ mode: p.mode, montant: Number(p.montant) }))
          : (recuTotal > 0 ? [{ mode, montant: recuTotal }] : []),
      };
      const r = await venteComptoir(body, cle);
      const d = r.data.data;
      setDerniere(d);
      if (autoPrint) imprimerTicket(d.ticket, { params, recu: d.recu, rendu: d.rendu });
      reinitialiser();
      loadJour();
    } catch (e) { setMsg({ text: errMsg(e) }); }
    setBusy(false);
  };

  const toggleAutoPrint = (v) => { setAutoPrint(v); try { localStorage.setItem(AUTO_PRINT_KEY, v ? "1" : "0"); } catch { /* ignoré */ } };

  return (
    <Page>
      <PageHeader icon={<FaCashRegister />} title="Vente comptoir" subtitle="Accessoires et services : le stock et la caisse sont mis à jour à l'encaissement" />
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      {lectureSeule && <Alert type="warning" msg="Vue « Toutes les boutiques » : choisissez une boutique pour vendre." />}
      {!lectureSeule && caisse === null && (
        <Alert type={params?.commerce?.caisseObligatoire ? "danger" : "warning"}
          msg={params?.commerce?.caisseObligatoire
            ? "Caisse fermée : les paiements en espèces sont refusés. Ouvrez la caisse (menu Commercial → Caisse)."
            : "Caisse fermée : les ventes en espèces ne seront rattachées à aucune caisse."} />
      )}
      {caisse && <div className="at-muted mb-2">Caisse <b>{caisse.numero}</b> ouverte · espèces théoriques {tnd(caisse.theorique)}</div>}

      {derniere && (
        <div className="at-alert at-alert-success" role="status">
          <span>
            <FaCheckCircle /> Vente <b>{derniere.ticket.numero}</b> : {tnd(derniere.ticket.netAPayer)}
            {derniere.rendu > 0 && <> · <b>Rendre {tnd(derniere.rendu)}</b></>}
            {derniere.reste > 0 && <> · reste dû {tnd(derniere.reste)}</>}
          </span>
          <span className="d-flex gap-2">
            <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => imprimerTicket(derniere.ticket, { params, recu: derniere.recu, rendu: derniere.rendu })}><FaPrint /> Ticket</button>
            <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => imprimerDocument(derniere.ticket, params)}><FaPrint /> A4</button>
            <button type="button" className="at-alert-close" onClick={() => setDerniere(null)} aria-label="Fermer">×</button>
          </span>
        </div>
      )}

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <Card title="Panier" icon={<FaReceipt />}>
            <div className="at-picker mb-3">
              <input ref={searchRef} autoFocus className="form-control-modern" placeholder="Scanner ou rechercher un article (code, nom)…"
                value={search} disabled={lectureSeule} onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearchKey} />
              {visibles.length > 0 && (
                <div className="at-picker-list">
                  {visibles.map((a) => (
                    <div key={a._id} role="button" className="at-picker-item" onClick={() => ajouter(a)}>
                      <b>{a.designation}</b>{a.code ? ` · ${a.code}` : ""} — {tnd(a.prix)}
                      <span className="at-muted"> (stock {a.quantite})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {panier.length === 0 && <div className="at-muted mb-2">Panier vide : scannez ou recherchez un article.</div>}
            {panier.map((l, i) => {
              const total = calcLigne(l, prixSaisis).ttc;
              const depasse = l.type === "article" && Number(l.quantite) > Number(l.dispo);
              return (
                <div key={i} className="at-line" style={{ gridTemplateColumns: "minmax(160px, 3fr) 130px 100px 80px 110px 32px", alignItems: "center" }}>
                  <div>
                    {l.type === "libre"
                      ? <input className="form-control-modern" placeholder="Désignation (service…)" value={l.designation} onChange={(e) => setLigne(i, { designation: e.target.value })} />
                      : <><b>{l.designation}</b>{l.code ? <span className="at-muted"> · {l.code}</span> : null}{depasse && <div style={{ color: "#ef4444", fontSize: 12 }}>Stock disponible : {l.dispo}</div>}</>}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <IconBtn title="Moins" onClick={() => setLigne(i, { quantite: Math.max(1, Number(l.quantite) - 1) })}><FaMinus /></IconBtn>
                    <input type="number" min="1" step="1" className="form-control-modern" style={{ width: 56, textAlign: "center" }} aria-label="Quantité"
                      value={l.quantite} onChange={(e) => setLigne(i, { quantite: e.target.value })} />
                    <IconBtn title="Plus" onClick={() => setLigne(i, { quantite: Number(l.quantite) + 1 })}><FaPlus /></IconBtn>
                  </div>
                  <div><input type="number" min="0" step="0.001" className="form-control-modern" aria-label={`Prix ${prixSaisis}`} title={`Prix unitaire ${prixSaisis}`} value={l.prixUnitaire} onChange={(e) => setLigne(i, { prixUnitaire: e.target.value })} /></div>
                  <div><input type="number" min="0" max="100" step="1" className="form-control-modern" aria-label="Remise %" title="Remise %" placeholder="%" value={l.remisePct} onChange={(e) => setLigne(i, { remisePct: e.target.value })} /></div>
                  <div className="at-num" style={{ textAlign: "right", fontWeight: 600 }}>{tnd(total)}</div>
                  <div><IconBtn title="Retirer" tone="danger" onClick={() => setPanier((p) => p.filter((_, j) => j !== i))}><FaTrash /></IconBtn></div>
                </div>
              );
            })}
            <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={ajouterLibre} disabled={lectureSeule}><FaPen /> Ligne libre (service)</button>
              <span className="at-muted">Prix saisis {prixSaisis} · HT {tnd(tot.ht)} · TVA {tnd(tot.tva)}</span>
            </div>
          </Card>
        </div>

        <div className="col-12 col-lg-5">
          <Card title="Encaissement" icon={<FaCoins />}>
            <div className="mb-3">
              <label className="form-label">Client (facultatif — obligatoire pour une vente à crédit)</label>
              <ClientPicker value={client?.id} label={client?.label} onChange={(id, label) => setClient(id ? { id, label } : null)} />
            </div>
            <div className="d-flex justify-content-between align-items-baseline mb-3">
              <span className="at-stat-label">Total à payer</span>
              <span style={{ fontSize: 30, fontWeight: 700 }}>{tnd(tot.net)}</span>
            </div>

            <div className="form-check form-switch mb-2">
              <input id="mixte" type="checkbox" role="switch" className="form-check-input" checked={mixte} onChange={(e) => setMixte(e.target.checked)} />
              <label htmlFor="mixte" className="form-check-label" style={{ fontSize: 13.5 }}>Paiement mixte (plusieurs modes)</label>
            </div>
            {!mixte ? (
              <>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {MODES_REGLEMENT.filter(([v]) => v !== "AUTRE").map(([v, l]) => (
                    <button key={v} type="button" className={`btn-modern btn-sm ${mode === v ? "btn-modern-primary" : "btn-modern-outline"}`} onClick={() => setMode(v)}>{l}</button>
                  ))}
                </div>
                <label className="form-label">{mode === "ESPECES" ? "Montant reçu" : "Montant payé"}</label>
                <input type="number" min="0" step="0.001" className="form-control-modern mb-2" placeholder={String(tot.net)}
                  value={recu} onChange={(e) => setRecu(e.target.value)} />
                {mode === "ESPECES" && (
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    {[5, 10, 20, 50].map((b) => (
                      <button key={b} type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setRecu(String(r3(Number(recu || 0) + b)))}>+{b}</button>
                    ))}
                    <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setRecu("")}>Compte juste</button>
                  </div>
                )}
              </>
            ) : (
              paiements.map((p, i) => (
                <div key={i} className="d-flex gap-2 mb-2">
                  <select className="form-control-modern" value={p.mode} onChange={(e) => setPaiements((ps) => ps.map((x, j) => (j === i ? { ...x, mode: e.target.value } : x)))}>
                    {MODES_REGLEMENT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <input type="number" min="0" step="0.001" className="form-control-modern" placeholder="Montant" value={p.montant}
                    onChange={(e) => setPaiements((ps) => ps.map((x, j) => (j === i ? { ...x, montant: e.target.value } : x)))} />
                </div>
              ))
            )}

            <div className="d-flex justify-content-between mt-2">
              <span>Reçu</span><b>{tnd(recuTotal)}</b>
            </div>
            {rendu > 0 && <div className="d-flex justify-content-between" style={{ fontSize: 18, color: "#10b981" }}><span>À rendre</span><b>{tnd(rendu)}</b></div>}
            {manque > 0 && <div className="d-flex justify-content-between" style={{ color: "#ef4444" }}><span>{client ? "Reste à crédit" : "Manque"}</span><b>{tnd(manque)}</b></div>}

            <button type="button" className="btn-modern btn-modern-primary w-100 mt-3" style={{ padding: "14px 0", fontSize: 17 }}
              disabled={busy || lectureSeule || !panier.length} onClick={encaisser}>
              <FaCashRegister /> {busy ? "Enregistrement…" : `Encaisser ${tnd(tot.net)}`}
            </button>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <div className="form-check">
                <input id="autoprint" type="checkbox" className="form-check-input" checked={autoPrint} onChange={(e) => toggleAutoPrint(e.target.checked)} />
                <label htmlFor="autoprint" className="form-check-label" style={{ fontSize: 13 }}>Imprimer le ticket automatiquement</label>
              </div>
              {panier.length > 0 && <button type="button" className="at-link" onClick={reinitialiser}>Vider le panier</button>}
            </div>
          </Card>
        </div>
      </div>

      {jour && (
        <>
          <div className="row g-3 mt-1 mb-3">
            <div className="col-6 col-lg-3"><Kpi tone="primary" label="Tickets du jour" value={jour.totaux.nombre} /></div>
            <div className="col-6 col-lg-3"><Kpi tone="success" label="Ventes du jour TTC" value={tnd(jour.totaux.ttc)} hint={`HT ${tnd(jour.totaux.ht)}`} /></div>
            {voirMarge && <div className="col-6 col-lg-3"><Kpi tone="info" label="Marge sur articles" value={tnd(jour.totaux.margeArticles)} hint={`Coût ${tnd(jour.totaux.coutArticles)}`} /></div>}
            <div className="col-6 col-lg-3"><Kpi tone="gray" label="Encaissé par mode" value={tnd(Object.values(jour.totaux.parMode).reduce((s, v) => s + v, 0))}
              hint={Object.entries(jour.totaux.parMode).map(([m, v]) => `${modeLabel(m)} ${tnd(v)}`).join(" · ") || "—"} /></div>
          </div>
          <Table rows={jour.tickets} empty="Aucune vente aujourd'hui" cols={[
            { label: "N°", render: (t) => <b>{t.numero}</b> },
            { label: "Heure", render: (t) => new Date(t.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) },
            { label: "Client", render: (t) => t.clientSnapshot?.nom || "—" },
            { label: "Articles", right: true, render: (t) => t.nbArticles },
            { label: "Total TTC", right: true, render: (t) => <b>{tnd(t.netAPayer)}</b> },
            { label: "Avoirs", right: true, render: (t) => (t.montantAvoirs ? tnd(t.montantAvoirs) : "—") },
          ]} />
        </>
      )}
    </Page>
  );
};

export default Comptoir;
