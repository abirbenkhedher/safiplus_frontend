import { useEffect, useState, useCallback } from "react";
import { FaPlus, FaCalculator, FaCheck, FaBan, FaEdit, FaMoneyBillWave, FaCheckCircle, FaHourglassHalf, FaWallet, FaCoins, FaStop } from "react-icons/fa";
import {
  getSoldes, getCommissions, calculerCommissions, validerCommissions, getRegles, createRegle, updateRegle, deleteRegle,
  getContrats, createContrat, terminerContrat, getEcritures, createEcriture, annulerEcriture,
  getPaiementsReparateurs, createPaiementReparateur, annulerPaiementReparateur,
} from "../../api/atelier";
import { getCategories } from "../../api/categories";
import { getTypeArticles } from "../../api/typeArticles";
import { useAuth } from "../../context/AuthContext";
import { ArticleSelect, ReparateurSelect } from "../../components/atelier/pickers";
import { useArticles, useReparateurs } from "../../hooks/useAtelierRefs";
import { Page, PageHeader, Alert, Table, FormModal, Field, StatutBadge, PeriodeFilter, Kpi, Tabs, IconBtn } from "../../components/atelier/ui";
import { usePeriode, tnd, dateFr, userName, errMsg, askMotif, isoDay } from "../../utils/atelier";

const TABS = [
  ["soldes", "Soldes"], ["commissions", "Commissions"], ["regles", "Règles"],
  ["contrats", "Contrats"], ["ecritures", "Primes / ajustements"], ["paiements", "Avances & paiements"],
];
const CALC = { pourcentage: "Pourcentage", fixe_unite: "Montant fixe / unité", forfait_intervention: "Forfait par intervention", palier: "Barème (paliers)" };
const BASES = { prix_vente: "Prix de vente (HT)", main_oeuvre: "Main-d'œuvre", marge: "Marge", cout_achat: "Coût d'achat" };
const MODES = { salaire: "Salaire fixe", commission: "Commission", mixte: "Mixte (salaire + commission)" };

