import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaChevronDown, FaChevronRight } from "react-icons/fa";
import { createStock, updateStock } from "../../api/stock";
import { createTypeArticle } from "../../api/typeArticles";
import { getParametresAtelier } from "../../api/atelier";
import { FormModal, Field, Alert } from "../../components/atelier/ui";
import { tnd, errMsg, nomArticle } from "../../utils/atelier";
import TvaInput from "../../components/common/TvaInput";
import { versTTC, versHT } from "../../utils/tva";

// ============================================================
// ✅ Fiche « produit de vente » (espace Commerce) — formulaire SIMPLE
// L'essentiel : désignation, type, code-barres, prix d'achat / de vente, TVA,
// quantité initiale. Le reste (classement famille → modèle, unité, seuil,
// usage « les deux »…) est replié dans « Plus d'options ».
// Sans catégorie choisie, le serveur range le produit dans « Produits ».
// Le prix de vente est enregistré dans la base de saisie de la boutique
// (TTC ou HT, paramètre « prix saisis TTC »).
// ============================================================
const r3 = (v) => Math.round((Number(v) || 0) * 1000) / 1000;
const idOf = (x) => (x && typeof x === "object" ? x._id : x) || "";

const ProduitForm = ({ stock, referentiels, onClose, onSaved, codeInitial = "" }) => {
  const isEdit = !!stock;
  const [params, setParams] = useState(null);
  const [types, setTypes] = useState(referentiels.typesArticle || []);
  const [nouveauType, setNouveauType] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const categorieInit = referentiels.categories.find((c) => c._id === idOf(stock?.categorie));
  const [options, setOptions] = useState(false);
  const [f, setF] = useState({
    // Ancien produit sans désignation : on part de son nom actuel (Type + Marque + Modèle)
    designation: stock ? nomArticle(stock) : "",
    famille: categorieInit ? idOf(categorieInit.famille) : "",
    categorie: idOf(stock?.categorie),
    typeArticle: idOf(stock?.typeArticle),
    objet: idOf(stock?.objet),
    marque: idOf(stock?.marque),
    modele: idOf(stock?.modele),
    code: stock?.code || String(codeInitial || "").toUpperCase(),
    unite: stock?.unite || "pièce",
    usage: stock?.usage === "mixte" ? "mixte" : "vente",
    tauxTVA: stock?.tauxTVA ?? "",
    prixAchat: "",
    prixAchatTTC: "",
    prixReparation: stock?.prixIndicatif ?? "",
    puHT: "",
    puTTC: "",
    quantite: "",
    seuilAlerte: stock?.seuilAlerte ?? 2,
    observation: stock?.observation || "",
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    getParametresAtelier().then((r) => {
      const p = r.data.data;
      setParams(p);
      if (!stock) setF((x) => (x.tauxTVA === "" ? { ...x, tauxTVA: String(p.tauxTVA ?? 19) } : x));
      // Prix de vente existant (anciens articles : prix unique) : converti dans les deux bases
      if (stock) {
        const t = Number(stock.tauxTVA ?? p.tauxTVA ?? 0);
        const prix = Number(stock.prixVente ?? stock.prixIndicatif ?? 0);
        setF((x) => (p.prixTTC === false
          ? { ...x, puHT: prix, puTTC: r3(prix * (1 + t / 100)) }
          : { ...x, puTTC: prix, puHT: r3(prix / (1 + t / 100)) }));
      }
    }).catch((e) => setErr(errMsg(e)));
  }, [stock]);

  const tva = f.tauxTVA === "" ? Number(params?.tauxTVA ?? 19) : Number(f.tauxTVA);
  const setHT = (v) => setF((x) => ({ ...x, puHT: v, puTTC: v === "" ? "" : r3(Number(v) * (1 + tva / 100)) }));
  const setTTC = (v) => setF((x) => ({ ...x, puTTC: v, puHT: v === "" ? "" : r3(Number(v) / (1 + tva / 100)) }));
  const setTVA = (v) => setF((x) => {
    const t = v === "" ? Number(params?.tauxTVA ?? 19) : Number(v);
    return { ...x, tauxTVA: v, puTTC: x.puHT === "" ? x.puTTC : r3(Number(x.puHT) * (1 + t / 100)), prixAchatTTC: versTTC(x.prixAchat, t) };
  });
  const setAchatHT = (v) => setF((x) => ({ ...x, prixAchat: v, prixAchatTTC: versTTC(v, tva) }));
  const setAchatTTC = (v) => setF((x) => ({ ...x, prixAchatTTC: v, prixAchat: versHT(v, tva) }));
  const tvaFigee = !!stock?.tvaVerrouillee;
  const ttcDe = (ht) => (ht === null || ht === undefined ? null : r3(Number(ht) * (1 + tva / 100)));

  // Cascade famille → catégories ; objet → marques ; marque → modèles
  const categories = useMemo(() => (f.famille
    ? referentiels.categories.filter((c) => idOf(c.famille) === f.famille)
    : referentiels.categories), [referentiels.categories, f.famille]);
  const marques = useMemo(() => (f.objet
    ? referentiels.marques.filter((m) => !m.objet || idOf(m.objet) === f.objet)
    : referentiels.marques), [referentiels.marques, f.objet]);
  const modeles = useMemo(() => (f.marque
    ? referentiels.modeles.filter((m) => !m.marque || idOf(m.marque) === f.marque)
    : referentiels.modeles), [referentiels.modeles, f.marque]);

  // Marge (sur le HT) : coût = CMP (fiche existante) ou prix d'achat saisi
  const cout = isEdit ? (stock.cmp ?? stock.dernierCoutAchat ?? null) : (f.prixAchat === "" ? null : Number(f.prixAchat));
  const ht = f.puHT === "" ? null : Number(f.puHT);
  const marge = cout !== null && ht !== null ? r3(ht - cout) : null;
  const tauxMarque = marge !== null && ht ? Math.round((marge / ht) * 1000) / 10 : null;

  const creerType = async () => {
    const nom = String(nouveauType || "").trim();
    if (!nom) return;
    try {
      const r = await createTypeArticle(nom);
      const t = r.data.data;
      setTypes((l) => (l.some((x) => x._id === t._id) ? l : [...l, t]));
      set("typeArticle", t._id);
      setNouveauType(null);
    } catch (e) { setErr(errMsg(e)); }
  };

  const save = async () => {
    if (!f.designation.trim()) { setErr("La désignation est obligatoire (ex. : Chargeur Samsung 25W)"); return; }
    if (!f.typeArticle) { setErr("Le type de produit est obligatoire"); return; }
    if (f.puHT === "" && f.puTTC === "") { setErr("Le prix de vente est obligatoire"); return; }
    setBusy(true); setErr(null);
    try {
      const prixVente = params?.prixTTC === false ? Number(f.puHT) : Number(f.puTTC);
      const commun = {
        designation: f.designation.trim(),
        code: f.code || null, unite: f.unite || "pièce", usage: f.usage, commissionActive: false,
        ...(tvaFigee ? {} : { tauxTVA: f.tauxTVA === "" ? null : Number(f.tauxTVA) }),
        prixVente,
        // Prix de réparation (indicatif) : seulement pour un produit aussi utilisé en réparation
        ...(f.usage === "mixte" ? { prixIndicatif: Number(f.prixReparation) || 0 } : {}),
        seuilAlerte: Number(f.seuilAlerte) || 0, observation: f.observation,
      };
      let r;
      if (isEdit) {
        r = await updateStock(stock._id, commun);
      } else {
        r = await createStock({
          ...commun,
          // Catégorie facultative : « Produits » par défaut (côté serveur)
          categorie: f.categorie || null, typeArticle: f.typeArticle, objet: f.objet || null, marque: f.marque || null, modele: f.modele || null,
          quantite: Number(f.quantite) || 0,
          ...(f.prixAchat !== "" ? { coutUnitaire: Number(f.prixAchat) } : {}),
        });
      }
      onSaved(r?.data?.data || null);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };

  const sel = (k, list, placeholder, disabled) => (
    <select className="form-control-modern" value={f[k]} disabled={disabled} onChange={(e) => set(k, e.target.value)}>
      <option value="">{placeholder}</option>
      {list.map((x) => <option key={x._id} value={x._id}>{x.nom}</option>)}
    </select>
  );

  return (
    <FormModal show size="lg" title={isEdit ? "Modifier le produit" : "Nouveau produit"} onClose={onClose} onSubmit={save} busy={busy}>
      <Alert msg={err} onClose={() => setErr(null)} />

      <div className="row g-3 mb-3">
        <Field label="Désignation *" col="col-12 col-md-7" hint="Le nom qui apparaît sur le ticket et la facture">
          <input className="form-control-modern" autoFocus={!isEdit} placeholder="Ex. : Chargeur Samsung 25W" value={f.designation} onChange={(e) => set("designation", e.target.value)} />
        </Field>
        <Field label="Type *" col="col-12 col-md-5" hint="Ex. : Coque, Chargeur, Câble…">
          {nouveauType === null ? (
            <div className="d-flex gap-2">
              {sel("typeArticle", types, "— Type —", isEdit)}
              {!isEdit && <button type="button" className="btn-modern btn-modern-outline btn-sm" title="Nouveau type" onClick={() => setNouveauType("")}><FaPlus /></button>}
            </div>
          ) : (
            <div className="d-flex gap-2">
              <input className="form-control-modern" autoFocus placeholder="Nom du type" value={nouveauType} onChange={(e) => setNouveauType(e.target.value)} />
              <button type="button" className="btn-modern btn-modern-primary btn-sm" onClick={creerType}>OK</button>
              <button type="button" className="btn-modern btn-modern-outline btn-sm" onClick={() => setNouveauType(null)}>×</button>
            </div>
          )}
        </Field>
        <Field label="Code / code-barres" col="col-12 col-md-5" hint="Facultatif : scannez le code-barres">
          <input className="form-control-modern" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} />
        </Field>
        <Field label="TVA %" col="col-6 col-md-3" hint={tvaFigee ? "Figée : le produit a déjà eu des mouvements" : undefined}>
          <TvaInput value={f.tauxTVA} onChange={setTVA} taux={params?.tauxTVAAutorises} locked={tvaFigee} />
        </Field>
        {isEdit ? (
          <Field label="En stock" col="col-6 col-md-4" hint="Ajustez depuis la liste ou par un achat">
            <input className="form-control-modern" disabled value={stock.quantite} />
          </Field>
        ) : (
          <Field label="Quantité initiale" col="col-6 col-md-4">
            <input type="number" min="0" step="1" className="form-control-modern" placeholder="0" value={f.quantite} onChange={(e) => set("quantite", e.target.value)} />
          </Field>
        )}
      </div>

      <div className="at-card-title">Prix</div>
      <div className="row g-3 mb-2">
        {isEdit ? (
          <Field label="Coût moyen (CMP) HT / TTC" col="col-12 col-md-6" hint="Mis à jour par les entrées en stock et factures d'achat">
            <input className="form-control-modern" disabled value={stock.cmp !== null && stock.cmp !== undefined ? `${tnd(stock.cmp)} / ${tnd(ttcDe(stock.cmp))}` : "non valorisé"} />
          </Field>
        ) : (
          <>
            <Field label="Prix d'achat HT" col="col-6 col-md-3">
              <input type="number" min="0" step="0.001" className="form-control-modern" value={f.prixAchat} onChange={(e) => setAchatHT(e.target.value)} />
            </Field>
            <Field label="Prix d'achat TTC" col="col-6 col-md-3">
              <input type="number" min="0" step="0.001" className="form-control-modern" value={f.prixAchatTTC} onChange={(e) => setAchatTTC(e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Prix de vente HT" col="col-6 col-md-3">
          <input type="number" min="0" step="0.001" className="form-control-modern" value={f.puHT} onChange={(e) => setHT(e.target.value)} />
        </Field>
        <Field label="Prix de vente TTC *" col="col-6 col-md-3">
          <input type="number" min="0" step="0.001" className="form-control-modern" value={f.puTTC} onChange={(e) => setTTC(e.target.value)} />
        </Field>
      </div>
      <div className="at-muted mb-3" style={{ fontSize: 12.5 }}>
        Marge unitaire HT : <b style={{ color: marge !== null && marge < 0 ? "#ef4444" : undefined }}>{marge !== null ? tnd(marge) : "—"}</b>
        {tauxMarque !== null ? ` (${tauxMarque} %)` : ""}
        {" · "}Prix enregistré en {params?.prixTTC === false ? "HT" : "TTC"}, modifiable au moment de la vente.
      </div>

      {/* ✅ Le détail, seulement si on en a besoin */}
      <button type="button" className="btn-modern btn-modern-outline btn-sm mb-3" onClick={() => setOptions((o) => !o)}>
        {options ? <FaChevronDown /> : <FaChevronRight />} Plus d'options (classement, seuil, usage…)
      </button>
      {options && (
        <>
          <div className="row g-3 mb-3">
            <Field label="Usage" col="col-12 col-md-4">
              <select className="form-control-modern" value={f.usage} onChange={(e) => set("usage", e.target.value)}>
                <option value="vente">🛒 Produit de vente</option>
                <option value="mixte">🔁 Vente + réparation</option>
              </select>
            </Field>
            {f.usage === "mixte" && (
              <Field label="Prix de réparation (indicatif) TTC" col="col-12 col-md-4">
                <input type="number" min="0" step="0.001" className="form-control-modern" value={f.prixReparation} onChange={(e) => set("prixReparation", e.target.value)} />
              </Field>
            )}
            <Field label="Unité" col="col-6 col-md-2"><input className="form-control-modern" value={f.unite} onChange={(e) => set("unite", e.target.value)} /></Field>
            <Field label="Seuil d'alerte" col="col-6 col-md-2">
              <input type="number" min="0" step="1" className="form-control-modern" value={f.seuilAlerte} onChange={(e) => set("seuilAlerte", e.target.value)} />
            </Field>
          </div>
          <div className="row g-3 mb-3">
            <Field label="Famille" col="col-12 col-md-4">
              <select className="form-control-modern" value={f.famille} disabled={isEdit}
                onChange={(e) => setF((x) => ({ ...x, famille: e.target.value, categorie: "" }))}>
                <option value="">Toutes les familles</option>
                {(referentiels.familles || []).map((x) => <option key={x._id} value={x._id}>{x.nom}</option>)}
              </select>
            </Field>
            <Field label="Catégorie" col="col-12 col-md-4" hint={!isEdit ? "Vide : « Produits »" : undefined}>{sel("categorie", categories, "— Produits (par défaut) —", isEdit)}</Field>
            <Field label="Objet (appareil)" col="col-12 col-md-4">{sel("objet", referentiels.objets, "— Aucun —", isEdit)}</Field>
            <Field label="Marque" col="col-12 col-md-4">{sel("marque", marques, "— Aucune —", isEdit)}</Field>
            <Field label="Modèle" col="col-12 col-md-4">{sel("modele", modeles, "— Aucun —", isEdit)}</Field>
            <Field label="Observation" col="col-12 col-md-4"><input className="form-control-modern" value={f.observation} onChange={(e) => set("observation", e.target.value)} /></Field>
          </div>
          {isEdit && <div className="at-hint mb-3" style={{ fontStyle: "normal" }}>Le classement d'un produit existant n'est pas modifiable (historique du stock).</div>}
        </>
      )}
    </FormModal>
  );
};

export default ProduitForm;
