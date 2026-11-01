import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes, FaUser, FaTools, FaMoneyBillWave, FaClipboardList,
  FaSave, FaPrint, FaHourglassHalf, FaCommentAlt,
  FaStethoscope, FaChevronDown,
  FaExclamationTriangle,
  FaCheck, FaBoxOpen,
} from "react-icons/fa";
import { createReparation, updateReparation } from "../../api/reparations";
import { useReparationData } from "../../hooks/useReparationData";
import { DRAFT_KEY } from "../../constants/reparations";
import { getStock, consommerStock, annulerConsommation } from "../../api/stock";
import ClientSelector from "./ClientSelector";
import SearchSelect from "./SearchSelect";
import ObservationsList from "./ObservationsList";
import PaymentSection from "./PaymentSection";
import DiagnosticSection from "./DiagnosticSection";
import PannesMultiSelect from "./PannesMultiSelect";
import QuickCreateModeleModal from "./QuickCreateModeleModal";
import QuickCreateMarqueModal from "./QuickCreateMarqueModal";

// ============================================================
// ✅ Constantes
// ============================================================
const INITIAL_FORM = {
  client: "", categorie: "", objet: "", marque: "", modele: "",
  problemeDeclare: "", panneType: [], note: "", prix: 0, acompte: 0,
  status: "", reparateur: "", reparateurSAV: "", paymentType: "unpaid",
  observations: [{ text: "", date: new Date().toISOString() }],
  diagnosticImprevus: {
    constat: "", imprevus: [],
    decisionClient: { statut: "en_attente", note: "" },
  },
};

const ROLES_AUTORISES = ["REPARATEUR", "COMMERCIAL"];

const STATUTS_SAV_TERMINES = [
  "SAV REPARE", "SAV NON REPARE", "SAV SORTIE REPARE", "SAV SORTIE NON REPARE",
];

const STATUTS_REPARE = [
  "REPARE", "SAV REPARE", "SORTIE REPARE", "SAV SORTIE REPARE",
];

const STATUTS_NON_REPARE = [
  "NON REPARE", "SAV NON REPARE", "SORTIE NON REPARE", "SAV SORTIE NON REPARE",
];

const STATUTS_SANS_REPARATEUR_OBLIGATOIRE = [
  "EN COURS", "EN ATTENTE", "NOUVEAU", "NOUVELLE", "ATTENTE",
];

const sortByOrdre = (arr = []) =>
  [...arr].sort(
    (a, b) =>
      (a.ordre ?? 0) - (b.ordre ?? 0) ||
      (a.nom || "").localeCompare(b.nom || "")
  );

const computePaymentType = (prixTotal, acompte) => {
  const p = Number(prixTotal) || 0;
  const a = Number(acompte) || 0;
  if (a <= 0) return "unpaid";
  if (p > 0 && a >= p) return "paid";
  return "partial";
};

const findReparationId = (obj, depth = 0) => {
  if (!obj || depth > 5) return null;
  if (typeof obj === "string") {
    return obj.match(/^[a-f\d]{24}$/i) ? obj : null;
  }
  if (typeof obj !== "object") return null;
  if (obj._id && typeof obj._id === "string" && obj._id.match(/^[a-f\d]{24}$/i)) {
    return obj._id;
  }
  if (obj.data) {
    const found = findReparationId(obj.data, depth + 1);
    if (found) return found;
  }
  return null;
};

const statutRequiertReparateur = (statusLabel = "") => {
  const label = (statusLabel || "").toUpperCase().trim();
  if (!label) return false;
  return !STATUTS_SANS_REPARATEUR_OBLIGATOIRE.some((s) => label.includes(s));
};

// ============================================================
// 🎨 STYLES INLINE (identiques au StockForm)
// ============================================================
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid var(--gray-300)",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
  transition: "all 180ms ease",
  minHeight: "42px",
  lineHeight: "1.4",
  color: "var(--gray-800)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "90px",
  resize: "vertical",
  lineHeight: "1.5",
};

const applyFocus = (e, focused) => {
  if (focused) {
    e.target.style.borderColor = "var(--primary)";
    e.target.style.boxShadow = "0 0 0 4px rgba(67,97,238,0.12)";
    e.target.style.background = "white";
  } else {
    e.target.style.borderColor = "var(--gray-300)";
    e.target.style.boxShadow = "0 1px 2px rgba(15,23,42,0.04)";
  }
};