const Remuneration = () => {
  const { hasPermission } = useAuth();
  const can = {
    regles: hasPermission("remuneration_regles"),
    valider: hasPermission("commissions_valider"),
    payer: hasPermission("paiements_reparateurs"),
    annuler: hasPermission("operations_annuler"),
  };
  const reparateurs = useReparateurs();
  const articles = useArticles();
  const [refs, setRefs] = useState({ categories: [], types: [] });
  const [tab, setTab] = useState("soldes");
  const [range, setRange] = usePeriode();
  const [rep, setRep] = useState("");
  const [data, setData] = useState([]);
  const [extra, setExtra] = useState(null);
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    Promise.all([getCategories().catch(() => null), getTypeArticles().catch(() => null)]).then(([c, t]) => {
      const pick = (r) => r?.data?.data || r?.data || r || [];
      setRefs({ categories: Array.isArray(pick(c)) ? pick(c) : [], types: Array.isArray(pick(t)) ? pick(t) : [] });
    });
  }, []);

  const params = { ...range, reparateur: rep || undefined };
  const load = useCallback(async () => {
    try {
      const loaders = {
        soldes: () => getSoldes(params), commissions: () => getCommissions(params), regles: () => getRegles({ reparateur: rep || undefined }),
        contrats: () => getContrats({ reparateur: rep || undefined }), ecritures: () => getEcritures(params), paiements: () => getPaiementsReparateurs(params),
      };
      const r = await loaders[tab]();
      setData(r.data.data);
      setExtra(r.data.totaux || null);
    } catch (e) { setMsg({ text: errMsg(e) }); setData([]); }
  }, [tab, range, rep]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    try { const r = await fn(); setMsg({ type: "success", text: r.data.message || "Enregistré" }); setModal(null); load(); return r; }
    catch (e) { setMsg({ text: errMsg(e) }); return null; }
  };

  const reglesCible = (r) => {
    if (r.article) return `Article ${[r.article.code, r.article.typeArticle?.nom, r.article.marque?.nom, r.article.modele?.nom].filter(Boolean).join(" ")}`;
    if (r.categorie) return `Catégorie ${r.categorie.nom}`;
    if (r.typeArticle) return `Type ${r.typeArticle.nom}`;
    if (r.panne) return `Intervention « ${r.panne} »`;
    return "Générale";
  };
  const regleValeur = (r) => {
    if (r.typeCalcul === "pourcentage") return `${r.taux} % ${BASES[r.base] || r.base}`;
    if (r.typeCalcul === "palier") return (r.paliers || []).map((p) => `${p.de}–${p.a ?? "∞"} : ${p.montant != null ? tnd(p.montant) : `${p.taux} %`}`).join(" ; ");
    return tnd(r.montantFixe);
  };

  // ---------------- Formulaires ----------------
  const saveRegle = () => {
    const f = { ...modal.data };
    const cible = f.cible;
    for (const k of ["article", "categorie", "typeArticle", "panne"]) if (k !== cible) f[k] = null;
    if (f.typeCalcul === "palier") f.paliers = (f.paliersTxt || "").split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
      const [plage, val] = s.split(":").map((x) => x.trim());
      const [de, a] = plage.split("-").map((x) => x.trim());
      const pctg = val?.endsWith("%");
      return { de: Number(de), a: a ? Number(a) : null, taux: pctg ? Number(val.slice(0, -1)) : null, montant: pctg ? null : Number(val) };
    });
    delete f.cible; delete f.paliersTxt;
    f.reparateur = f.reparateur || null;
    return run(() => (f._id ? updateRegle(f._id, f) : createRegle(f)));
  };

  const RegleForm = () => {
    const f = modal.data;
    const set = (k, v) => setModal({ ...modal, data: { ...f, [k]: v } });
    return (
      <div className="row g-3">
        <Field label="Nom" col="col-12"><input className="form-control-modern" value={f.nom || ""} onChange={(e) => set("nom", e.target.value)} /></Field>
        <Field label="Réparateur (vide = tous)" col="col-12 col-md-6"><ReparateurSelect reparateurs={reparateurs} value={f.reparateur} allLabel="Tous les réparateurs" onChange={(v) => set("reparateur", v)} /></Field>
        <Field label="Cible" col="col-12 col-md-6">
          <select className="form-control-modern" value={f.cible} disabled={!!f._id} onChange={(e) => set("cible", e.target.value)}>
            <option value="">Règle générale</option><option value="article">Article</option><option value="categorie">Catégorie</option>
            <option value="typeArticle">Type d'article</option><option value="panne">Intervention (panne)</option>
          </select>
        </Field>
        {f.cible === "article" && <Field label="Article"><ArticleSelect articles={articles} required value={f.article} onChange={(v) => set("article", v)} /></Field>}
        {f.cible === "categorie" && (
          <Field label="Catégorie"><select required className="form-control-modern" value={f.categorie || ""} onChange={(e) => set("categorie", e.target.value)}>
            <option value="">—</option>{refs.categories.map((c) => <option key={c._id} value={c._id}>{c.nom}</option>)}
          </select></Field>
        )}
        {f.cible === "typeArticle" && (
          <Field label="Type d'article"><select required className="form-control-modern" value={f.typeArticle || ""} onChange={(e) => set("typeArticle", e.target.value)}>
            <option value="">—</option>{refs.types.map((c) => <option key={c._id} value={c._id}>{c.nom}</option>)}
          </select></Field>
        )}
        {f.cible === "panne" && <Field label="Nom de la panne / intervention"><input required className="form-control-modern" value={f.panne || ""} onChange={(e) => set("panne", e.target.value)} /></Field>}
        <Field label="Calcul" col="col-12 col-md-6">
          <select className="form-control-modern" value={f.typeCalcul} onChange={(e) => set("typeCalcul", e.target.value)}>
            {Object.entries(CALC).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        {["pourcentage", "palier"].includes(f.typeCalcul) && (
          <Field label="Base de calcul" col="col-12 col-md-6">
            <select className="form-control-modern" value={f.base} onChange={(e) => set("base", e.target.value)}>
              {Object.entries(BASES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
        )}
        {f.typeCalcul === "pourcentage" && <Field label="Taux (%)" col="col-6"><input type="number" step="0.01" min="0" max="100" required className="form-control-modern" value={f.taux} onChange={(e) => set("taux", e.target.value)} /></Field>}
        {["fixe_unite", "forfait_intervention"].includes(f.typeCalcul) && <Field label="Montant (TND)" col="col-6"><input type="number" step="0.001" min="0" required className="form-control-modern" value={f.montantFixe} onChange={(e) => set("montantFixe", e.target.value)} /></Field>}
        {f.typeCalcul === "palier" && (
          <Field label="Paliers (rang mensuel) — ex : « 1-10: 5 ; 11-: 8 » ou « 1-10: 20% »">
            <input required className="form-control-modern" value={f.paliersTxt || ""} onChange={(e) => set("paliersTxt", e.target.value)} />
          </Field>
        )}
        <Field label={f._id ? "Prise d'effet de la modification" : "Valide à partir du"} col="col-6"><input type="date" required className="form-control-modern" value={f.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></Field>
        <Field label="Jusqu'au (facultatif)" col="col-6"><input type="date" className="form-control-modern" value={f.validTo || ""} onChange={(e) => set("validTo", e.target.value || null)} /></Field>
        <Field label="Priorité (départage)" col="col-6"><input type="number" className="form-control-modern" value={f.priorite} onChange={(e) => set("priorite", e.target.value)} /></Field>
        {f._id && <div className="col-12"><div className="at-alert at-alert-info mb-0">Si la règle a déjà servi, une nouvelle version est créée : les commissions validées restent inchangées.</div></div>}
      </div>
    );
  };

  const SimpleForm = ({ fields }) => {
    const f = modal.data;
    const set = (k, v) => setModal({ ...modal, data: { ...f, [k]: v } });
    return (
      <div className="row g-3">
        <Field label="Réparateur" col="col-12"><ReparateurSelect reparateurs={reparateurs} required value={f.reparateur} onChange={(v) => set("reparateur", v)} /></Field>
        {fields.map(([k, label, type, opts]) => (
          <Field key={k} label={label} col="col-12 col-md-6">
            {opts ? (
              <select className="form-control-modern" value={f[k]} onChange={(e) => set(k, e.target.value)}>
                {Object.entries(opts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <input type={type || "text"} step="0.001" className="form-control-modern" value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
            )}
          </Field>
        ))}
      </div>
    );
  };

  const FORMS = {
    regle: { title: "Règle de commission", body: () => RegleForm(), submit: saveRegle },
    contrat: {
      title: "Nouveau contrat (mode de rémunération)",
      body: () => SimpleForm({ fields: [["mode", "Mode", null, MODES], ["salaire", "Salaire (TND)", "number"], ["periodicite", "Périodicité", null, { mensuelle: "Mensuelle", hebdomadaire: "Hebdomadaire", journaliere: "Journalière" }], ["validFrom", "À partir du", "date"]] }),
      submit: () => run(() => createContrat(modal.data)),
    },
    ecriture: {
      title: "Prime / ajustement",
      body: () => SimpleForm({ fields: [["type", "Type", null, { prime: "Prime", ajustement: "Ajustement (+/−)" }], ["montant", "Montant (TND)", "number"], ["libelle", "Libellé"], ["date", "Date", "date"]] }),
      submit: () => run(() => createEcriture(modal.data)),
    },
    paiement: {
      title: "Avance / paiement",
      body: () => SimpleForm({ fields: [["type", "Type", null, { paiement: "Paiement", avance: "Avance" }], ["montant", "Montant (TND)", "number"], ["modePaiement", "Mode", null, { ESPECES: "Espèces", CHEQUE: "Chèque", VIREMENT: "Virement", CARTE: "Carte" }], ["reference", "Référence"], ["date", "Date", "date"]] }),
      submit: () => run(() => createPaiementReparateur(modal.data)),
    },
  };

  // ---------------- Tableaux ----------------
  const SOURCES = { PIECE_REPARATION: "Pièce", INTERVENTION: "Intervention", LIGNE_DECLARATION: "Déclaration" };
  const editRegle = (r) => setModal({
    type: "regle",
    data: {
      ...r, reparateur: r.reparateur?._id || "", article: r.article?._id, categorie: r.categorie?._id, typeArticle: r.typeArticle?._id,
      cible: r.article ? "article" : r.categorie ? "categorie" : r.typeArticle ? "typeArticle" : r.panne ? "panne" : "",
      validFrom: isoDay(), validTo: r.validTo ? isoDay(new Date(r.validTo)) : "",
      paliersTxt: (r.paliers || []).map((p) => `${p.de}-${p.a ?? ""}: ${p.montant != null ? p.montant : `${p.taux}%`}`).join(" ; "),
    },
  });

  const COLS = {
    soldes: [
      { label: "Réparateur", render: (r) => <b>{r.nom}</b> },
      { label: "Salaires", right: true, render: (r) => tnd(r.periode.salaires) },
      { label: "Commissions validées", right: true, render: (r) => tnd(r.periode.commissionsValidees) },
      { label: "À valider", right: true, render: (r) => <span style={{ color: r.periode.commissionsEnAttente ? "var(--warning)" : undefined }}>{tnd(r.periode.commissionsEnAttente)}</span> },
      { label: "Primes / ajust.", right: true, render: (r) => tnd(r.periode.primes + r.periode.ajustements) },
      { label: "Gains bruts", right: true, render: (r) => <b>{tnd(r.periode.gainsBruts)}</b> },
      { label: "Avances", right: true, render: (r) => tnd(r.periode.avances) },
      { label: "Paiements", right: true, render: (r) => tnd(r.periode.paiements) },
      { label: "Solde dû (cumul)", right: true, render: (r) => <span className={`badge-modern badge-modern-${r.cumul.soldeDu > 0 ? "danger" : "success"}`}>{tnd(r.cumul.soldeDu)}</span> },
    ],
    commissions: [
      { label: "Date", render: (r) => dateFr(r.dateSource) },
      { label: "Réparateur", render: (r) => <b>{userName(r.reparateur)}</b> },
      { label: "Source", render: (r) => (
        <div>
          <div>{SOURCES[r.sourceType] || r.sourceType} {r.reparation && <b>{r.reparation.numero}</b>}</div>
          {r.panne && <div className="at-muted">{r.panne}</div>}
        </div>
      ) },
      { label: "Règle appliquée", render: (r) => (
        <div>
          <div>{CALC[r.regleSnapshot?.typeCalcul] || "—"}{r.regleSnapshot?.typeCalcul === "pourcentage" ? ` ${r.regleSnapshot.taux} %` : ""}</div>
          <div className="at-muted">{r.regleSnapshot?.niveau} · v{r.regleSnapshot?.version || 1}</div>
        </div>
      ) },
      { label: "Base", right: true, render: (r) => tnd(r.baseMontant) },
      { label: "Part", right: true, render: (r) => `${r.partPourcentage} %` },
      { label: "Montant", right: true, render: (r) => <b style={{ color: r.montant < 0 ? "var(--danger)" : undefined }}>{tnd(r.montant)}</b> },
      { label: "Statut", render: (r) => (
        <span title={r.motif} className="d-inline-flex gap-1 flex-wrap">
          <StatutBadge statut={r.statut} />
          {r.annule && <span className="badge-modern badge-modern-gray">Contre-écriture</span>}
        </span>
      ) },
    ],
    regles: [
      { label: "Règle", render: (r) => <b>{r.nom || "—"}</b> },
      { label: "Réparateur", render: (r) => (r.reparateur ? userName(r.reparateur) : <span className="at-muted">Tous</span>) },
      { label: "Cible", render: reglesCible },
      { label: "Calcul", render: (r) => (
        <div><div>{CALC[r.typeCalcul]}</div><div className="at-muted">{regleValeur(r)}</div></div>
      ) },
      { label: "Niveau", render: (r) => <span className="at-chip">{r.niveau}{r.priorite ? ` · p${r.priorite}` : ""}</span> },
      { label: "Validité", render: (r) => (
        <div><div>{dateFr(r.validFrom)} → {r.validTo ? dateFr(r.validTo) : "…"}</div><div className="at-muted">version {r.version}</div></div>
      ) },
      { label: "État", render: (r) => (r.enVigueur
        ? <span className="badge-modern badge-modern-success">En vigueur</span>
        : <span className="badge-modern badge-modern-gray">{r.actif ? "Hors période" : "Désactivée"}</span>) },
      can.regles && {
        label: "", render: (r) => r.actif && (
          <div className="at-actions">
            <IconBtn title="Modifier (nouvelle version si déjà utilisée)" onClick={() => editRegle(r)}><FaEdit /></IconBtn>
            <IconBtn title="Désactiver" tone="danger" onClick={() => window.confirm("Désactiver cette règle ?") && run(() => deleteRegle(r._id))}><FaBan /></IconBtn>
          </div>
        ),
      },
    ].filter(Boolean),
    contrats: [
      { label: "Réparateur", render: (r) => <b>{userName(r.reparateur)}</b> },
      { label: "Mode", render: (r) => <span className={`badge-modern badge-modern-${r.mode === "salaire" ? "primary" : r.mode === "mixte" ? "warning" : "success"}`}>{MODES[r.mode]}</span> },
      { label: "Salaire", right: true, render: (r) => (r.mode === "commission" ? "—" : <>{tnd(r.salaire)} <span className="at-muted">/ {r.periodicite}</span></>) },
      { label: "Du", render: (r) => dateFr(r.validFrom) },
      { label: "Au", render: (r) => (r.validTo ? dateFr(r.validTo) : <span className="badge-modern badge-modern-success">En cours</span>) },
      can.regles && {
        label: "", render: (r) => !r.validTo && (
          <div className="at-actions">
            <IconBtn title="Terminer le contrat" tone="danger" onClick={() => { const d = window.prompt("Date de fin (AAAA-MM-JJ)", isoDay()); if (d) run(() => terminerContrat(r._id, d)); }}><FaStop /></IconBtn>
          </div>
        ),
      },
    ].filter(Boolean),
    ecritures: [
      { label: "Date", render: (r) => dateFr(r.date) },
      { label: "Réparateur", render: (r) => <b>{userName(r.reparateur)}</b> },
      { label: "Type", render: (r) => <span className={`badge-modern badge-modern-${r.type === "salaire" ? "primary" : r.type === "prime" ? "success" : "warning"}`}>{{ salaire: "Salaire", prime: "Prime", ajustement: "Ajustement" }[r.type]}</span> },
      { key: "libelle", label: "Libellé" },
      { label: "Montant", right: true, render: (r) => <b style={{ color: r.montant < 0 ? "var(--danger)" : undefined }}>{tnd(r.montant)}</b> },
      can.annuler && { label: "", render: (r) => !r.annule && <div className="at-actions"><IconBtn title="Contre-écriture" tone="danger" onClick={() => { const m = askMotif(); if (m) run(() => annulerEcriture(r._id, m)); }}><FaBan /></IconBtn></div> },
    ].filter(Boolean),
    paiements: [
      { label: "Date", render: (r) => dateFr(r.date) },
      { label: "Réparateur", render: (r) => <b>{userName(r.reparateur)}</b> },
      { label: "Type", render: (r) => <span className={`badge-modern badge-modern-${r.type === "avance" ? "warning" : "primary"}`}>{r.type === "avance" ? "Avance" : "Paiement"}</span> },
      { label: "Mode", render: (r) => ({ ESPECES: "Espèces", CHEQUE: "Chèque", VIREMENT: "Virement", CARTE: "Carte" }[r.modePaiement] || r.modePaiement) },
      { label: "Réf.", render: (r) => r.reference || "—" },
      { label: "Montant", right: true, render: (r) => <b>{tnd(r.montant)}</b> },
      { label: "Statut", render: (r) => <span title={r.motifAnnulation}><StatutBadge statut={r.statut} /></span> },
      can.annuler && { label: "", render: (r) => r.statut === "validee" && <div className="at-actions"><IconBtn title="Annuler" tone="danger" onClick={() => { const m = askMotif(); if (m) run(() => annulerPaiementReparateur(r._id, m)); }}><FaBan /></IconBtn></div> },
    ].filter(Boolean),
  };

  const today = isoDay();
  const actions = {
    commissions: can.valider && (
      <>
        <button className="btn-modern btn-modern-outline" onClick={async () => {
          const r = await run(() => calculerCommissions(params));
          if (r?.data?.data?.alertes?.length) setMsg({ type: "warning", text: `${r.data.message} — Alertes : ${r.data.data.alertes.slice(0, 5).map((a) => a.message).join(" · ")}${r.data.data.alertes.length > 5 ? " …" : ""}` });
        }}><FaCalculator /> Calculer la période</button>
        <button className="btn-modern btn-modern-success" onClick={() => window.confirm("Valider toutes les commissions calculées de la période ?") && run(() => validerCommissions(params))}><FaCheck /> Valider la période</button>
      </>
    ),
    regles: can.regles && <button className="btn-modern btn-modern-primary" onClick={() => setModal({ type: "regle", data: { cible: "", typeCalcul: "pourcentage", base: "prix_vente", taux: 0, montantFixe: 0, priorite: 0, validFrom: today, reparateur: rep } })}><FaPlus /> Nouvelle règle</button>,
    contrats: can.regles && <button className="btn-modern btn-modern-primary" onClick={() => setModal({ type: "contrat", data: { reparateur: rep, mode: "commission", salaire: 0, periodicite: "mensuelle", validFrom: today } })}><FaPlus /> Nouveau contrat</button>,
    ecritures: can.valider && <button className="btn-modern btn-modern-primary" onClick={() => setModal({ type: "ecriture", data: { reparateur: rep, type: "prime", montant: "", libelle: "", date: today } })}><FaPlus /> Prime / ajustement</button>,
    paiements: can.payer && <button className="btn-modern btn-modern-primary" onClick={() => setModal({ type: "paiement", data: { reparateur: rep, type: "paiement", montant: "", modePaiement: "ESPECES", reference: "", date: today } })}><FaPlus /> Avance / paiement</button>,
  };

  const sumSoldes = (f) => data.reduce((s, r) => s + (f(r) || 0), 0);
  const showPeriode = !["regles", "contrats"].includes(tab);

  return (
    <Page>
      <PageHeader icon={<FaMoneyBillWave />} title="Rémunération des réparateurs" subtitle="Gains bruts = commissions validées + salaires + primes · Solde dû = gains − avances − paiements">
        {actions[tab]}
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {showPeriode ? (
        <PeriodeFilter range={range} onChange={setRange}>
          <div style={{ minWidth: 220 }}>
            <label className="form-label">Réparateur</label>
            <ReparateurSelect reparateurs={reparateurs} value={rep} allLabel="Tous les réparateurs" onChange={setRep} />
          </div>
        </PeriodeFilter>
      ) : (
        <div className="card-modern at-filters">
          <div style={{ minWidth: 260 }}>
            <label className="form-label">Réparateur</label>
            <ReparateurSelect reparateurs={reparateurs} value={rep} allLabel="Tous les réparateurs" onChange={setRep} />
          </div>
        </div>
      )}

      {tab === "soldes" && data.length > 0 && (
        <div className="row g-3 mb-3">
          <div className="col-6 col-lg-3"><Kpi icon={<FaCoins />} tone="primary" label="Gains bruts (période)" value={tnd(sumSoldes((r) => r.periode.gainsBruts))} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaHourglassHalf />} tone="warning" label="Commissions à valider" value={tnd(sumSoldes((r) => r.periode.commissionsEnAttente))} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaWallet />} tone="success" label="Versé (avances + paiements)" value={tnd(sumSoldes((r) => r.periode.avances + r.periode.paiements))} /></div>
          <div className="col-6 col-lg-3"><Kpi icon={<FaMoneyBillWave />} tone="danger" label="Solde dû total" value={tnd(sumSoldes((r) => r.cumul.soldeDu))} /></div>
        </div>
      )}
      {tab === "commissions" && extra && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6 col-lg-4"><Kpi icon={<FaCheckCircle />} tone="success" label="Commissions validées" value={tnd(extra.validee)} /></div>
          <div className="col-12 col-md-6 col-lg-4"><Kpi icon={<FaHourglassHalf />} tone="warning" label="En attente de validation" value={tnd(extra.calculee)} /></div>
        </div>
      )}

      <Table rows={data} cols={COLS[tab]} rowKey={(r, i) => r._id || r.reparateur || i} />

      <FormModal show={!!modal} size="lg" title={modal ? FORMS[modal.type].title : ""} onClose={() => setModal(null)} onSubmit={modal ? FORMS[modal.type].submit : null}>
        {modal && FORMS[modal.type].body()}
      </FormModal>
    </Page>
  );
};

export default Remuneration;
