import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes, FaSave, FaMobileAlt, FaTrademark, FaSortNumericDown,
} from "react-icons/fa";
import { createModele } from "../../api/modeles";
import SearchSelect from "./SearchSelect";

/**
 * ✅ Mini-modale de création rapide d'un modèle
 * S'affiche AU-DESSUS de ReparationModal (zIndex 10000 > 9999)
 */
const QuickCreateModeleModal = ({
  show,
  onClose,
  onCreated,
  marques = [],
  defaultMarqueId = "",
}) => {
  const [nom, setNom] = useState("");
  const [marqueId, setMarqueId] = useState(defaultMarqueId || "");
  const [ordre, setOrdre] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setNom("");
      setMarqueId(defaultMarqueId || "");
      setOrdre(0);
      setError("");
      setSaving(false);
    }
  }, [show, defaultMarqueId]);

  if (!show) return null;

  // ✅ Options formatées pour SearchSelect
  const marqueOptions = marques.map((m) => ({
    value: m._id,
    label: m.objet?.nom ? `${m.nom} (${m.objet.nom})` : m.nom,
  }));

  const handleSubmit = async () => {
    if (!nom.trim()) return setError("Le nom du modèle est obligatoire");
    if (!marqueId) return setError("La marque est obligatoire");

    setSaving(true);
    setError("");
    try {
      const res = await createModele({
        nom: nom.trim(),
        marque: marqueId,
        ordre: Number(ordre) || 0,
      });

      // res = { success, data: { _id, nom, marque, ... } }
      const entity = res?.data ?? res;
      onCreated?.(entity);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de la création du modèle"
      );
    } finally {
      setSaving(false);
    }
  };

  // ⚠️ On capte Enter/Escape uniquement sur les inputs (pas sur SearchSelect)
  const handleInputKeyDown = (e) => {
    if (e.key === "Escape" && !saving) {
      e.stopPropagation();
      e.preventDefault();
      onClose();
    }
    if (e.key === "Enter" && !saving) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: 0,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 20px",
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 100%)",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--info, #3b82f6), #2563eb)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
              flexShrink: 0,
            }}
          >
            <FaMobileAlt />
          </div>
          <div style={{ flex: 1 }}>
            <h5
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--gray-900)",
                margin: 0,
              }}
            >
              Nouveau modèle
            </h5>
            <p
              style={{
                fontSize: 11,
                color: "var(--gray-500)",
                margin: "1px 0 0",
              }}
            >
              Création rapide sans quitter la réparation
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            type="button"
            style={{
              width: 30,
              height: 30,
              border: "none",
              background: "white",
              borderRadius: 8,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gray-500)",
              fontSize: 15,
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "18px 20px" }}>
          {error && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--danger-light, #fee)",
                color: "var(--danger, #c00)",
                borderRadius: 8,
                marginBottom: 14,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Nom */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--gray-600)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Nom du modèle <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ex : Galaxy S23, iPhone 15..."
              className="form-control-modern"
              style={{ width: "100%" }}
            />
          </div>

          {/* Marque — SearchSelect avec recherche */}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--gray-600)",
                display: "block",
                marginBottom: 4,
              }}
            >
              <FaTrademark
                size={10}
                style={{ marginRight: 6, color: "var(--gray-400)" }}
              />
              Marque associée <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <SearchSelect
              options={marqueOptions}
              value={marqueId}
              onChange={(val) => setMarqueId(val)}
              placeholder="Rechercher une marque..."
            />
          </div>

          {/* Ordre */}
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--gray-600)",
                display: "block",
                marginBottom: 4,
              }}
            >
              <FaSortNumericDown
                size={10}
                style={{ marginRight: 6, color: "var(--gray-400)" }}
              />
              Ordre d'affichage
            </label>
            <input
              type="number"
              min="0"
              value={ordre}
              onChange={(e) => setOrdre(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="0"
              className="form-control-modern"
              style={{ width: "100%" }}
            />
            <div
              style={{
                fontSize: 11,
                color: "var(--gray-500)",
                marginTop: 4,
              }}
            >
              💡 Plus le chiffre est petit, plus l'élément apparaît en premier
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--gray-200)",
            background: "var(--gray-50)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-modern btn-modern-outline"
          >
            <FaTimes /> Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="btn-modern btn-modern-primary"
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                ></span>
                Création...
              </>
            ) : (
              <>
                <FaSave /> Créer le modèle
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickCreateModeleModal;  