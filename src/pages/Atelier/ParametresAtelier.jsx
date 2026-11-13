import { useEffect, useState } from "react";
import { FaSlidersH, FaBoxes, FaPercent, FaHistory, FaSave, FaClone, FaFileInvoiceDollar } from "react-icons/fa";
import { getParametresAtelier, updateParametresAtelier } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, Card, Alert, Field } from "../../components/atelier/ui";
import { errMsg, dateFr } from "../../utils/atelier";
import { confirmer, demander } from "../../utils/dialog";
const LABELS = {
  modeStock: { desactive: "Désactivé — dépenses et coûts déclarés", simplifie: "Simplifié — entrées / consommations, solde théorique", detaille: "Détaillé — mouvements, transferts, inventaires" },
  methodeValorisation: { CMP: "Coût moyen pondéré (recommandé)", FIFO: "FIFO — premier entré, premier sorti", MANUEL: "Coût manuel" },
};

const Toggle = ({ id, label, hint, checked, disabled, onChange }) => (
  <div className="form-check form-switch mb-3">
    <input id={id} type="checkbox" role="switch" className="form-check-input" checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <label htmlFor={id} className="form-check-label" style={{ fontSize: 13.5 }}>{label}</label>
    {hint && <div className="at-hint" style={{ fontStyle: "normal" }}>{hint}</div>}
  </div>
);

const ParametresAtelier = () => {
  const { hasPermission, currentBoutique, boutiques, isAdmin, hasModule } = useAuth();
  const canEdit = hasPermission("parametres_atelier");
  // ✅ Admin : appliquer aussi ces paramètres à d'autres boutiques (copie ponctuelle)
  const autres = (boutiques || []).filter((b) => b._id !== currentBoutique?._id);
  const canPropager = canEdit && isAdmin() && autres.length > 0;
  const [cibles, setCibles] = useState([]);
  const [avecModeStock, setAvecModeStock] = useState(false);
  const toggleCible = (id) =>
    setCibles((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const [form, setForm] = useState(null);
  const [initialMode, setInitialMode] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const r = await getParametresAtelier();
      setForm(r.data.data);
      setInitialMode(r.data.data.modeStock);
    } catch (e) { setMsg({ type: "danger", text: errMsg(e) }); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const body = { ...form };
    if (form.modeStock !== initialMode) {
      const motif = await demander({
        title: "Changer le mode de stock",
        message: `De « ${initialMode} » vers « ${form.modeStock} ». Les historiques sont conservés.`,
        label: "Motif", required: false, confirmText: "Changer",
      });
      if (motif === null) return;
      body.confirmationModeStock = true;
      body.motifModeStock = motif;
    }
    if (cibles.length > 0) {
      const noms = autres.filter((b) => cibles.includes(b._id)).map((b) => b.nom).join(", ");
      const ok = await confirmer({ title: "Appliquer à d'autres boutiques", confirmText: "Appliquer", message:
        `Appliquer aussi ces paramètres à : ${noms} ?` +
        (avecModeStock ? `\n⚠️ Le mode de stock « ${form.modeStock} » sera aussi appliqué.` : "\n(Le mode de stock de ces boutiques ne change pas.)") });
      if (!ok) return;
      body.appliquerA = cibles;
      body.appliquerModeStock = avecModeStock;
    }
    setBusy(true);
    try {
      const r = await updateParametresAtelier(body);
      setMsg({ type: "success", text: r?.data?.message || "Paramètres enregistrés" });
      setCibles([]);
      setAvecModeStock(false);
      await load();
    } catch (e) { setMsg({ type: "danger", text: errMsg(e) }); }
    setBusy(false);
  };

  const sel = (k) => (
    <select className="form-control-modern" value={form[k]} disabled={!canEdit} onChange={(e) => set(k, e.target.value)}>
      {Object.entries(LABELS[k]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <Page>
      <PageHeader
        icon={<FaSlidersH />}
        title="Paramètres de l'atelier"
        subtitle={`Propres à la boutique ${currentBoutique?.nom || ""} — sans effet sur les autres boutiques`}
      >
        {canEdit && form && (
          <button className="btn-modern btn-modern-primary" onClick={save} disabled={busy}>
            <FaSave /> {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        )}
      </PageHeader>
      <Alert msg={msg?.text} type={msg?.type} onClose={() => setMsg(null)} />
      {!canEdit && form && <Alert type="info" msg="Lecture seule : la permission « Paramètres de l'atelier » est nécessaire pour modifier." />}

      {form && (
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <Card title="Stock et consommations" icon={<FaBoxes />} className="h-100">
              <div className="row g-3">
                <Field label="Gestion du stock" hint={form.modeStock !== initialMode ? "Le changement de mode sera confirmé à l'enregistrement." : undefined}>{sel("modeStock")}</Field>
                <Field label="Valorisation des pièces">{sel("methodeValorisation")}</Field>
              </div>
            </Card>
          </div>
          <div className="col-12 col-lg-6">
            <Card title="Bases de calcul et rémunération" icon={<FaPercent />} className="h-100">
              <Toggle id="ttc" label="Les prix de réparation sont saisis TTC" checked={form.prixTTC} disabled={!canEdit} onChange={(v) => set("prixTTC", v)}
                hint="Les commissions et marges sont calculées sur le montant HT." />
              <div className="row g-3 mb-3">
                <Field label="Taux de TVA (%)" col="col-6">
                  <input type="number" min="0" max="100" step="0.01" className="form-control-modern" value={form.tauxTVA} disabled={!canEdit} onChange={(e) => set("tauxTVA", e.target.value)} />
                </Field>
              </div>
              <Toggle id="sav" label="Commissions sur les réparations SAV / garantie" checked={form.commissionSurSAV} disabled={!canEdit} onChange={(v) => set("commissionSurSAV", v)}
                hint="Désactivé par défaut pour éviter les doubles commissions." />
              <div className="at-alert at-alert-info mb-0">
                Montants arrondis au millime. Une commission validée conserve la règle appliquée : une modification ultérieure ne la recalcule jamais.
              </div>
            </Card>
          </div>
          {hasModule("commercial") && <div className="col-12">
            <Card title="Documents de vente (devis, factures, avoirs)" icon={<FaFileInvoiceDollar />}>
              <p className="at-hint" style={{ fontStyle: "normal", marginTop: 0 }}>
                En-tête imprimé sur les documents de cette boutique. Les documents déjà validés gardent l'en-tête de leur date de validation.
              </p>
              <div className="row g-3">
                {[
                  ["raisonSociale", "Raison sociale", "col-12 col-md-6"],
                  ["matriculeFiscal", "Matricule fiscal", "col-12 col-md-3"],
                  ["registreCommerce", "Registre de commerce", "col-12 col-md-3"],
                  ["adresse", "Adresse", "col-12 col-md-6"],
                  ["telephone", "Téléphone", "col-6 col-md-3"],
                  ["email", "Email", "col-6 col-md-3"],
                  ["rib", "RIB (affiché sur les factures)", "col-12 col-md-6"],
                  ["piedPage", "Pied de page / mentions", "col-12 col-md-6"],
                ].map(([k, label, col]) => (
                  <Field key={k} label={label} col={col}>
                    <input className="form-control-modern" value={form.commerce?.[k] ?? ""} disabled={!canEdit}
                      onChange={(e) => set("commerce", { ...(form.commerce || {}), [k]: e.target.value })} />
                  </Field>
                ))}
                <div className="col-12">
                  <Toggle id="caisse-obl" label="Caisse obligatoire : refuser les paiements en espèces tant que la caisse n'est pas ouverte"
                    checked={form.commerce?.caisseObligatoire} disabled={!canEdit}
                    onChange={(v) => set("commerce", { ...(form.commerce || {}), caisseObligatoire: v })} />
                </div>
                {[
                  ["timbreFiscal", "Timbre fiscal (TND, factures)", "0.001"],
                  ["validiteDevisJours", "Validité des devis (jours)", "1"],
                  ["delaiPaiementJours", "Délai de paiement (jours)", "1"],
                ].map(([k, label, step]) => (
                  <Field key={k} label={label} col="col-12 col-md-4">
                    <input type="number" min="0" step={step} className="form-control-modern" value={form.commerce?.[k] ?? 0} disabled={!canEdit}
                      onChange={(e) => set("commerce", { ...(form.commerce || {}), [k]: e.target.value })} />
                  </Field>
                ))}
              </div>
            </Card>
          </div>}
          {canPropager && (
            <div className="col-12">
              <Card title="Appliquer aussi à d'autres boutiques" icon={<FaClone />}>
                <p className="at-hint" style={{ fontStyle: "normal", marginTop: 0 }}>
                  Copie ponctuelle à l'enregistrement : chaque boutique garde ensuite ses propres paramètres.
                </p>
                <div className="d-flex flex-wrap gap-3 mb-2">
                  {autres.map((b) => (
                    <div key={b._id} className="form-check">
                      <input id={`cible-${b._id}`} type="checkbox" className="form-check-input"
                        checked={cibles.includes(b._id)} onChange={() => toggleCible(b._id)} />
                      <label htmlFor={`cible-${b._id}`} className="form-check-label" style={{ fontSize: 13.5 }}>
                        {b.nom} <span className="at-chip">{b.code}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {cibles.length > 0 && (
                  <Toggle id="avec-mode" label="Appliquer aussi le mode de stock (changement historisé dans chaque boutique)"
                    checked={avecModeStock} onChange={setAvecModeStock} />
                )}
              </Card>
            </div>
          )}
          {(form.historiqueModeStock || []).length > 0 && (
            <div className="col-12">
              <Card title="Historique des changements de mode de stock" icon={<FaHistory />}>
                <div className="d-flex flex-column gap-2">
                  {form.historiqueModeStock.map((h, i) => (
                    <div key={i} className="at-chip" style={{ alignSelf: "flex-start" }}>
                      {dateFr(h.date)} · <b>{h.ancien}</b> → <b>{h.nouveau}</b>{h.motif ? ` · ${h.motif}` : ""}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </Page>
  );
};

export default ParametresAtelier;