// ============================================================
// Composants UI internes
// ============================================================
const SectionBlock = memo(({ icon, title, color = "var(--primary)", badge, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", paddingBottom: "8px", borderBottom: `1px solid ${color}20` }}>
      <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <h6 style={{ fontSize: "12px", fontWeight: 700, color, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", flex: 1 }}>
        {title}
      </h6>
      {badge > 0 && (
        <span style={{ padding: "2px 8px", borderRadius: "10px", background: `${color}15`, color, fontSize: "10px", fontWeight: 700 }}>
          {badge}
        </span>
      )}
    </div>
    {children}
  </div>
));

const CollapsibleSection = memo(({ icon, title, color = "var(--primary)", isOpen, onToggle, badge = 0, children }) => (
  <div style={{ marginBottom: "14px" }}>
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "8px", borderBottom: `1px solid ${color}20`, cursor: "pointer", userSelect: "none" }}>
      <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <h6 style={{ fontSize: "12px", fontWeight: 700, color, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px", flex: 1 }}>
        {title}
      </h6>
      {badge > 0 && (
        <span style={{ padding: "2px 8px", borderRadius: "10px", background: "var(--warning-light)", color: "var(--warning)", fontSize: "10.5px", fontWeight: 700 }}>
          ⚠️ {badge}
        </span>
      )}
      <FaChevronDown size={11} style={{ color, transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease", flexShrink: 0 }} />
    </div>
    {isOpen && <div style={{ marginTop: "12px" }}>{children}</div>}
  </div>
));

// ✅ FieldLabel manquant — ajoutez-le ici
const FieldLabel = ({ children, required, color }) => (
  <label
    style={{
      display: "block",
      fontSize: "11.5px",
      fontWeight: "600",
      color: color || "var(--gray-700)",
      marginBottom: "6px",
      textTransform: "uppercase",
      letterSpacing: "0.3px",
    }}
  >
    {children}
    {required && <span style={{ color: "var(--danger)", marginLeft: "3px" }}>*</span>}
  </label>
);

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

  const [showQuickModele, setShowQuickModele] = useState(false);
  const [showQuickMarque, setShowQuickMarque] = useState(false);

  const [pendingPieces, setPendingPieces] = useState([]);
  const [originalPieces, setOriginalPieces] = useState([]);

  const [stocksDispo, setStocksDispo] = useState([]);
  const [selectedTypeArticle, setSelectedTypeArticle] = useState("");

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const loadedReparationIdRef = useRef(null);
  const loadedInitialClientRef = useRef(null);

  const {
    categories, objets, statuses, reparateurs, marques, modeles, pannes,
    refresh, reloadModeles, reloadMarques,
  } = useReparationData();

  useEffect(() => {
    if (show) refresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // ============================================================
  // ✅ Chargement des stocks
  // ============================================================
  useEffect(() => {
    if (!show) return;
    (async () => {
      try {
        const res = await getStock({});
        setStocksDispo(res.data.data || []);
      } catch (err) {
        console.error("Erreur chargement stocks:", err);
      }
    })();
  }, [show]);

  const canChooseArticle = Boolean(
    formData.categorie && formData.objet && formData.marque
  );

  const stocksFiltres = useMemo(() => {
    if (!canChooseArticle) return [];
    return stocksDispo.filter((s) => {
      if (s.quantite <= 0) return false;

      if (formData.categorie) {
        const catId = typeof s.categorie === "object" && s.categorie !== null ? s.categorie._id : s.categorie;
        if (String(catId) !== String(formData.categorie)) return false;
      }
      if (formData.objet) {
        const objId = typeof s.objet === "object" && s.objet !== null ? s.objet._id : s.objet;
        if (String(objId) !== String(formData.objet)) return false;
      }
      if (formData.marque) {
        const marId = typeof s.marque === "object" && s.marque !== null ? s.marque._id : s.marque;
        if (String(marId) !== String(formData.marque)) return false;
      }
      if (formData.modele) {
        const modId = typeof s.modele === "object" && s.modele !== null ? s.modele._id : s.modele;
        if (String(modId) !== String(formData.modele)) return false;
      }

      return true;
    });
  }, [stocksDispo, formData.categorie, formData.objet, formData.marque, formData.modele, canChooseArticle]);

  const typeArticleOptions = useMemo(() => {
    const map = new Map();
    stocksFiltres.forEach((s) => {
      const ta = s.typeArticle;
      if (ta?._id && !map.has(ta._id)) {
        const pendingQty = pendingPieces
          .filter((p) => String(p.stock) === String(s._id))
          .reduce((sum, p) => sum + (p.quantite || 0), 0);
        const disponible = Math.max(0, (s.quantite || 0) - pendingQty);

        if (disponible > 0) {
          map.set(ta._id, {
            value: ta._id,
            label: ta.nom,
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [stocksFiltres, pendingPieces]);

  const matchedStock = useMemo(() => {
    if (!selectedTypeArticle) return null;
    return stocksFiltres.find((s) => String(s.typeArticle?._id) === String(selectedTypeArticle));
  }, [stocksFiltres, selectedTypeArticle]);

  const matchedStockDisponible = useMemo(() => {
    if (!matchedStock) return 0;
    const pendingQty = pendingPieces
      .filter((p) => String(p.stock) === String(matchedStock._id))
      .reduce((sum, p) => sum + (p.quantite || 0), 0);
    return Math.max(0, matchedStock.quantite - pendingQty);
  }, [matchedStock, pendingPieces]);

  const quantiteDejaAjoutee = useMemo(() => {
    if (!matchedStock) return 0;
    return pendingPieces
      .filter((p) => String(p.stock) === String(matchedStock._id))
      .reduce((sum, p) => sum + (p.quantite || 0), 0);
  }, [matchedStock, pendingPieces]);

  const handleAddPiece = () => {
    setError("");

    if (!canChooseArticle) return setError("Remplissez d'abord Catégorie, Objet et Marque");
    if (!selectedTypeArticle) return setError("Sélectionnez un type d'article");
    if (!matchedStock) return setError("Aucune pièce en stock correspondante");
    if (matchedStockDisponible < 1) {
      return setError(`Stock insuffisant (${matchedStockDisponible} dispo)`);
    }

    setPendingPieces((prev) => [
      ...prev,
      {
        stock: matchedStock._id,
        typeArticle: matchedStock.typeArticle,
        snapshot: {
          categorie: matchedStock.categorie?.nom || "",
          objet: matchedStock.objet?.nom || "",
          typeArticle: matchedStock.typeArticle?.nom || "",
          marque: matchedStock.marque?.nom || "",
          modele: matchedStock.modele?.nom || "",
        },
        quantite: 1,
        _isNew: true,
        _localId: `new-${Date.now()}-${Math.random()}`,
      },
    ]);
    setSelectedTypeArticle("");
  };

  const handleRemovePiece = (piece, index) => {
    setError("");
    setPendingPieces((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!show) {
      loadedReparationIdRef.current = null;
      loadedInitialClientRef.current = null;
      setPendingPieces([]);
      setOriginalPieces([]);
      return;
    }

    if (isEdit && reparation) {
      const repId = reparation._id;
      if (loadedReparationIdRef.current === repId) return;
      loadedReparationIdRef.current = repId;

      const piecesBackend = reparation.piecesStock || [];
      setOriginalPieces(piecesBackend);
      setPendingPieces(
        piecesBackend
          .filter((p) => p.statut === "consomme")
          .map((p) => ({ ...p, _isNew: false }))
      );

      setFormData({
        client: reparation.client?._id || "",
        categorie: reparation.categorie?._id || "",
        objet: reparation.objet?._id || "",
        marque: typeof reparation.marque === "object" && reparation.marque !== null ? reparation.marque._id : reparation.marque || "",
        modele: typeof reparation.modele === "object" && reparation.modele !== null ? reparation.modele._id : reparation.modele || "",
        problemeDeclare: reparation.problemeDeclare || "",
        panneType: Array.isArray(reparation.panneType) ? reparation.panneType : reparation.panneType ? [reparation.panneType] : [],
        note: reparation.note || "",
        prix: reparation.prix || 0,
        acompte: reparation.acompte || 0,
        status: reparation.status?._id || "",
        reparateur: reparation.reparateur?._id || "",
        reparateurSAV: reparation.reparateurSAV?._id || "",
        paymentType: reparation.paymentType || "unpaid",
        observations: reparation.observations?.length > 0 ? reparation.observations : [{ text: "", date: new Date().toISOString() }],
        diagnosticImprevus: reparation.diagnosticImprevus || { constat: "", imprevus: [], decisionClient: { statut: "en_attente", note: "" } },
      });

      const diag = reparation.diagnosticImprevus;
      setShowDiagnostic(!!(diag && (diag.constat || (diag.imprevus && diag.imprevus.length > 0) || (diag.decisionClient?.statut && diag.decisionClient.statut !== "en_attente"))));

      setError("");
      setSuccess("");
      setEnvoyerSMS(false);
      setShowQuickModele(false);
      setShowQuickMarque(false);
      return;
    }

    if (!isEdit) {
      const clientKey = initialClientId || "__new__";
      if (loadedInitialClientRef.current === clientKey) return;
      loadedInitialClientRef.current = clientKey;

      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft && !initialClientId) {
        try {
          const parsed = JSON.parse(draft);
          if (!parsed.observations?.length) parsed.observations = [{ text: "", date: new Date().toISOString() }];
          if (!parsed.diagnosticImprevus) parsed.diagnosticImprevus = INITIAL_FORM.diagnosticImprevus;
          if (!Array.isArray(parsed.panneType)) parsed.panneType = parsed.panneType ? [parsed.panneType] : [];
          delete parsed.accessoires;
          setFormData(parsed);
          setHasDraft(true);
        } catch {
          setFormData({ ...INITIAL_FORM, client: initialClientId || "" });
        }
      } else {
        setFormData({ ...INITIAL_FORM, client: initialClientId || "", observations: [{ text: "", date: new Date().toISOString() }] });
      }
      setShowDiagnostic(false);
      setError("");
      setSuccess("");
      setEnvoyerSMS(false);
      setShowQuickModele(false);
      setShowQuickMarque(false);
      setOriginalPieces([]);
      setPendingPieces([]);
    }
  }, [show, reparation, isEdit, initialClientId]);

  useEffect(() => {
    if (statuses.length === 0 || isEdit || formData.status) return;
    const enAttente = statuses.find((s) => s.label.toLowerCase().includes("attente"));
    const defaultStatus = enAttente || statuses.find((s) => s.parDefault) || statuses[0];
    if (defaultStatus) setFormData((prev) => ({ ...prev, status: defaultStatus._id }));
  }, [statuses, isEdit, formData.status]);

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
  }, [show, formData.prix, formData.acompte, formData.paymentType, formData.diagnosticImprevus]);

  useEffect(() => {
    if (!show) return;
    if (!formData.reparateur || !formData.categorie) return;
    const selectedCategorie = categories.find((c) => String(c._id) === String(formData.categorie));
    if (selectedCategorie && Array.isArray(selectedCategorie.reparateurs) && selectedCategorie.reparateurs.length > 0) {
      const allowedIds = selectedCategorie.reparateurs.map((r) => typeof r === "object" && r !== null ? r._id : r);
      const isStillAllowed = allowedIds.some((id) => String(id) === String(formData.reparateur));
      if (!isStillAllowed) setFormData((prev) => ({ ...prev, reparateur: "" }));
    }
  }, [formData.categorie, formData.reparateur, categories, show]);

  useEffect(() => {
    if (isEdit || !show) return;
    if (!formData.client && !formData.marque) return;
    const t = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 2000);
    return () => clearTimeout(t);
  }, [formData, isEdit, show]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCategorieChange = useCallback((categorieId) => {
    const pannesDeLaCategorie = pannes
      .filter((p) => {
        const catId = typeof p.categorie === "object" && p.categorie !== null ? p.categorie._id : p.categorie;
        return catId === categorieId;
      })
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

    const autoPanne = pannesDeLaCategorie.length > 0 ? [pannesDeLaCategorie[0].nom] : [];
    setFormData((prev) => ({ ...prev, categorie: categorieId, panneType: autoPanne }));
  }, [pannes]);

  const handleModeleCreated = useCallback(async (nouveauModele) => {
    await reloadModeles?.();
    if (!nouveauModele?._id) return;
    const marqueId = typeof nouveauModele.marque === "object" ? nouveauModele.marque?._id : nouveauModele.marque;
    if (marqueId && formDataRef.current.marque !== marqueId) {
      setFormData((prev) => ({ ...prev, marque: marqueId, modele: nouveauModele._id }));
      return;
    }
    handleFieldChange("modele", nouveauModele._id);
  }, [reloadModeles, handleFieldChange]);

  const handleMarqueCreated = useCallback(async (nouvelleMarque) => {
    await reloadMarques?.();
    if (!nouvelleMarque?._id) return;
    const objetId = typeof nouvelleMarque.objet === "object" ? nouvelleMarque.objet?._id : nouvelleMarque.objet;
    if (objetId && formDataRef.current.objet !== objetId) {
      setFormData((prev) => ({ ...prev, objet: objetId, marque: nouvelleMarque._id, modele: "" }));
      return;
    }
    handleFieldChange("marque", nouvelleMarque._id);
    handleFieldChange("modele", "");
  }, [reloadMarques, handleFieldChange]);

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

    const statusLabel = (statuses.find((s) => String(s._id) === String(fd.status))?.label || "").toUpperCase().trim();

    if (statutRequiertReparateur(statusLabel) && !fd.reparateur) {
      return setError(`Le réparateur est obligatoire pour le statut "${statusLabel}"`);
    }

    const needsSAV = STATUTS_SAV_TERMINES.includes(statusLabel);
    if (needsSAV && !fd.reparateurSAV) {
      return setError(`Le réparateur SAV est obligatoire pour le statut "${statusLabel}"`);
    }

    setSaving(true);
    try {
      const cleanData = {
        ...fd,
        panneType: fd.panneType,
        observations: fd.observations.filter((o) => o.text.trim() !== ""),
        envoyerSMS,
        client: fd.client || null,
        categorie: fd.categorie || null,
        objet: fd.objet || null,
        marque: fd.marque || null,
        modele: fd.modele || null,
        status: fd.status || null,
        reparateur: fd.reparateur || null,
        reparateurSAV: fd.reparateurSAV || null,
      };

      const response = isEdit
        ? await updateReparation(reparation._id, cleanData)
        : await createReparation(cleanData);

      const savedId = isEdit ? reparation._id : findReparationId(response);
      const saved = response?.data?.data || response?.data || response;

      let piecesErreurs = [];
      if (savedId) {
        const nouvellesPieces = pendingPieces.filter((p) => p._isNew);

        for (const piece of nouvellesPieces) {
          try {
            await consommerStock({
              reparationId: savedId,
              stockId: piece.stock,
              quantite: piece.quantite,
            });
          } catch (err) {
            piecesErreurs.push({
              label: piece.snapshot?.typeArticle || "Pièce",
              erreur: err?.response?.data?.message || err.message || "Erreur",
            });
          }
        }

        if (isEdit) {
          const idsPresents = new Set(
            pendingPieces.filter((p) => !p._isNew && p._id).map((p) => String(p._id))
          );
          const piecesRetirees = originalPieces.filter(
            (p) => p.statut === "consomme" && !idsPresents.has(String(p._id))
          );

          for (const piece of piecesRetirees) {
            try {
              await annulerConsommation(reparation._id, piece._id, "Retirée lors de la modification");
            } catch (err) {
              piecesErreurs.push({
                label: piece.snapshot?.typeArticle || "Pièce",
                erreur: err?.response?.data?.message || err.message || "Erreur annulation",
              });
            }
          }
        }
      } else {
        piecesErreurs = pendingPieces
          .filter((p) => p._isNew)
          .map((p) => ({
            label: p.snapshot?.typeArticle || "Pièce",
            erreur: "ID réparation introuvable",
          }));
      }

      const sms = saved?.sms || response?.sms;
      if (envoyerSMS) {
        if (sms?.skip) setError(`⚠️ SMS non envoyé : ${sms.erreur || "raison inconnue"}`);
        else if (sms?.statutEnvoi === "succes") setSuccess((isEdit ? "Réparation modifiée" : "Réparation créée") + " • 📱 SMS envoyé");
        else if (sms) setError(`⚠️ Enregistré, mais SMS échoué : ${sms.erreur || "inconnu"}`);
      } else {
        setSuccess(isEdit ? "Réparation modifiée" : "Réparation créée");
      }

      if (piecesErreurs.length > 0) {
        setError(`⚠️ Réparation ${isEdit ? "modifiée" : "créée"}, mais ${piecesErreurs.length} pièce(s) en erreur : ${piecesErreurs.map((e) => e.label).join(", ")}`);
      }

      if (saved?.stockRestauration?.restaurees > 0) {
        setSuccess(`Réparation ${isEdit ? "modifiée" : "créée"} • ♻️ ${saved.stockRestauration.restaurees} pièce(s) restaurée(s)`);
      }

      if (!isEdit) localStorage.removeItem(DRAFT_KEY);

      if (shouldPrint && savedId) setTimeout(() => printTicket(savedId), 500);

      const hasProblem = piecesErreurs.length > 0 || (envoyerSMS && sms && (sms.skip || sms.statutEnvoi !== "succes"));

      setTimeout(() => {
        onSuccess?.(saved);
        onClose();
      }, hasProblem ? 3000 : 900);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }, [isEdit, reparation, envoyerSMS, printTicket, onSuccess, onClose, statuses, pendingPieces, originalPieces]);

  useEffect(() => {
    if (!show) return;
    const handleKey = (e) => {
      if (showQuickModele || showQuickMarque) return;
      if (e.key === "Escape" && !saving) onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [show, saving, handleSubmit, onClose, showQuickModele, showQuickMarque]);

  const categoriesTriees = useMemo(() => sortByOrdre(categories), [categories]);
  const objetsTries = useMemo(() => sortByOrdre(objets), [objets]);

  const marquesFiltrees = useMemo(() => sortByOrdre(
    marques.filter((m) => {
      if (!formData.objet) return true;
      const objetId = typeof m.objet === "object" && m.objet !== null ? m.objet._id : m.objet;
      return objetId === formData.objet;
    })
  ), [marques, formData.objet]);

  const modelesFiltres = useMemo(() => {
    const filtres = sortByOrdre(
      modeles.filter((m) => {
        if (!formData.marque) return true;
        const marqueId = typeof m.marque === "object" && m.marque !== null ? m.marque._id : m.marque;
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
      const catId = typeof p.categorie === "object" && p.categorie !== null ? p.categorie._id : p.categorie;
      return catId === formData.categorie;
    })
    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0)),
    [pannes, formData.categorie]
  );

  const usersAutorises = useMemo(() => {
    const baseList = (reparateurs || []).filter((u) =>
      ROLES_AUTORISES.includes((u.role || "").toUpperCase().trim())
    );
    if (formData.categorie) {
      const selectedCategorie = categories.find((c) => String(c._id) === String(formData.categorie));
      if (selectedCategorie && Array.isArray(selectedCategorie.reparateurs) && selectedCategorie.reparateurs.length > 0) {
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
    return baseList.sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim();
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [reparateurs, categories, formData.categorie]);

  const hasRestrictionReparateurs = useMemo(() => {
    if (!formData.categorie) return false;
    const selectedCategorie = categories.find((c) => String(c._id) === String(formData.categorie));
    return !!(selectedCategorie && Array.isArray(selectedCategorie.reparateurs) && selectedCategorie.reparateurs.length > 0);
  }, [categories, formData.categorie]);

  // ============================================================
  // ✅ Détections
  // ============================================================
  const isSAVTermine = useMemo(() => {
    if (!formData.status) return false;
    const selectedStatus = statuses.find((s) => String(s._id) === String(formData.status));
    if (!selectedStatus) return false;
    const label = (selectedStatus.label || "").toUpperCase().trim();
    return STATUTS_SAV_TERMINES.includes(label);
  }, [formData.status, statuses]);

  const statusLabelCurrent = useMemo(() => {
    if (!formData.status) return "";
    const s = statuses.find((st) => String(st._id) === String(formData.status));
    return (s?.label || "").toUpperCase().trim();
  }, [formData.status, statuses]);

  const reparateurRequis = useMemo(() => {
    return statutRequiertReparateur(statusLabelCurrent);
  }, [statusLabelCurrent]);

  const piecesActivesCount = useMemo(() => {
    return pendingPieces.filter((p) => !p.statut || p.statut === "consomme").length;
  }, [pendingPieces]);

  const isRepareSansPieces = useMemo(() => {
    return isEdit && STATUTS_REPARE.includes(statusLabelCurrent) && piecesActivesCount === 0;
  }, [isEdit, statusLabelCurrent, piecesActivesCount]);

  const isNonRepareAvecPieces = useMemo(() => {
    return isEdit && STATUTS_NON_REPARE.includes(statusLabelCurrent) && piecesActivesCount > 0;
  }, [isEdit, statusLabelCurrent, piecesActivesCount]);

  if (!show) return null;

  const imprevusEnAttente = (formData.diagnosticImprevus?.imprevus || []).filter(
    (i) => i.accepte === null || i.accepte === undefined
  ).length;

  return createPortal(
    <>
      <div
        className="modal fade show d-block reparation-modal-overlay"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", zIndex: 9999,
          overflowY: "auto", padding: "12px",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) onClose();
        }}
      >
        <div
          className="reparation-modal-container"
          style={{
            maxWidth: "1200px", width: "100%", margin: "0 auto",
            background: "white", borderRadius: "20px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            maxHeight: "96vh", display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER — style harmonisé avec StockForm */}
          <div
            className="reparation-modal-header"
            style={{
              padding: "18px 26px",
              background: "linear-gradient(135deg, rgba(67,97,238,0.06) 0%, rgba(67,97,238,0.02) 100%)",
              borderBottom: "1px solid var(--gray-200)",
              display: "flex", alignItems: "center", gap: "14px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "42px", height: "42px", borderRadius: "12px",
                background: "linear-gradient(135deg, #4361ee, #3a52c9)",
                color: "white", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "17px", flexShrink: 0,
                boxShadow: "0 4px 12px rgba(67,97,238,0.35)",
              }}
            >
              <FaTools />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0, color: "var(--gray-900)" }}>
                {isEdit ? `Modifier ${reparation?.numero}` : "Nouvelle réparation"}
              </h2>
              <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "3px 0 0" }}>
                {isEdit ? "Modifiez les informations de la réparation" : "Remplissez les informations • Ctrl+S pour enregistrer"}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              title="Fermer"
              style={{
                width: "34px", height: "34px", borderRadius: "10px",
                border: "none", background: "white", color: "var(--gray-500)",
                cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "15px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
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
          <div
            style={{
              padding: "20px 26px",
              overflowY: "auto",
              flex: 1,
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
              gap: "24px",
              alignItems: "start",
            }}
            className="reparation-modal-body"
          >
            {/* ============================================================ */}
            {/* 🎨 Styles globaux : champs harmonisés avec StockForm         */}
            {/* ============================================================ */}
            <style>{`
              .reparation-modal-body .form-control-modern,
              .reparation-modal-body input:not([type="checkbox"]):not([type="radio"]),
              .reparation-modal-body textarea,
              .reparation-modal-body select,
              .reparation-modal-body .search-select-trigger,
              .reparation-modal-body .search-select-input,
              .reparation-modal-body [class*="search-select"] > div:first-child,
              .reparation-modal-body [class*="SearchSelect"] > div:first-child {
                width: 100% !important;
                padding: 10px 14px !important;
                border: 1.5px solid var(--gray-300) !important;
                border-radius: 10px !important;
                font-size: 13.5px !important;
                font-family: inherit !important;
                outline: none !important;
                box-sizing: border-box !important;
                background: white !important;
                transition: all 180ms ease !important;
                min-height: 42px !important;
                line-height: 1.4 !important;
                color: var(--gray-800) !important;
                box-shadow: 0 1px 2px rgba(15,23,42,0.04) !important;
              }

              .reparation-modal-body .form-control-modern:hover:not(:disabled),
              .reparation-modal-body input:not([type="checkbox"]):not([type="radio"]):hover:not(:disabled),
              .reparation-modal-body textarea:hover:not(:disabled),
              .reparation-modal-body select:hover:not(:disabled) {
                border-color: var(--gray-400) !important;
                background: #fdfdfd !important;
              }

              .reparation-modal-body .form-control-modern:focus,
              .reparation-modal-body input:not([type="checkbox"]):not([type="radio"]):focus,
              .reparation-modal-body textarea:focus,
              .reparation-modal-body select:focus,
              .reparation-modal-body .search-select-trigger:focus,
              .reparation-modal-body .search-select-trigger:focus-visible,
              .reparation-modal-body .search-select-trigger[data-open="true"] {
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 4px rgba(67,97,238,0.12) !important;
                background: white !important;
              }

              .reparation-modal-body .form-control-modern::placeholder,
              .reparation-modal-body input::placeholder,
              .reparation-modal-body textarea::placeholder {
                color: var(--gray-400) !important;
                opacity: 1 !important;
              }

              .reparation-modal-body .form-control-modern:disabled,
              .reparation-modal-body input:disabled,
              .reparation-modal-body textarea:disabled,
              .reparation-modal-body select:disabled {
                background: var(--gray-50) !important;
                color: var(--gray-500) !important;
                cursor: not-allowed !important;
                opacity: 0.8 !important;
                border-color: var(--gray-200) !important;
              }

              .reparation-modal-body textarea {
                min-height: 70px !important;
                resize: vertical !important;
                padding: 11px 14px !important;
                line-height: 1.5 !important;
              }

              .reparation-modal-body input[type="number"]::-webkit-outer-spin-button,
              .reparation-modal-body input[type="number"]::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              .reparation-modal-body input[type="number"] {
                -moz-appearance: textfield;
              }

              .reparation-modal-body [class*="search-select"],
              .reparation-modal-body [class*="SearchSelect"] {
                width: 100% !important;
              }

              @media (max-width: 900px) {
                .reparation-modal-body {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            {/* COLONNE GAUCHE */}
            <div style={{ minWidth: 0 }}>
              {hasDraft && !isEdit && (
                <div
                  style={{
                    padding: "10px 14px", background: "var(--warning-light)",
                    color: "var(--warning)", borderRadius: "10px",
                    marginBottom: "16px", fontSize: "12px", fontWeight: 500,
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
                      fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      padding: "4px 10px", borderRadius: "6px",
                    }}
                  >
                    Effacer
                  </button>
                </div>
              )}

              {success && (
                <div style={{ padding: "10px 14px", background: "var(--success-light)", color: "var(--success)", borderRadius: "10px", marginBottom: "16px", fontSize: "12px", fontWeight: 500, border: "1px solid rgba(16,185,129,0.2)" }}>
                  ✅ {success}
                </div>
              )}
              {error && (
                <div style={{ padding: "10px 14px", background: "var(--danger-light)", color: "var(--danger)", borderRadius: "10px", marginBottom: "16px", fontSize: "12px", fontWeight: 500, border: "1px solid rgba(239,68,68,0.2)" }}>
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
                      onCreate={() => setShowQuickMarque(true)}
                      createLabel="Créer une nouvelle marque"
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

                {/* Type d'article + bouton + */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px dashed var(--gray-200)",
                  }}
                >
                  <FieldLabel>Pièces utilisées</FieldLabel>

                  {!canChooseArticle && (
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--gray-50)",
                        border: "1px dashed var(--gray-300)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "var(--gray-500)",
                        fontStyle: "italic",
                        marginBottom: "10px",
                      }}
                    >
                      ⚠️ Sélectionnez d'abord <strong>Catégorie, Objet et Marque</strong> pour pouvoir choisir un type d'article.
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "8px", alignItems: "stretch" }}>
                    <div style={{ flex: 1 }}>
                      <SearchSelect
                        options={typeArticleOptions}
                        value={selectedTypeArticle}
                        onChange={(val) => setSelectedTypeArticle(val)}
                        placeholder={
                          !canChooseArticle
                            ? "Remplissez Catégorie / Objet / Marque"
                            : typeArticleOptions.length === 0
                            ? "Aucune pièce disponible"
                            : "Choisir un type d'article..."
                        }
                        disabled={!canChooseArticle || typeArticleOptions.length === 0}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPiece}
                      disabled={!canChooseArticle || !selectedTypeArticle || !matchedStock}
                      title="Valider cette pièce"
                      style={{
                        width: "42px",
                        height: "42px",
                        background:
                          !canChooseArticle || !selectedTypeArticle || !matchedStock
                            ? "var(--gray-300)"
                            : "var(--success, #10b981)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor:
                          !canChooseArticle || !selectedTypeArticle || !matchedStock
                            ? "not-allowed"
                            : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow:
                          !canChooseArticle || !selectedTypeArticle || !matchedStock
                            ? "none"
                            : "0 2px 8px rgba(16,185,129,0.3)",
                        transition: "all 150ms ease",
                      }}
                    >
                      <FaCheck size={13} />
                    </button>
                  </div>

                  {/* Bloc stock disponible */}
                  {selectedTypeArticle && matchedStock && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginTop: "10px",
                        padding: "10px 14px",
                        background: "var(--gray-50)",
                        border: "1px solid var(--gray-200)",
                        borderRadius: "10px",
                        fontSize: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <FaBoxOpen
                          size={11}
                          style={{
                            color: matchedStockDisponible > 0 ? "var(--success)" : "var(--danger)",
                          }}
                        />
                        <strong
                          style={{
                            color: matchedStockDisponible > 0 ? "var(--success)" : "var(--danger)",
                            fontSize: "13px",
                          }}
                        >
                          {matchedStockDisponible}
                        </strong>
                        <span style={{ color: "var(--gray-600)" }}>
                          disponible{matchedStockDisponible > 1 ? "s" : ""} en stock
                        </span>
                      </div>

                      {quantiteDejaAjoutee > 0 && (
                        <>
                          <div style={{ width: "1px", height: "14px", background: "var(--gray-300)" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <FaExclamationTriangle size={10} style={{ color: "var(--warning)" }} />
                            <span style={{ color: "var(--warning)", fontWeight: "600" }}>
                              {quantiteDejaAjoutee} déjà ajouté
                            </span>
                          </div>
                        </>
                      )}

                      <div style={{ marginLeft: "auto", fontSize: "10.5px", color: "var(--gray-400)" }}>
                        Stock total : {matchedStock.quantite}
                      </div>
                    </div>
                  )}

                  {/* Liste des pièces ajoutées */}
                  {pendingPieces.length > 0 && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {pendingPieces.map((p, idx) => {
                        const isConsomme = !p.statut || p.statut === "consomme";
                        const label = p.snapshot
                          ? `${p.snapshot.typeArticle || ""} ${p.snapshot.marque || ""} ${p.snapshot.modele || ""}`.trim()
                          : `${p.stock?.typeArticle?.nom || p.typeArticle?.nom || "Pièce"} ${p.stock?.marque?.nom || ""} ${p.stock?.modele?.nom || ""}`.trim();

                        return (
                          <div
                            key={p._id || p._localId || idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              background: isConsomme
                                ? "var(--warning-light)"
                                : p.statut === "restaure"
                                ? "var(--success-light)"
                                : "var(--gray-50)",
                              borderRadius: "10px",
                              border: "1px solid var(--gray-200)",
                              fontSize: "12px",
                            }}
                          >
                            <FaBoxOpen
                              size={10}
                              style={{
                                color:
                                  p.statut === "restaure"
                                    ? "var(--success)"
                                    : p.statut === "annule"
                                    ? "var(--gray-400)"
                                    : "var(--warning)",
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                flex: 1,
                                fontWeight: "600",
                                color: "var(--gray-800)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={label}
                            >
                              {label || "Pièce"}
                            </span>
                            <span style={{ fontSize: "10.5px", fontWeight: "700", color: "var(--gray-600)" }}>
                              × {p.quantite}
                            </span>
                            {p.statut && p.statut !== "consomme" && (
                              <span
                                style={{
                                  fontSize: "9px",
                                  padding: "1px 6px",
                                  background: "white",
                                  borderRadius: "6px",
                                  color: p.statut === "restaure" ? "var(--success)" : "var(--gray-500)",
                                  fontWeight: "700",
                                }}
                              >
                                {p.statut === "restaure" ? "♻️ Restaurée" : "⚪ Annulée"}
                              </span>
                            )}
                            {isConsomme && (
                              <button
                                type="button"
                                onClick={() => handleRemovePiece(p, idx)}
                                disabled={saving}
                                title="Retirer cette pièce (à l'enregistrement)"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  border: "1px solid var(--danger)",
                                  background: "white",
                                  color: "var(--danger)",
                                  borderRadius: "6px",
                                  cursor: saving ? "wait" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "9px",
                                  flexShrink: 0,
                                }}
                              >
                                <FaTimes size={8} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </SectionBlock>

              {/* PANNE */}
              {/* PANNE */}
<SectionBlock icon={<FaClipboardList size={12} />} title="Panne" color="var(--warning)">
  <PannesMultiSelect
    options={pannesFiltrees}
    value={formData.panneType}
    onChange={(val) => handleFieldChange("panneType", val)}
    disabled={!formData.categorie}
    placeholder={formData.categorie ? "Pannes *" : "Choisissez une catégorie"}
  />

  {/* ✅ Note interne AVANT */}
  <div style={{ marginTop: "12px" }}>
    <FieldLabel required>Note interne</FieldLabel>
    <textarea
      value={formData.note}
      onChange={(e) => handleFieldChange("note", e.target.value)}
      rows={2}
      placeholder="Note interne *"
      style={{ ...textareaStyle, minHeight: "60px", height: "60px" }}
      onFocus={(e) => applyFocus(e, true)}
      onBlur={(e) => applyFocus(e, false)}
    />
  </div>

  {/* ✅ Description APRÈS */}
  <div style={{ marginTop: "12px" }}>
    <FieldLabel>Description du problème</FieldLabel>
    <textarea
      value={formData.problemeDeclare}
      onChange={(e) => handleFieldChange("problemeDeclare", e.target.value)}
      rows={2}
      placeholder="Description du problème (optionnel)"
      style={{ ...textareaStyle, minHeight: "60px", height: "60px" }}
      onFocus={(e) => applyFocus(e, true)}
      onBlur={(e) => applyFocus(e, false)}
    />
  </div>
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

              {/* Warnings pièces */}
              {isEdit && isRepareSansPieces && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--warning-light)",
                    color: "var(--warning)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    lineHeight: "1.5",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <FaExclamationTriangle size={12} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Attention :</strong> le statut est « {statusLabelCurrent} » mais{" "}
                    <strong>aucune pièce n'a été consommée</strong>.
                  </div>
                </div>
              )}

              {isEdit && isNonRepareAvecPieces && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--danger-light)",
                    color: "var(--danger)",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: "600",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    lineHeight: "1.5",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <FaExclamationTriangle size={12} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>{piecesActivesCount} pièce(s)</strong> encore consommée(s) sur une réparation
                    « {statusLabelCurrent} ».
                    <br />
                    <span style={{ fontWeight: "400", fontSize: "11px" }}>
                      Elles seront <strong>automatiquement restaurées au stock</strong> à l'enregistrement.
                    </span>
                  </div>
                </div>
              )}

              <SectionBlock icon={<FaHourglassHalf size={12} />} title="Gestion" color="var(--primary)">
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <FieldLabel required>Statut</FieldLabel>
                    <select
                      value={formData.status}
                      onChange={(e) => handleFieldChange("status", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => applyFocus(e, true)}
                      onBlur={(e) => applyFocus(e, false)}
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
                    <FieldLabel
                      required={reparateurRequis}
                      color={reparateurRequis && !formData.reparateur ? "var(--danger)" : "var(--gray-700)"}
                    >
                      Technicien / Commercial
                    </FieldLabel>
                    <select
                      value={formData.reparateur}
                      onChange={(e) => handleFieldChange("reparateur", e.target.value)}
                      style={{
                        ...inputStyle,
                        borderColor:
                          reparateurRequis && !formData.reparateur
                            ? "var(--danger)"
                            : "var(--gray-300)",
                      }}
                      onFocus={(e) => applyFocus(e, true)}
                      onBlur={(e) => applyFocus(e, false)}
                      aria-label="Technicien ou commercial"
                    >
                      <option value="">
                        {hasRestrictionReparateurs
                          ? "Choisir un réparateur autorisé"
                          : reparateurRequis
                          ? "— Réparateur obligatoire —"
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

                {reparateurRequis && !formData.reparateur && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px 14px",
                      background: "var(--danger-light)",
                      color: "var(--danger)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <FaExclamationTriangle size={11} />
                    Le réparateur est obligatoire pour le statut « {statusLabelCurrent} ».
                  </div>
                )}

                {hasRestrictionReparateurs && usersAutorises.length === 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "10px 14px",
                      background: "var(--warning-light)",
                      color: "var(--warning)",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    ⚠️ Aucun réparateur autorisé pour cette catégorie
                  </div>
                )}

                {isSAVTermine && (
                  <div style={{ marginTop: "12px" }}>
                    <FieldLabel required>🔧 Réparateur SAV</FieldLabel>
                    <select
                      value={formData.reparateurSAV}
                      onChange={(e) => handleFieldChange("reparateurSAV", e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => applyFocus(e, true)}
                      onBlur={(e) => applyFocus(e, false)}
                      aria-label="Réparateur SAV"
                    >
                      <option value="">— Sélectionner le réparateur SAV —</option>
                      {usersAutorises.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.firstName} {u.lastName}
                          {u.role === "COMMERCIAL" ? " (Commercial)" : " (Réparateur)"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div
                  style={{
                    marginTop: "12px", padding: "12px 14px",
                    background: envoyerSMS ? "var(--primary-light)" : "var(--gray-50)",
                    borderRadius: "10px",
                    border: envoyerSMS ? "1.5px solid var(--primary)" : "1.5px solid var(--gray-200)",
                    display: "flex", alignItems: "center", gap: "10px",
                    cursor: "pointer", transition: "all 180ms ease",
                  }}
                  onClick={() => setEnvoyerSMS((v) => !v)}
                >
                  <input
                    type="checkbox"
                    checked={envoyerSMS}
                    onChange={(e) => setEnvoyerSMS(e.target.checked)}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)", flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, fontSize: "12.5px", fontWeight: 600, color: envoyerSMS ? "var(--primary)" : "var(--gray-700)" }}>
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
            className="reparation-modal-footer"
            style={{
              padding: "14px 26px",
              background: "var(--gray-50)",
              borderTop: "1px solid var(--gray-200)",
              display: "flex", gap: "10px", justifyContent: "flex-end",
              flexWrap: "wrap", flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="btn-modern btn-modern-outline"
              style={{ borderColor: "var(--success)", color: "var(--success)", padding: "11px 22px", borderRadius: "10px", fontSize: "13.5px", fontWeight: "600" }}
            >
              <FaPrint /> Enregistrer + Imprimer
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
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
                gap: "8px",
                boxShadow: saving ? "none" : "0 2px 10px rgba(67,97,238,0.35)",
                transition: "all 150ms ease",
              }}
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
      </div>

      <QuickCreateMarqueModal
        show={showQuickMarque}
        onClose={() => setShowQuickMarque(false)}
        onCreated={handleMarqueCreated}
        objets={objetsTries}
        defaultObjetId={formData.objet}
      />

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