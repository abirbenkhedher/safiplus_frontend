import React, { useState, useRef } from "react";
import {
  FaFileExcel,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";

// ============================================================
// ✅ COMPOSANT GÉNÉRIQUE : Import Excel réutilisable
// ============================================================
/**
 * @param {Function} onImport       - (file) => Promise<response> avec { data: { created, duplicates, errors, total } }
 * @param {Function} onSuccess      - () => void appelé après succès
 * @param {string}   title          - Titre du modal (défaut "Import Excel")
 * @param {string}   subtitle       - Sous-titre du bouton (défaut "Importer Excel")
 * @param {Array}    columns        - Colonnes pour les tableaux created/duplicates
 *                                    ex: [{ key: 'nom', label: 'Nom' }, ...]
 * @param {Object}   labels         - Personnalisation des textes
 *                                    { created, duplicates, errors, createdTitle, duplicatesTitle, errorsTitle, duplicatesHint }
 * @param {string}   accept         - Types de fichiers acceptés (défaut ".xlsx,.xls,.csv")
 * @param {string}   buttonClass    - Classe CSS du bouton (défaut "btn-modern btn-modern-outline")
 * @param {Object}   buttonStyle    - Style inline du bouton
 * @param {boolean}  disabled       - Désactiver le bouton
 */
const ImportExcelButton = ({
  onImport,
  onSuccess,
  title = "Import Excel",
  subtitle = "Importer Excel",
  columns = [],
  labels = {},
  accept = ".xlsx,.xls,.csv",
  buttonClass = "btn-modern btn-modern-outline",
  buttonStyle = { borderColor: "var(--success)", color: "var(--success)" },
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showReport, setShowReport] = useState(false);

  // ✅ Textes avec valeurs par défaut
  const L = {
    created: "Créés",
    duplicates: "Doublons (déjà existants)",
    errors: "Erreurs",
    createdTitle: "✅ Éléments créés",
    duplicatesTitle: "⚠️ Doublons (déjà existants)",
    errorsTitle: "❌ Erreurs",
    duplicatesHint: "",
    ...labels,
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Validation format
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("Format non supporté. Utilisez .xlsx, .xls ou .csv");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await onImport(file);
      setResult(response.data || response);
      setShowReport(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors de l'import"
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCloseReport = () => {
    setShowReport(false);
    setResult(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        className={buttonClass}
        onClick={() => fileInputRef.current?.click()}
        disabled={loading || disabled}
        style={buttonStyle}
        title={subtitle}
      >
        {loading ? (
          <>
            <FaSpinner className="spin" /> Import...
          </>
        ) : (
          <>
            <FaFileExcel /> {subtitle}
          </>
        )}
      </button>

      {/* ✅ MODAL RAPPORT */}
      {showReport && result && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseReport();
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                }}
              >
                <FaFileExcel />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                  {title}
                </h3>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    color: "var(--gray-500)",
                  }}
                >
                  {result.total || 0} ligne(s) traitée(s)
                </p>
              </div>
              <button
                onClick={handleCloseReport}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--gray-100)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* BODY */}
            <div
              style={{
                padding: "20px 24px",
                overflowY: "auto",
                flex: 1,
              }}
            >
              {/* ✅ Résumé */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <StatCard
                  label={L.created}
                  value={result.created?.length || 0}
                  color="#10b981"
                  bg="#d1fae5"
                />
                <StatCard
                  label={L.duplicates}
                  value={result.duplicates?.length || 0}
                  color="#f59e0b"
                  bg="#fef3c7"
                />
                <StatCard
                  label={L.errors}
                  value={result.errors?.length || 0}
                  color="#ef4444"
                  bg="#fee2e2"
                />
              </div>

              {/* ✅ Créés */}
              {result.created?.length > 0 && columns.length > 0 && (
                <Section title={L.createdTitle} color="#10b981">
                  <DataGrid
                    items={result.created}
                    columns={columns}
                    showLine={true}
                  />
                </Section>
              )}

              {/* ✅ Doublons */}
              {result.duplicates?.length > 0 && columns.length > 0 && (
                <Section title={L.duplicatesTitle} color="#f59e0b">
                  {L.duplicatesHint && (
                    <p
                      style={{
                        fontSize: "11.5px",
                        color: "var(--gray-600)",
                        marginBottom: "8px",
                      }}
                    >
                      {L.duplicatesHint}
                    </p>
                  )}
                  <DataGrid
                    items={result.duplicates}
                    columns={columns}
                    showLine={true}
                  />
                </Section>
              )}

              {/* ✅ Erreurs */}
              {result.errors?.length > 0 && (
                <Section title={L.errorsTitle} color="#ef4444">
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                      fontSize: "12px",
                      padding: "10px 12px 10px 30px",
                    }}
                  >
                    {result.errors.map((e, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        <strong>Ligne {e.line}</strong> — {e.reason}
                        {e.nom && (
                          <span style={{ color: "var(--gray-500)" }}>
                            {" "}
                            ({e.nom})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            {/* FOOTER */}
            <div
              style={{
                padding: "14px 24px",
                borderTop: "1px solid var(--gray-200)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                className="btn-modern btn-modern-primary"
                onClick={handleCloseReport}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ERREUR FLOTTANTE */}
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 18px",
            background: "var(--danger-light)",
            color: "var(--danger)",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
            zIndex: 9999,
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "400px",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError("")}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaTimes size={11} />
          </button>
        </div>
      )}
    </>
  );
};

// ============================================================
// Sous-composants
// ============================================================
const StatCard = ({ label, value, color, bg }) => (
  <div
    style={{
      padding: "14px 16px",
      background: bg,
      borderRadius: "10px",
      border: `1px solid ${color}30`,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "24px", fontWeight: "800", color }}>{value}</div>
    <div
      style={{ fontSize: "11px", color, fontWeight: "600", marginTop: "2px" }}
    >
      {label}
    </div>
  </div>
);

const Section = ({ title, color, children }) => (
  <div style={{ marginBottom: "16px" }}>
    <h4
      style={{
        fontSize: "12.5px",
        fontWeight: "700",
        color,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "8px",
      }}
    >
      {title}
    </h4>
    <div
      style={{
        maxHeight: "300px",
        overflowY: "auto",
        borderRadius: "8px",
        border: "1px solid var(--gray-200)",
      }}
    >
      {children}
    </div>
  </div>
);

/**
 * Affiche un tableau dynamique basé sur une liste de colonnes
 * Chaque colonne : { key, label, render? }
 */
const DataGrid = ({ items, columns, showLine = true }) => (
  <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
    <thead>
      <tr style={{ background: "#f9fafb", textAlign: "left" }}>
        {showLine && <th style={thStyle}>Ligne</th>}
        {columns.map((col) => (
          <th key={col.key} style={thStyle}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {items.map((item, idx) => (
        <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
          {showLine && <td style={tdStyle}>{item.line}</td>}
          {columns.map((col) => (
            <td key={col.key} style={tdStyle}>
              {col.render ? col.render(item) : item[col.key] ?? "—"}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const thStyle = {
  padding: "8px 10px",
  fontWeight: "700",
  fontSize: "11px",
  textTransform: "uppercase",
  color: "var(--gray-600)",
};
const tdStyle = { padding: "6px 10px", fontSize: "12px" };

export default ImportExcelButton;