import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes, FaSave, FaMapMarkerAlt, FaSortNumericDown,
} from "react-icons/fa";
import { createZone, updateZone } from "../../api/zones";

/**
 * ✅ Modal unifié création / édition de zone
 * - Si `zone` fourni → mode édition (PUT)
 * - Sinon → mode création (POST)
 * - Design identique à QuickCreateModeleModal
 * - zIndex 10000 → au-dessus de ReparationModal (9999) et des autres modaux
 */
const QuickCreateZoneModal = ({ show, onClose, onCreated, zone = null }) => {
  const isEdit = Boolean(zone);

  const [nom, setNom] = useState("");
  const [ordre, setOrdre] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setNom(zone?.nom || "");
      setOrdre(zone?.ordre ?? 0);
      setError("");
      setSaving(false);
    }
  }, [show, zone]);

  if (!show) return null;

  const handleSubmit = async () => {
    if (!nom.trim()) return setError("Le nom de la zone est obligatoire");

    setSaving(true);
    setError("");
    try {
      const payload = { nom: nom.trim(), ordre: Number(ordre) || 0 };

      const res = isEdit
        ? await updateZone(zone._id, payload)
        : await createZone(payload);

      // res = { success, data: {...} }  (backend custom)
      const entity = res?.data?.data ?? res?.data ?? res;
      await onCreated?.(entity, isEdit);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Erreur lors de la ${isEdit ? "modification" : "création"}`
      );
    } finally {
      setSaving(false);
    }
  };

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
            <FaMapMarkerAlt />
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
              {isEdit ? "Modifier la zone" : "Nouvelle zone"}
            </h5>
            <p
              style={{
                fontSize: 11,
                color: "var(--gray-500)",
                margin: "1px 0 0",
              }}
            >
              {isEdit
                ? "Modifiez les informations de la zone"
                : "Création rapide sans quitter la réparation"}
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
              Nom de la zone <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ex : Centre-ville, Zone Nord..."
              className="form-control-modern"
              style={{ width: "100%" }}
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
                {isEdit ? "Enregistrement..." : "Création..."}
              </>
            ) : (
              <>
                <FaSave /> {isEdit ? "Enregistrer" : "Créer la zone"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickCreateZoneModal;