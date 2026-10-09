import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes, FaUser, FaTools, FaMoneyBillWave, FaClipboardList,
  FaSave, FaPrint, FaHourglassHalf, FaCommentAlt,
  FaStethoscope, FaChevronDown,
} from "react-icons/fa";
import { createReparation, updateReparation } from "../../api/reparations";
import { useReparationData } from "../../hooks/useReparationData";
import { DRAFT_KEY } from "../../constants/reparations";
import ClientSelector from "./ClientSelector";
import SearchSelect from "./SearchSelect";
import ObservationsList from "./ObservationsList";
import PaymentSection from "./PaymentSection";
import DiagnosticSection from "./DiagnosticSection";
import PannesMultiSelect from "./PannesMultiSelect";
import QuickCreateModeleModal from "./QuickCreateModeleModal";

const INITIAL_FORM = {
  client: "",
  categorie: "",
  objet: "",
  marque: "",
  modele: "",
  problemeDeclare: "",
  panneType: [],
  note: "",
  prix: 0,
  acompte: 0,
  status: "",
  reparateur: "",
  paymentType: "unpaid",
  observations: [{ text: "", date: new Date().toISOString() }],
  diagnosticImprevus: {
    constat: "",
    imprevus: [],
    decisionClient: { statut: "en_attente", note: "" },
  },
};

const ROLES_AUTORISES = ["REPARATEUR", "COMMERCIAL"];

const sortByOrdre = (arr = []) =>
  [...arr].sort(
    (a, b) =>
      (a.ordre ?? 0) - (b.ordre ?? 0) ||
      (a.nom || "").localeCompare(b.nom || "")
  );

// ✅ Helper de calcul du paymentType (identique à PaymentSection)
const computePaymentType = (prixTotal, acompte) => {
  const p = Number(prixTotal) || 0;
  const a = Number(acompte) || 0;
  if (a <= 0) return "unpaid";
  if (p > 0 && a >= p) return "paid";
  return "partial";
};

// ============================================================
// SectionBlock
// ============================================================
const SectionBlock = memo(({ icon, title, color = "var(--primary)", children }) => (
  <div style={{ marginBottom: "14px" }}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        marginBottom: "8px", paddingBottom: "6px",
        borderBottom: `1px solid ${color}20`,
      }}
    >
      <div
        style={{
          width: "24px", height: "24px", borderRadius: "7px",
          background: `${color}15`, color, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h6
        style={{
          fontSize: "11.5px", fontWeight: 700, color, margin: 0,
          textTransform: "uppercase", letterSpacing: "0.5px",
        }}
      >
        {title}
      </h6>
    </div>
    {children}
  </div>
));

// ============================================================
// CollapsibleSection
// ============================================================
const CollapsibleSection = memo(({
  icon, title, color = "var(--primary)", isOpen, onToggle, badge = 0, children,
}) => (
  <div style={{ marginBottom: "14px" }}>
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: "8px",
        paddingBottom: "6px", borderBottom: `1px solid ${color}20`,
        cursor: "pointer", userSelect: "none",
      }}
    >
      <div
        style={{
          width: "24px", height: "24px", borderRadius: "7px",
          background: `${color}15`, color, display: "flex",
          alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h6
        style={{
          fontSize: "11.5px", fontWeight: 700, color, margin: 0,
          textTransform: "uppercase", letterSpacing: "0.5px", flex: 1,
        }}
      >
        {title}
      </h6>
      {badge > 0 && (
        <span
          style={{
            padding: "2px 8px", borderRadius: "10px",
            background: "var(--warning-light)", color: "var(--warning)",
            fontSize: "10.5px", fontWeight: 700,
          }}
        >
          ⚠️ {badge}
        </span>
      )}
      <FaChevronDown
        size={11}
        style={{
          color,
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease", flexShrink: 0,
        }}
      />
    </div>
    {isOpen && <div style={{ marginTop: "10px" }}>{children}</div>}
  </div>
));

// ============================================================
// ReparationModal
// ============================================================
const ReparationModal = ({
  show, onClose, onSuccess, reparation = null, initialClientId = null,
}) => {
  const isEdit = Boolean(reparation);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [envoyerSMS, setEnvoyerSMS] = useState(false);

  // ✅ Pilotage de la mini-modale modèle
  const [showQuickModele, setShowQuickModele] = useState(false);

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const {
    categories, objets, statuses, reparateurs, marques, modeles, pannes,
    refresh,
    reloadModeles,
  } = useReparationData();

  // ---- Refresh à l'ouverture ----
  useEffect(() => {
    if (show) refresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // ---- Chargement des données du formulaire ----
  useEffect(() => {
    if (!show) return;

    if (isEdit && reparation) {
      setFormData({
        client: reparation.client?._id || "",
        categorie: reparation.categorie?._id || "",
        objet: reparation.objet?._id || "",
        marque:
          typeof reparation.marque === "object" && reparation.marque !== null
            ? reparation.marque._id
            : reparation.marque || "",
        modele:
          typeof reparation.modele === "object" && reparation.modele !== null
            ? reparation.modele._id
            : reparation.modele || "",
        problemeDeclare: reparation.problemeDeclare || "",
        panneType: Array.isArray(reparation.panneType)
          ? reparation.panneType
          : reparation.panneType ? [reparation.panneType] : [],
        note: reparation.note || "",
        prix: reparation.prix || 0,
        acompte: reparation.acompte || 0,
        status: reparation.status?._id || "",
        reparateur: reparation.reparateur?._id || "",
        paymentType: reparation.paymentType || "unpaid",
        observations:
          reparation.observations?.length > 0
            ? reparation.observations
            : [{ text: "", date: new Date().toISOString() }],
        diagnosticImprevus: reparation.diagnosticImprevus || {
          constat: "", imprevus: [],
          decisionClient: { statut: "en_attente", note: "" },
        },
      });

      const diag = reparation.diagnosticImprevus;
      setShowDiagnostic(
        !!(diag && (
          diag.constat ||
          (diag.imprevus && diag.imprevus.length > 0) ||
          (diag.decisionClient?.statut && diag.decisionClient.statut !== "en_attente")
        ))
      );
    } else if (!isEdit) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && !initialClientId) {
        try {
          const parsed = JSON.parse(draft);
          if (!parsed.observations?.length) {
            parsed.observations = [{ text: "", date: new Date().toISOString() }];
          }
          if (!parsed.diagnosticImprevus) {
            parsed.diagnosticImprevus = INITIAL_FORM.diagnosticImprevus;
          }
          if (!Array.isArray(parsed.panneType)) {
            parsed.panneType = parsed.panneType ? [parsed.panneType] : [];
          }
          delete parsed.accessoires;
          setFormData(parsed);
          setHasDraft(true);
        } catch {
          setFormData({ ...INITIAL_FORM, client: initialClientId || "" });
        }
      } else {
        setFormData({
          ...INITIAL_FORM,
          client: initialClientId || "",
          observations: [{ text: "", date: new Date().toISOString() }],
        });
      }
      setShowDiagnostic(false);
    }

    setError("");
    setSuccess("");
    setEnvoyerSMS(false);
    setShowQuickModele(false);
  }, [show, reparation, isEdit, initialClientId]);

  // ---- Statut par défaut ----
  useEffect(() => {
    if (statuses.length === 0 || isEdit || formData.status) return;
    const enAttente = statuses.find((s) =>
      s.label.toLowerCase().includes("attente")
    );
    const defaultStatus = enAttente || statuses.find((s) => s.parDefault) || statuses[0];
    if (defaultStatus) {
      setFormData((prev) => ({ ...prev, status: defaultStatus._id }));
    }
  }, [statuses, isEdit, formData.status]);

  // ============================================================
  // ✅ AUTO-SYNC : paymentType cohérent avec prix + acompte + imprévus
  // ============================================================
  useEffect(() => {
    if (!show) return;

    const imprevusAcceptes = (formData.diagnosticImprevus?.imprevus || [])
      .filter((i) => i.accepte === true)
      .reduce((sum, i) => sum + (Number(i.prixSupplementaire) || 0), 0);

    const prixTotal = (Number(formData.prix) || 0) + imprevusAcceptes;
    const acompte = Number(formData.acompte) || 0;

    const nextPaymentType = computePaymentType(prixTotal, acompte);

    if (formData.paymentType !== nextPaymentType) {
      setFormData((prev) => ({ ...prev, paymentType: nextPaymentType }));
    }
  }, [
    show,
    formData.prix,
    formData.acompte,
    formData.paymentType,
    formData.diagnosticImprevus,
  ]);

  // ============================================================
  // ✅ NOUVEAU : Reset du réparateur si plus autorisé après changement de catégorie
  // ============================================================
  useEffect(() => {
    if (!show) return;
    if (!formData.reparateur || !formData.categorie) return;

    const selectedCategorie = categories.find(
      (c) => String(c._id) === String(formData.categorie)
    );

    if (
      selectedCategorie &&
      Array.isArray(selectedCategorie.reparateurs) &&
      selectedCategorie.reparateurs.length > 0
    ) {
      const allowedIds = selectedCategorie.reparateurs.map((r) =>
        typeof r === "object" && r !== null ? r._id : r
      );

      const isStillAllowed = allowedIds.some(
        (id) => String(id) === String(formData.reparateur)
      );

      if (!isStillAllowed) {
        setFormData((prev) => ({ ...prev, reparateur: "" }));
      }
    }
  }, [formData.categorie, formData.reparateur, categories, show]);

  // ---- Auto-save brouillon ----
  useEffect(() => {
    if (isEdit || !show) return;
    if (!formData.client && !formData.marque) return;
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 2000);
    return () => clearTimeout(t);
  }, [formData, isEdit, show]);

  // ---- Handlers stables ----
  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCategorieChange = useCallback((categorieId) => {
    const pannesDeLaCategorie = pannes
      .filter((p) => {
        const catId =
          typeof p.categorie === "object" && p.categorie !== null
            ? p.categorie._id
            : p.categorie;
        return catId === categorieId;
      })
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    const autoPanne = pannesDeLaCategorie.length > 0
      ? [pannesDeLaCategorie[0].nom]
      : [];

    setFormData((prev) => ({
      ...prev, categorie: categorieId, panneType: autoPanne,
    }));
  }, [pannes]);

  const handleModeleCreated = useCallback(
    async (nouveauModele) => {
      await reloadModeles?.();

      if (!nouveauModele?._id) return;

      const marqueId =
        typeof nouveauModele.marque === "object"
          ? nouveauModele.marque?._id
          : nouveauModele.marque;

      if (marqueId && formDataRef.current.marque !== marqueId) {
        setFormData((prev) => ({
          ...prev,
          marque: marqueId,
          modele: nouveauModele._id,
        }));
        return;
      }

      handleFieldChange("modele", nouveauModele._id);
    },
    [reloadModeles, handleFieldChange]
  );

  const printTicket = useCallback(async (reparationId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${apiUrl}/reparations/${reparationId}/ticket`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const html = await res.text();
      const win = window.open("", "_blank", "width=400,height=600");
      win.document.write(html);
      win.document.close();
      win.onload = () => setTimeout(() => win.print(), 500);
    } catch (err) {
      console.error("Erreur impression:", err);
    }
  }, []);

  const handleSubmit = useCallback(async (shouldPrint = false) => {
    setError("");
    setSuccess("");

    const fd = formDataRef.current;
    if (!fd.client) return setError("Le client est obligatoire");
    if (!fd.categorie) return setError("La catégorie est obligatoire");
    if (!fd.objet) return setError("L'objet est obligatoire");
    if (!fd.marque) return setError("La marque est obligatoire");
    if (!Array.isArray(fd.panneType) || fd.panneType.length === 0) {
      return setError("Au moins une panne est obligatoire");
    }
    if (!fd.note.trim()) return setError("La note est obligatoire");
    if (!fd.status) return setError("Le statut est obligatoire");

    setSaving(true);
    try {
      const cleanData = {
        ...fd,
        panneType: fd.panneType,
        observations: fd.observations.filter((o) => o.text.trim() !== ""),
        envoyerSMS,
      };

      const response = isEdit
        ? await updateReparation(reparation._id, cleanData)
        : await createReparation(cleanData);

      const saved = response.data ?? response;
      setSuccess(isEdit ? "Réparation modifiée" : "Réparation créée");

      if (!isEdit) localStorage.removeItem(DRAFT_KEY);

      if (shouldPrint && saved._id) {
        setTimeout(() => printTicket(saved._id), 500);
      }

      setTimeout(() => {
        onSuccess?.(saved);
        onClose();
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }, [isEdit, reparation, envoyerSMS, printTicket, onSuccess, onClose]);

  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (showQuickModele) return;
      if (e.key === "Escape" && !saving) onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, saving, handleSubmit, onClose, showQuickModele]);

  // ---- Filtres mémoïsés ----
  const categoriesTriees = useMemo(() => sortByOrdre(categories), [categories]);
  const objetsTries = useMemo(() => sortByOrdre(objets), [objets]);

  const marquesFiltrees = useMemo(() => sortByOrdre(
    marques.filter((m) => {
      if (!formData.objet) return true;
      const objetId =
        typeof m.objet === "object" && m.objet !== null ? m.objet._id : m.objet;
      return objetId === formData.objet;
    })
  ), [marques, formData.objet]);

  const modelesFiltres = useMemo(() => {
    const filtres = sortByOrdre(
      modeles.filter((m) => {
        if (!formData.marque) return true;
        const marqueId =
          typeof m.marque === "object" && m.marque !== null
            ? m.marque._id
            : m.marque;
        return marqueId === formData.marque;
      })
    );

    if (formData.modele) {
      const current = modeles.find((m) => m._id === formData.modele);
      if (current && !filtres.some((m) => m._id === current._id)) {
        return [current, ...filtres];
      }
    }
    return filtres;
  }, [modeles, formData.marque, formData.modele]);

  const pannesFiltrees = useMemo(() => pannes
    .filter((p) => {
      if (!formData.categorie) return false;
      const catId =
        typeof p.categorie === "object" && p.categorie !== null
          ? p.categorie._id
          : p.categorie;
      return catId === formData.categorie;
    })
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0)),
    [pannes, formData.categorie]
  );

  // ============================================================
  // ✅ MODIFIÉ : usersAutorises filtré par catégorie
  // ============================================================
  const usersAutorises = useMemo(() => {
    // 1. Filtrer par rôle (REPARATEUR + COMMERCIAL)
    const baseList = (reparateurs || []).filter((u) =>
      ROLES_AUTORISES.includes((u.role || "").toUpperCase().trim())
    );

    // 2. Si une catégorie est sélectionnée, on regarde ses réparateurs autorisés
    if (formData.categorie) {
      const selectedCategorie = categories.find(
        (c) => String(c._id) === String(formData.categorie)
      );

      // ✅ Si la catégorie a une liste de réparateurs non vide
      if (
        selectedCategorie &&
        Array.isArray(selectedCategorie.reparateurs) &&
        selectedCategorie.reparateurs.length > 0
      ) {
        // Normaliser en tableau d'IDs (peut être ObjectId ou objet peuplé)
        const allowedIds = selectedCategorie.reparateurs.map((r) =>
          typeof r === "object" && r !== null ? r._id : r
        );

        return baseList
          .filter((u) => allowedIds.some((id) => String(id) === String(u._id)))
          .sort((a, b) => {
            const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
            const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
            return nameA.localeCompare(nameB);
          });
      }
    }

    // ✅ Sinon : pas de restriction → tous les réparateurs
    return baseList.sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [reparateurs, categories, formData.categorie]);

  // ✅ Détecter si la catégorie a des réparateurs restreints (pour le badge)
  const hasRestrictionReparateurs = useMemo(() => {
    if (!formData.categorie) return false;
    const selectedCategorie = categories.find(
      (c) => String(c._id) === String(formData.categorie)
    );
    return !!(
      selectedCategorie &&
      Array.isArray(selectedCategorie.reparateurs) &&
      selectedCategorie.reparateurs.length > 0
    );
  }, [categories, formData.categorie]);

  if (!show) return null;

  const imprevusEnAttente = (
    formData.diagnosticImprevus?.imprevus || []
  ).filter((i) => i.accepte === null || i.accepte === undefined).length;

  // ============================================================
  // RENDER
  // ============================================================
  return createPortal(
    <>
      <div
        className="modal fade show d-block"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 9999,
          overflowY: "auto", padding: "20px",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) onClose();
        }}
      >
        <div
          style={{
            maxWidth: "1180px", width: "100%", margin: "0 auto",
            background: "white", borderRadius: "18px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            maxHeight: "95vh", display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "14px 20px",
              background: "linear-gradient(135deg, rgba(67,97,238,0.05) 0%, rgba(67,97,238,0.02) 100%)",
              borderBottom: "1px solid var(--gray-200)",
              display: "flex", alignItems: "center", gap: "12px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "15px", flexShrink: 0,
                boxShadow: "0 4px 12px rgba(67,97,238,0.3)",
              }}
            >
              <FaTools />
            </div>
            <div style={{ flex: 1 }}>
              <h5 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gray-900)", margin: 0 }}>
                {isEdit ? `Modifier ${reparation?.numero}` : "Nouvelle réparation"}
              </h5>
              <p style={{ fontSize: "11px", color: "var(--gray-500)", margin: "1px 0 0" }}>
                {isEdit ? "Modifiez les informations" : "Ctrl+S pour enregistrer"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              style={{
                width: "30px", height: "30px", borderRadius: "8px",
                border: "none", background: "white", color: "var(--gray-500)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "15px",
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* BODY */}
          <div
            style={{
              padding: "16px 20px",
              overflowY: "auto",
              flex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
              gap: "20px",
              alignItems: "start",
            }}
            className="reparation-modal-body"
          >
            {/* COLONNE GAUCHE */}
            <div style={{ minWidth: 0 }}>
              {hasDraft && !isEdit && (
                <div
                  style={{
                    padding: "8px 12px", background: "var(--warning-light)",
                    color: "var(--warning)", borderRadius: "8px",
                    marginBottom: "12px", fontSize: "11.5px", fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px",
                  }}
                >
                  <span>📝 Brouillon récupéré</span>
                  <button
                    onClick={() => {
                      localStorage.removeItem(DRAFT_KEY);
                      setHasDraft(false);
                      setFormData({ ...INITIAL_FORM, client: initialClientId || "" });
                    }}
                    style={{
                      background: "white", border: "none", color: "var(--warning)",
                      fontSize: "10.5px", fontWeight: 600, cursor: "pointer",
                      padding: "3px 8px", borderRadius: "5px",
                    }}
                  >
                    Effacer
                  </button>
                </div>
              )}

              {success && (
                <div style={{ padding: "8px 12px", background: "var(--success-light)", color: "var(--success)", borderRadius: "8px", marginBottom: "12px", fontSize: "12px", fontWeight: 500 }}>
                  ✅ {success}
                </div>
              )}
              {error && (
                <div style={{ padding: "8px 12px", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "8px", marginBottom: "12px", fontSize: "12px", fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}

              {/* CLIENT */}
              <SectionBlock icon={<FaUser size={12} />} title="Client" color="var(--primary)">
                <ClientSelector
                  value={formData.client}
                  onChange={(id) => handleFieldChange("client", id)}
                />
              </SectionBlock>

              {/* APPAREIL */}
              <SectionBlock icon={<FaTools size={12} />} title="Appareil" color="var(--info)">
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <SearchSelect
                      options={categoriesTriees.map((c) => ({ value: c._id, label: c.nom }))}
                      value={formData.categorie}
                      onChange={handleCategorieChange}
                      placeholder="Catégorie *"
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <SearchSelect
                      options={objetsTries.map((o) => ({ value: o._id, label: o.nom }))}
                      value={formData.objet}
                      onChange={(val) => {
                        handleFieldChange("objet", val);
                        handleFieldChange("marque", "");
                        handleFieldChange("modele", "");
                      }}
                      placeholder="Objet *"
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <SearchSelect
                      options={marquesFiltrees.map((m) => ({ value: m._id, label: m.nom }))}
                      value={formData.marque}
                      onChange={(val) => {
                        handleFieldChange("marque", val);
                        handleFieldChange("modele", "");
                      }}
                      placeholder="Marque *"
                      disabled={!formData.objet}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <SearchSelect
                      options={modelesFiltres.map((m) => ({ value: m._id, label: m.nom }))}
                      value={formData.modele}
                      onChange={(val) => handleFieldChange("modele", val)}
                      placeholder="Modèle (optionnel)"
                      disabled={!formData.marque}
                      onCreate={() => setShowQuickModele(true)}
                      createLabel="Créer un nouveau modèle"
                    />
                  </div>
                </div>
              </SectionBlock>

              {/* PANNE */}
              <SectionBlock icon={<FaClipboardList size={12} />} title="Panne" color="var(--warning)">
                <PannesMultiSelect
                  options={pannesFiltrees}
                  value={formData.panneType}
                  onChange={(val) => handleFieldChange("panneType", val)}
                  disabled={!formData.categorie}
                  placeholder={formData.categorie ? "Pannes *" : "Choisissez une catégorie"}
                />

                <textarea
                  value={formData.problemeDeclare}
                  onChange={(e) => handleFieldChange("problemeDeclare", e.target.value)}
                  rows={2}
                  placeholder="Description du problème (optionnel)"
                  aria-label="Description du problème"
                  className="form-control-modern"
                  style={{ width: "100%", marginTop: "8px", padding: "10px 14px", resize: "vertical", fontFamily: "inherit" }}
                />

                <textarea
                  value={formData.note}
                  onChange={(e) => handleFieldChange("note", e.target.value)}
                  rows={2}
                  placeholder="Note interne *"
                  aria-label="Note interne"
                  className="form-control-modern"
                  style={{ width: "100%", marginTop: "8px", padding: "10px 14px", resize: "vertical", fontFamily: "inherit" }}
                />
              </SectionBlock>
            </div>

            {/* COLONNE DROITE */}
            <div style={{ minWidth: 0 }}>
              <CollapsibleSection
                icon={<FaStethoscope size={12} />}
                title="Diagnostic & Imprévus"
                color="var(--warning)"
                isOpen={showDiagnostic}
                onToggle={() => setShowDiagnostic((v) => !v)}
                badge={imprevusEnAttente}
              >
                <DiagnosticSection
                  diagnostic={formData.diagnosticImprevus}
                  onChange={(diag) => handleFieldChange("diagnosticImprevus", diag)}
                  prixInitial={formData.prix}
                  acompte={formData.acompte}
                />
              </CollapsibleSection>

              <SectionBlock icon={<FaMoneyBillWave size={12} />} title="Paiement" color="var(--success)">
                <PaymentSection formData={formData} onChange={setFormData} />
              </SectionBlock>

              <SectionBlock icon={<FaHourglassHalf size={12} />} title="Gestion" color="var(--primary)">
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <select
                      value={formData.status}
                      onChange={(e) => handleFieldChange("status", e.target.value)}
                      className="form-control-modern"
                      style={{ width: "100%" }}
                      aria-label="Statut"
                    >
                      <option value="">Statut *</option>
                      {statuses.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.label} {s.parDefault && "(défaut)"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-sm-6">
                    
                    <select
                      value={formData.reparateur}
                      onChange={(e) => handleFieldChange("reparateur", e.target.value)}
                      className="form-control-modern"
                      style={{ width: "100%" }}
                      aria-label="Technicien ou commercial"
                    >
                      <option value="">
                        {hasRestrictionReparateurs
                          ? "Choisir un réparateur autorisé"
                          : "Technicien / Commercial"}
                      </option>
                      {usersAutorises.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName}
                          {u.role === "COMMERCIAL" ? " (Commercial)" : " (Réparateur)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ✅ Message si aucun réparateur autorisé */}
                {hasRestrictionReparateurs && usersAutorises.length === 0 && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "var(--warning-light)",
                      color: "var(--warning)",
                      borderRadius: "8px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                    }}
                  >
                    ⚠️ Aucun réparateur autorisé pour cette catégorie
                  </div>
                )}

                <div
                  style={{
                    marginTop: "10px", padding: "10px 12px",
                    background: envoyerSMS ? "var(--primary-light)" : "var(--gray-50)",
                    borderRadius: "10px",
                    border: envoyerSMS ? "1px solid var(--primary)40" : "1px solid var(--gray-200)",
                    display: "flex", alignItems: "center", gap: "10px",
                    cursor: "pointer", transition: "all 150ms ease",
                  }}
                  onClick={() => setEnvoyerSMS((v) => !v)}
                >
                  <input
                    type="checkbox"
                    checked={envoyerSMS}
                    onChange={(e) => setEnvoyerSMS(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: envoyerSMS ? "var(--primary)" : "var(--gray-700)" }}>
                    📱 Envoyer un SMS au client
                  </div>
                </div>
              </SectionBlock>

              <SectionBlock icon={<FaCommentAlt size={12} />} title="Observations" color="var(--gray-600)">
                <ObservationsList
                  observations={formData.observations}
                  onChange={(obs) => handleFieldChange("observations", obs)}
                />
              </SectionBlock>
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: "12px 20px",
              background: "var(--gray-50)",
              borderTop: "1px solid var(--gray-200)",
              display: "flex", gap: "8px", justifyContent: "flex-end",
              flexWrap: "wrap", flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="btn-modern btn-modern-outline"
              style={{ borderColor: "var(--success)", color: "var(--success)" }}
            >
              <FaPrint /> Enregistrer + Imprimer
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="btn-modern btn-modern-primary"
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Enregistrement...
                </>
              ) : (
                <><FaSave /> {isEdit ? "Modifier" : "Enregistrer"}</>
              )}
            </button>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .reparation-modal-body {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>

      {/* ✅ Mini-modale création rapide de modèle */}
      <QuickCreateModeleModal
        show={showQuickModele}
        onClose={() => setShowQuickModele(false)}
        onCreated={handleModeleCreated}
        marques={marquesFiltrees}
        defaultMarqueId={formData.marque}
      />
    </>,
    document.body
  );
};

export default ReparationModal;