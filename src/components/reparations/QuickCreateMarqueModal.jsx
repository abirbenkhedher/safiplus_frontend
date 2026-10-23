import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes, FaSave, FaTrademark, FaBoxes, FaSortNumericDown,
} from "react-icons/fa";
import { createMarque, updateMarque } from "../../api/marques";
import SearchSelect from "./SearchSelect";

const QuickCreateMarqueModal = ({
  show,
  onClose,
  onCreated,
  objets = [],
  defaultObjetId = "",
  marque = null,
}) => {
  const isEdit = Boolean(marque);

  const [nom, setNom] = useState("");
  const [objetId, setObjetId] = useState("");
  const [ordre, setOrdre] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setNom(marque?.nom || "");
      setObjetId(
        marque
          ? (typeof marque.objet === "object" && marque.objet !== null
              ? marque.objet._id
              : marque.objet || "")
          : (defaultObjetId || "")
      );
      setOrdre(marque?.ordre ?? 0);
      setError("");
      setSaving(false);
    }
  }, [show, defaultObjetId, marque]);

  if (!show) return null;

  const objetOptions = objets.map((o) => ({ value: o._id, label: o.nom }));

  const handleSubmit = async () => {
    if (!nom.trim()) return setError("Le nom de la marque est obligatoire");
    if (!objetId) return setError("L'objet est obligatoire");

    setSaving(true);
    setError("");
    try {
      const payload = {
        nom: nom.trim(),
        objet: objetId,
        ordre: Number(ordre) || 0,
      };

      const res = isEdit
        ? await updateMarque(marque._id, payload)
        : await createMarque(payload);

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
        zIndex: 10001,
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
              "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.03) 100%)",
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
              background: "linear-gradient(135deg, var(--warning, #f59e0b), #d97706)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
              flexShrink: 0,
            }}
          >
            <FaTrademark />
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
              {isEdit ? "Modifier la marque" : "Nouvelle marque"}
            </h5>
            <p
              style={{
                fontSize: 11,
                color: "var(--gray-500)",
                margin: "1px 0 0",
              }}
            >
              {isEdit
                ? "Modifiez les informations de la marque"
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
              Nom de la marque <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ex : Samsung, Apple, HP..."
              className="form-control-modern"
              style={{ width: "100%" }}
            />
          </div>

          {/* Objet */}
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
              <FaBoxes
                size={10}
                style={{ marginRight: 6, color: "var(--gray-400)" }}
              />
              Objet associé <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <SearchSelect
              options={objetOptions}
              value={objetId}
              onChange={(val) => setObjetId(val)}
              placeholder="Rechercher un objet..."
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
                <FaSave /> {isEdit ? "Enregistrer" : "Créer la marque"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickCreateMarqueModal;