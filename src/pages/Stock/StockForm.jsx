import { useState, useEffect, useMemo, useRef } from "react";
import {
  FaTimes, FaPlus, FaTag, FaBox, FaCheck, FaBan, FaSave,
} from "react-icons/fa";
import { createStock, updateStock } from "../../api/stock";
import { createTypeArticle } from "../../api/typeArticles";
import SearchSelect from "../../components/reparations/SearchSelect";

const getDraftKey = (stockId) =>
  stockId ? `stock_draft_edit_${stockId}` : "stock_draft_new";

const StockForm = ({ stock, referentiels, onClose, onSaved }) => {
  const isEdit = !!stock;
  const draftKey = getDraftKey(stock?._id);

  const [form, setForm] = useState({
    categorie: stock?.categorie?._id || stock?.categorie || "",
    objet: stock?.objet?._id || stock?.objet || "",
    typeArticle: stock?.typeArticle?._id || stock?.typeArticle || "",
    marque: stock?.marque?._id || stock?.marque || "",
    modele: stock?.modele?._id || stock?.modele || "",
    quantite: stock?.quantite ?? 0,
    seuilAlerte: stock?.seuilAlerte ?? 2,
    prixIndicatif: stock?.prixIndicatif ?? 0,
    observation: stock?.observation || "",
    // ✅ Fiche article (module atelier)
    code: stock?.code || "",
    unite: stock?.unite || "pièce",
    coutManuel: stock?.coutManuel ?? "",
    coutUnitaire: "",
    commissionActive: stock?.commissionActive !== false,
  });

  const [typesArticle, setTypesArticle] = useState(referentiels.typesArticle || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeNom, setNewTypeNom] = useState("");
  const [creatingType, setCreatingType] = useState(false);

  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  const firstLoadRef = useRef(true);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setTypesArticle(referentiels.typesArticle || []);
  }, [referentiels.typesArticle]);

  // ============================================================
  // ✅ Helpers brouillon
  // ============================================================
  const saveDraft = () => {
    if (isEdit) return;
    const f = formRef.current;
    const hasContent =
      !!f.categorie || !!f.typeArticle || !!f.objet || !!f.marque ||
      !!f.modele || Number(f.quantite) > 0 || !!f.observation ||
      Number(f.seuilAlerte) !== 2 || Number(f.prixIndicatif) > 0;
    if (!hasContent) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(f));
    } catch { /* ignore */ }
  };

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraft(false);
  };

  // ============================================================
  // ✅ Restauration brouillon au premier chargement
  // ============================================================
  useEffect(() => {
    if (!firstLoadRef.current) return;
    firstLoadRef.current = false;
    if (isEdit) return;

    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft) return;

      const hasSomething =
        !!draft.categorie || !!draft.typeArticle || !!draft.objet ||
        !!draft.marque || !!draft.modele || Number(draft.quantite) > 0 ||
        !!draft.observation;

      if (hasSomething) {
        setForm((prev) => ({ ...prev, ...draft }));
        setHasDraft(true);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line
  }, []);

  // ============================================================
  // ✅ Auto-save brouillon
  // ============================================================
  useEffect(() => {
    if (isEdit) return;
    const t = setTimeout(() => saveDraft(), 800);
    return () => clearTimeout(t);
  }, [form, isEdit]);

  const handleClose = () => {
    if (!isEdit && !saving) saveDraft();
    onClose();
  };

  // ============================================================
  // Filtrage en cascade
  // ============================================================
  const marquesFiltrees = useMemo(() => {
    if (!form.objet) return referentiels.marques;
    return referentiels.marques.filter(
      (m) => String(m.objet) === String(form.objet) || !m.objet
    );
  }, [referentiels.marques, form.objet]);

  const modelesFiltres = useMemo(() => {
    if (!form.marque) return referentiels.modeles;
    return referentiels.modeles.filter(
      (m) => String(m.marque) === String(form.marque) || !m.marque
    );
  }, [referentiels.modeles, form.marque]);

  useEffect(() => {
    if (form.marque && !marquesFiltrees.some((m) => String(m._id) === String(form.marque))) {
      set("marque", "");
      set("modele", "");
    }
    // eslint-disable-next-line
  }, [form.objet]);

  useEffect(() => {
    if (form.modele && !modelesFiltres.some((m) => String(m._id) === String(form.modele))) {
      set("modele", "");
    }
    // eslint-disable-next-line
  }, [form.marque]);

  // ============================================================
  // Création type à la volée
  // ============================================================
  const handleCreateType = async () => {
    const nom = newTypeNom.trim();
    if (!nom) return;

    try {
      setCreatingType(true);
      const res = await createTypeArticle(nom);
      const newType = res.data.data;

      setTypesArticle((prev) => {
        if (prev.some((t) => String(t._id) === String(newType._id))) return prev;
        return [...prev, newType];
      });

      set("typeArticle", newType._id);
      setNewTypeNom("");
      setShowAddType(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur création type");
    } finally {
      setCreatingType(false);
    }
  };

  const cancelAddType = () => {
    setShowAddType(false);
    setNewTypeNom("");
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.categorie) return setError("La catégorie est obligatoire");
    if (!form.typeArticle) return setError("Le type d'article est obligatoire");
    if (Number(form.quantite) < 0) return setError("La quantité ne peut pas être négative");

    try {
      setSaving(true);
      const payload = {
        categorie: form.categorie,
        objet: form.objet || null,
        typeArticle: form.typeArticle,
        marque: form.marque || null,
        modele: form.modele || null,
        quantite: Number(form.quantite),
        seuilAlerte: Number(form.seuilAlerte),
        prixIndicatif: Number(form.prixIndicatif),
        observation: form.observation,
        code: form.code || null,
        unite: form.unite || "pièce",
        coutManuel: form.coutManuel === "" ? null : Number(form.coutManuel),
        commissionActive: !!form.commissionActive,
        ...(!isEdit && form.coutUnitaire !== "" ? { coutUnitaire: Number(form.coutUnitaire) } : {}),
      };

      if (isEdit) {
        await updateStock(stock._id, payload);
      } else {
        await createStock(payload);
        clearDraft();
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "12px",
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "96vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          overflow: "hidden",   // ✅ scroll interne géré par <form>
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 26px",
            background:
              "linear-gradient(135deg, rgba(67,97,238,0.06) 0%, rgba(67,97,238,0.02) 100%)",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexShrink: 0,
            borderRadius: "20px 20px 0 0",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4361ee, #3a52c9)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "17px",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(67,97,238,0.35)",
            }}
          >
            📦
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "var(--gray-900)" }}>
              {isEdit ? "Modifier la ligne de stock" : "Nouvelle ligne de stock"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "3px 0 0" }}>
              {isEdit
                ? "Seuls la quantité, le seuil et le prix sont modifiables"
                : "Remplissez les informations de la pièce à ajouter au stock"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            title="Fermer"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              border: "none",
              background: "white",
              color: "var(--gray-500)",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = "var(--danger-light)";
                e.currentTarget.style.color = "var(--danger)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "var(--gray-500)";
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleSubmit}
          className="stock-form-body"
          style={{
            padding: "20px 26px",
            flex: 1,
            overflowY: "auto",   // ✅ scroll interne
            WebkitOverflowScrolling: "touch",
          }}
        >
          {hasDraft && !isEdit && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--warning-light)",
                color: "var(--warning)",
                borderRadius: "10px",
                marginBottom: "16px",
                fontSize: "12px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span>📝 Brouillon récupéré</span>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setForm({
                    categorie: "", objet: "", typeArticle: "", marque: "",
                    modele: "", quantite: 0, seuilAlerte: 2,
                    prixIndicatif: 0, observation: "",
                    code: "", unite: "pièce", coutManuel: "", coutUnitaire: "", commissionActive: true,
                  });
                }}
                style={{
                  background: "white", border: "none", color: "var(--warning)",
                  fontSize: "11px", fontWeight: "600", cursor: "pointer",
                  padding: "4px 10px", borderRadius: "6px",
                }}
              >
                Effacer
              </button>
            </div>
          )}

          <style>{`
            .stock-form-2col .form-control-modern {
              width: 100% !important;
              padding: 9px 13px !important;
              border: 1px solid var(--gray-300) !important;
              border-radius: 10px !important;
              font-size: 13.5px !important;
              outline: none !important;
              box-sizing: border-box !important;
              background: white !important;
              transition: all 150ms ease !important;
              height: auto !important;
              min-height: 40px !important;
              line-height: 1.4 !important;
              color: var(--gray-800) !important;
            }
            .stock-form-2col .form-control-modern:focus {
              border-color: var(--primary) !important;
              box-shadow: 0 0 0 3px var(--primary-light) !important;
            }
            .stock-form-2col .form-control-modern::placeholder {
              color: var(--gray-400) !important;
            }
            .stock-form-2col .form-control-modern:disabled {
              background: var(--gray-50) !important;
              cursor: not-allowed !important;
              opacity: 0.7 !important;
            }
          `}</style>

          <div
            className="stock-form-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            {/* ============ GAUCHE : IDENTIFICATION ============ */}
            <div>
              <SectionHeader
                icon={<FaTag size={11} />}
                title="Identification de la pièce"
                subtitle="Catégorie, type, objet et modèle"
              />

              <Field label="Catégorie" required>
                <SearchSelect
                  options={referentiels.categories.map((c) => ({ value: c._id, label: c.nom }))}
                  value={form.categorie}
                  onChange={(val) => set("categorie", val)}
                  placeholder="Rechercher une catégorie..."
                  disabled={isEdit}
                />
              </Field>

              <div style={{ marginBottom: "16px" }}>
                <FieldLabel required>Type d'article</FieldLabel>

                {!showAddType ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <SearchSelect
                        options={typesArticle.map((t) => ({ value: t._id, label: t.nom }))}
                        value={form.typeArticle}
                        onChange={(val) => set("typeArticle", val)}
                        placeholder="Rechercher un type..."
                        disabled={isEdit}
                      />
                    </div>
                    {!isEdit && (
                      <button
                        type="button"
                        onClick={() => setShowAddType(true)}
                        title="Créer un nouveau type d'article"
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(67,97,238,0.3)",
                        }}
                      >
                        <FaPlus size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "6px", alignItems: "stretch", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      value={newTypeNom}
                      onChange={(e) => setNewTypeNom(e.target.value)}
                      placeholder="Ex: Écran OLED..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateType();
                        } else if (e.key === "Escape") {
                          cancelAddType();
                        }
                      }}
                      style={{
                        flex: "1 1 150px",
                        minWidth: 0,
                        padding: "9px 13px",
                        border: "1.5px solid var(--primary)",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        outline: "none",
                        background: "var(--primary-light)",
                        minHeight: "40px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCreateType}
                      disabled={creatingType || !newTypeNom.trim()}
                      title="Créer ce type"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "var(--success)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: creatingType || !newTypeNom.trim() ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        opacity: creatingType || !newTypeNom.trim() ? 0.5 : 1,
                      }}
                    >
                      {creatingType ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : (
                        <FaCheck size={13} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAddType}
                      title="Annuler"
                      style={{
                        width: "40px",
                        height: "40px",
                        background: "white",
                        color: "var(--danger)",
                        border: "1.5px solid var(--danger)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <FaBan size={13} />
                    </button>
                  </div>
                )}
              </div>

              <Field label="Objet">
                <SearchSelect
                  options={referentiels.objets.map((o) => ({ value: o._id, label: o.nom }))}
                  value={form.objet}
                  onChange={(val) => set("objet", val)}
                  placeholder="Rechercher un objet..."
                  disabled={isEdit}
                />
              </Field>

              <Field label="Marque">
                <SearchSelect
                  options={marquesFiltrees.map((m) => ({ value: m._id, label: m.nom }))}
                  value={form.marque}
                  onChange={(val) => {
                    set("marque", val);
                    set("modele", "");
                  }}
                  placeholder="Rechercher une marque..."
                  disabled={isEdit}
                />
              </Field>

              <Field label="Modèle">
                <SearchSelect
                  options={modelesFiltres.map((m) => ({ value: m._id, label: m.nom }))}
                  value={form.modele}
                  onChange={(val) => set("modele", val)}
                  placeholder={form.marque ? "Rechercher un modèle..." : "Choisir une marque d'abord"}
                  disabled={isEdit || !form.marque}
                />
              </Field>

              {isEdit && (
                <InfoBanner>
                  ℹ️ Catégorie / Objet / Type / Marque / Modèle ne sont pas modifiables.
                  Supprimez la ligne et recréez si besoin.
                </InfoBanner>
              )}
            </div>

            {/* ============ DROITE : STOCK ============ */}
            <div>
              <SectionHeader
                icon={<FaBox size={11} />}
                title="Stock & Valorisation"
                subtitle="Quantité et prix indicatif"
              />

              <Field label={isEdit ? "Nouvelle quantité" : "Quantité initiale"} required={!isEdit}>
                <input
                  type="number"
                  min="0"
                  value={form.quantite}
                  onChange={(e) => set("quantite", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => applyFocus(e, true)}
                  onBlur={(e) => applyFocus(e, false)}
                />
              </Field>

              <div
                className="stock-form-2col-sub"
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}
              >
                <div>
                  <FieldLabel>Seuil d'alerte</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={form.seuilAlerte}
                    onChange={(e) => set("seuilAlerte", e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => applyFocus(e, true)}
                    onBlur={(e) => applyFocus(e, false)}
                  />
                  <div style={hintStyle}>Alerte si quantité ≤ seuil</div>
                </div>

                <div>
                  <FieldLabel>Prix de réparation</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.prixIndicatif}
                      onChange={(e) => set("prixIndicatif", e.target.value)}
                      style={{ ...inputStyle, paddingRight: "45px" }}
                      onFocus={(e) => applyFocus(e, true)}
                      onBlur={(e) => applyFocus(e, false)}
                    />
                    <span
                      style={{
                        position: "absolute", right: "12px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "12px",
                        fontWeight: "700", color: "var(--gray-400)",
                        pointerEvents: "none",
                      }}
                    >
                      DT
                    </span>
                  </div>
                  <div style={hintStyle}>Prix de réparation estimé (sert de prix de vente pour les commissions)</div>
                </div>
              </div>

              {/* ✅ Fiche article : code, unité, coûts, commission */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <FieldLabel>Code article</FieldLabel>
                  <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} style={inputStyle} placeholder="ex : AFF-IP11" />
                </div>
                <div>
                  <FieldLabel>Unité</FieldLabel>
                  <input value={form.unite} onChange={(e) => set("unite", e.target.value)} style={inputStyle} />
                </div>
                {!isEdit && (
                  <div>
                    <FieldLabel>Coût d'achat unitaire initial</FieldLabel>
                    <input type="number" min="0" step="0.001" value={form.coutUnitaire} onChange={(e) => set("coutUnitaire", e.target.value)} style={inputStyle} />
                    <div style={hintStyle}>Valorise la quantité initiale (CMP)</div>
                  </div>
                )}
                {isEdit && (
                  <div>
                    <FieldLabel>Coût moyen (CMP)</FieldLabel>
                    <input value={stock?.cmp != null ? `${Number(stock.cmp).toFixed(3)} DT` : "non valorisé"} disabled style={inputStyle} />
                    <div style={hintStyle}>Mis à jour par les factures d'achat validées</div>
                  </div>
                )}
                <div>
                  <FieldLabel>Coût manuel</FieldLabel>
                  <input type="number" min="0" step="0.001" value={form.coutManuel} onChange={(e) => set("coutManuel", e.target.value)} style={inputStyle} />
                  <div style={hintStyle}>Utilisé en valorisation « coût manuel »</div>
                </div>
              </div>
              <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "13px", marginBottom: "16px" }}>
                <input type="checkbox" checked={form.commissionActive} onChange={(e) => set("commissionActive", e.target.checked)} />
                Cet article peut générer une commission
              </label>

              <Field label="Observation">
                <textarea
                  value={form.observation}
                  onChange={(e) => set("observation", e.target.value)}
                  style={{
                    ...inputStyle,
                    minHeight: "80px",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                  placeholder="Remarques éventuelles (fournisseur, état, lot...)"
                  onFocus={(e) => applyFocus(e, true)}
                  onBlur={(e) => applyFocus(e, false)}
                />
              </Field>

              {error && (
                <div
                  style={{
                    color: "var(--danger)",
                    fontSize: "13px",
                    marginTop: "12px",
                    padding: "12px 14px",
                    background: "var(--danger-light)",
                    borderRadius: "10px",
                    fontWeight: "500",
                    border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* FOOTER — Bouton "Enregistrer" uniquement */}
        <div
          style={{
            padding: "14px 26px",
            background: "var(--gray-50)",
            borderTop: "1px solid var(--gray-200)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            flexShrink: 0,
            borderRadius: "0 0 20px 20px",
          }}
        >
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "11px 26px",
              background: saving ? "var(--gray-400)" : "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "13.5px",
              fontWeight: "600",
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: saving ? "none" : "0 2px 10px rgba(67,97,238,0.35)",
              transition: "all 150ms ease",
              minWidth: "140px",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(67,97,238,0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 10px rgba(67,97,238,0.35)";
              }
            }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Enregistrement...
              </>
            ) : (
              <>
                <FaSave size={12} />
                Enregistrer
              </>
            )}
          </button>
        </div>

        {/* ✅ RESPONSIVE STYLES */}
        <style>{`
          @media (max-width: 992px) {
            .stock-form-2col {
              grid-template-columns: 1fr !important;
              gap: 20px !important;
            }
          }

          @media (max-width: 640px) {
            .stock-form-body {
              padding: 16px 14px !important;
            }
            .stock-form-2col-sub {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
            /* Header plus compact */
            .stock-form-header {
              padding: 14px 16px !important;
            }
            .stock-form-header h2 {
              font-size: 15px !important;
            }
            .stock-form-header p {
              font-size: 11px !important;
            }
            /* Footer compact */
            .stock-form-footer {
              padding: 12px 14px !important;
            }
          }

          /* Très petits écrans */
          @media (max-width: 380px) {
            .stock-form-body {
              padding: 12px 10px !important;
            }
            .stock-form-header {
              padding: 12px 12px !important;
            }
            .stock-form-footer {
              padding: 10px 12px !important;
            }
            .stock-form-footer button {
              width: 100% !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================
// Sous-composants
// ============================================================
const SectionHeader = ({ icon, title, subtitle }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      paddingBottom: "12px",
      marginBottom: "18px",
      borderBottom: "2px solid var(--gray-100)",
    }}
  >
    <div
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "8px",
        background: "var(--primary-light)",
        color: "var(--primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: "12.5px",
          fontWeight: "700",
          color: "var(--gray-800)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: "11px", color: "var(--gray-500)", marginTop: "1px" }}>
          {subtitle}
        </div>
      )}
    </div>
  </div>
);

const FieldLabel = ({ children, required }) => (
  <label
    style={{
      display: "block",
      fontSize: "11.5px",
      fontWeight: "600",
      color: "var(--gray-700)",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    }}
  >
    {children}
    {required && <span style={{ color: "var(--danger)", marginLeft: "3px" }}>*</span>}
  </label>
);

const Field = ({ label, required, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <FieldLabel required={required}>{label}</FieldLabel>
    {children}
  </div>
);

const InfoBanner = ({ children }) => (
  <div
    style={{
      fontSize: "11.5px",
      color: "var(--info)",
      padding: "10px 14px",
      background: "var(--info-light, #e0f2fe)",
      borderRadius: "8px",
      lineHeight: "1.5",
      border: "1px solid rgba(14,165,233,0.2)",
      marginTop: "8px",
    }}
  >
    {children}
  </div>
);

// ============================================================
// Styles
// ============================================================
const inputStyle = {
  width: "100%",
  padding: "9px 13px",
  border: "1px solid var(--gray-300)",
  borderRadius: "10px",
  fontSize: "13.5px",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
  transition: "all 150ms ease",
};

const hintStyle = {
  fontSize: "10.5px",
  color: "var(--gray-400)",
  marginTop: "4px",
  fontStyle: "italic",
};

const applyFocus = (e, focused) => {
  if (focused) {
    e.target.style.borderColor = "var(--primary)";
    e.target.style.boxShadow = "0 0 0 3px var(--primary-light)";
  } else {
    e.target.style.borderColor = "var(--gray-300)";
    e.target.style.boxShadow = "none";
  }
};

export default StockForm;