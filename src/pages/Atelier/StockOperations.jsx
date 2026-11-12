import { useEffect, useState } from "react";
import { FaExchangeAlt, FaClipboardCheck, FaWarehouse, FaSave } from "react-icons/fa";
import { transfertStock, inventaireStock, getParametresAtelier } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { ArticleSelect } from "../../components/atelier/pickers";
import { useArticles } from "../../hooks/useAtelierRefs";
import { Page, PageHeader, Card, Alert, Table, Field } from "../../components/atelier/ui";
import { tnd, errMsg, articleLabel } from "../../utils/atelier";
import { confirmer } from "../../utils/dialog";
/** Stock détaillé : transferts entre boutiques et inventaire. */
const StockOperations = () => {
  const { boutiques, activeBoutique } = useAuth();
  const articles = useArticles();
  const [params, setParams] = useState(null);
  const [tr, setTr] = useState({ stockId: "", boutiqueDestination: "", quantite: 1, motif: "" });
  const [counts, setCounts] = useState({});
  const [msg, setMsg] = useState(null);

  useEffect(() => { getParametresAtelier().then((r) => setParams(r.data.data)).catch((e) => setMsg({ text: errMsg(e) })); }, []);
  const detaille = params?.modeStock === "detaille";
  const autres = (boutiques || []).filter((b) => b._id !== activeBoutique);

  const transfert = async (e) => {
    e.preventDefault();
    try { const r = await transfertStock(tr); setMsg({ type: "success", text: `${r.data.message} (coût unitaire ${tnd(r.data.data.coutUnitaire)})` }); }
    catch (err) { setMsg({ text: errMsg(err) }); }
  };

  const nbSaisis = Object.values(counts).filter((v) => v !== "").length;
  const inventaire = async () => {
    const lignes = Object.entries(counts).filter(([, v]) => v !== "").map(([stockId, v]) => ({ stockId, quantiteComptee: Number(v) }));
    if (!lignes.length) { setMsg({ text: "Saisissez au moins une quantité comptée" }); return; }
    if (!(await confirmer({ title: "Inventaire", message: `Enregistrer l'inventaire de ${lignes.length} article(s) ? Les écarts seront ajustés et tracés.`, confirmText: "Enregistrer" }))) return;
    try {
      const r = await inventaireStock({ lignes, motif: "Inventaire" });
      setCounts({});
      const n = r.data.data.ecarts.filter((x) => x.ecart).length;
      setMsg({ type: "success", text: `Inventaire enregistré — ${n} écart(s), valeur ${tnd(r.data.data.valeurEcarts)}` });
    } catch (err) { setMsg({ text: errMsg(err) }); }
  };

  return (
    <Page>
      <PageHeader icon={<FaWarehouse />} title="Transferts et inventaire" subtitle="Opérations du stock détaillé, tracées et valorisées au coût courant" />
      <Alert msg={msg?.text} type={msg?.type || "danger"} onClose={() => setMsg(null)} />
      {params && !detaille && <Alert type="warning" msg={`Mode de stock de la boutique : « ${params.modeStock} ». Ces opérations nécessitent le mode détaillé (Paramètres de l'atelier).`} />}

      <Card title="Transfert vers une autre boutique" icon={<FaExchangeAlt />} style={{ marginBottom: 16 }}>
        {autres.length === 0 ? (
          <p className="at-muted mb-0">Aucune autre boutique accessible.</p>
        ) : (
          <form className="row g-3 align-items-end" onSubmit={transfert}>
            <Field label="Article" col="col-12 col-lg-5"><ArticleSelect articles={articles} required value={tr.stockId} onChange={(v) => setTr({ ...tr, stockId: v })} /></Field>
            <Field label="Boutique de destination" col="col-12 col-md-6 col-lg-3">
              <select required className="form-control-modern" value={tr.boutiqueDestination} onChange={(e) => setTr({ ...tr, boutiqueDestination: e.target.value })}>
                <option value="">— Choisir —</option>
                {autres.map((b) => <option key={b._id} value={b._id}>{b.nom}</option>)}
              </select>
            </Field>
            <Field label="Quantité" col="col-6 col-md-3 col-lg-2"><input type="number" min="1" step="1" className="form-control-modern" value={tr.quantite} onChange={(e) => setTr({ ...tr, quantite: e.target.value })} /></Field>
            <div className="col-6 col-md-3 col-lg-2"><button className="btn-modern btn-modern-primary w-100 justify-content-center" disabled={!detaille}><FaExchangeAlt /> Transférer</button></div>
          </form>
        )}
      </Card>

      <Card
        title="Inventaire"
        icon={<FaClipboardCheck />}
        actions={<button className="btn-modern btn-modern-primary" disabled={!detaille || !nbSaisis} onClick={inventaire}><FaSave /> Enregistrer ({nbSaisis})</button>}
      >
        <p className="at-muted">Saisissez la quantité comptée ; laissez vide les articles non inventoriés.</p>
        <Table
          rows={articles}
          empty="Aucun article en stock"
          cols={[
            { label: "Article", render: (a) => articleLabel(a) },
            { label: "Stock théorique", right: true, render: (a) => <b>{a.quantite}</b> },
            { label: "CMP", right: true, render: (a) => tnd(a.cmp) },
            { label: "Quantité comptée", right: true, render: (a) => {
              const v = counts[a._id] ?? "";
              const ecart = v === "" ? null : Number(v) - a.quantite;
              return (
                <div className="d-flex gap-2 justify-content-end align-items-center">
                  {ecart !== null && ecart !== 0 && <span className={`badge-modern badge-modern-${ecart > 0 ? "success" : "danger"}`}>{ecart > 0 ? `+${ecart}` : ecart}</span>}
                  <input type="number" min="0" step="1" style={{ width: 100 }} className="form-control-modern" disabled={!detaille}
                    value={v} onChange={(e) => setCounts({ ...counts, [a._id]: e.target.value })} />
                </div>
              );
            } },
          ]}
        />
      </Card>
    </Page>
  );
};

export default StockOperations;
