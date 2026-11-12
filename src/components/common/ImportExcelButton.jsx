import React, { useState, useRef } from "react";
import {
  FaFileExcel,
  FaSpinner,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";

// ============================================================
// ✅ COMPOSANT GÉNÉRIQUE : Import Excel en 2 étapes
// ============================================================
const ImportExcelButton = ({
  onPreview,
  onConfirm,
  onSuccess,
  title = "Import Excel",
  subtitle = "Importer Excel",
  columns = [],
  notCreatedColumns = null,
  labels = {},
  accept = ".xlsx,.xls,.csv",
  buttonClass = "btn-modern btn-modern-outline",
  buttonStyle = { borderColor: "var(--success)", color: "var(--success)" },
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("idle"); // idle | preview | report
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const L = {
    created: "Créés",
    notCreated: "Non créés",
    errors: "Erreurs",
    createdTitle: "✅ Éléments à créer",
    notCreatedTitle: "❌ Éléments NON créés",
    createdReportTitle: "✅ Clients créés",
    errorsTitle: "❌ Erreurs",
    notCreatedHint: "",
    confirmText: "Confirmer l'import",
    cancelText: "Annuler",
    ...labels,
  };

  // ✅ 1. Sélection du fichier → onPreview
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError("Format non supporté. Utilisez .xlsx, .xls ou .csv");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLoading(true);
    setError("");
    setPreview(null);
    setReport(null);
    setPendingFile(file);

    try {
      const response = await onPreview(file);
      setPreview(response.data || response);
      setStep("preview");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Erreur lors de l'aperçu"
      );
      setPendingFile(null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ 2. Confirmation → onConfirm
  const handleConfirm = async () => {
    if (!pendingFile) return;

    setLoading(true);
    setError("");

    try {
      const response = await onConfirm(pendingFile);
      setReport(response.data || response);
      setStep("report");
      onSuccess?.();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Erreur lors de l'import"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setStep("idle");
    setPreview(null);
    setReport(null);
    setPendingFile(null);
    setError("");
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
        {loading && step === "idle" ? (
          <>
            <FaSpinner className="spin" /> Analyse...
          </>
        ) : (
          <>
            <FaFileExcel /> {subtitle}
          </>
        )}
      </button>

      {/* ✅ MODAL PREVIEW */}
      {step === "preview" && preview && (
        <Modal
          onClose={handleClose}
          title={title}
          subtitle={`${preview.total || 0} ligne(s) analysée(s)`}
        >
          <div style={summaryGridStyle}>
            <StatCard
              label={L.created}
              value={preview.toCreate?.length || 0}
              color="#10b981"
              bg="#d1fae5"
              icon={<FaCheck />}
            />
            <StatCard
              label={L.notCreated}
              value={preview.notCreated?.length || 0}
              color="#ef4444"
              bg="#fee2e2"
              icon={<FaBan />}
            />
            <StatCard
              label={L.errors}
              value={preview.errors?.length || 0}
              color="#f59e0b"
              bg="#fef3c7"
              icon={<FaExclamationTriangle />}
            />
          </div>

          {/* ✅ Clients non créés */}
          {preview.notCreated?.length > 0 && (
            <Section title={L.notCreatedTitle} color="#ef4444">
              {L.notCreatedHint && (
                <p
                  style={{
                    fontSize: "11.5px",
                    color: "var(--gray-600)",
                    margin: "0 0 8px 0",
                    padding: "0 12px",
                  }}
                >
                  {L.notCreatedHint}
                </p>
              )}
              <DataGrid
                items={preview.notCreated}
                columns={
                  notCreatedColumns || [
                    { key: "nom", label: "Nom" },
                    { key: "phone", label: "Téléphone", render: (i) => i.phone || "—" },
                    { key: "reason", label: "Raison" },
                  ]
                }
                showLine
              />
            </Section>
          )}

          {/* ✅ À créer */}
          {preview.toCreate?.length > 0 && columns.length > 0 && (
            <Section title={L.createdTitle} color="#10b981">
              <DataGrid
                items={preview.toCreate.map((item) => ({
                  ...item,
                  ...item.clientData,
                }))}
                columns={columns}
                showLine
              />
            </Section>
          )}

          {/* ✅ Erreurs */}
          {preview.errors?.length > 0 && (
            <Section title={L.errorsTitle} color="#f59e0b">
              <ul
                style={{
                  margin: 0,
                  padding: "10px 12px 10px 30px",
                  fontSize: "12px",
                }}
              >
                {preview.errors.map((e, i) => (
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

          <div style={footerStyle}>
            <button
              className="btn-modern btn-modern-outline"
              onClick={handleClose}
              disabled={loading}
            >
              <FaTimes /> {L.cancelText}
            </button>
            <button
              className="btn-modern btn-modern-primary"
              onClick={handleConfirm}
              disabled={loading || (preview.toCreate?.length || 0) === 0}
            >
              {loading ? (
                <>
                  <FaSpinner className="spin" /> Import en cours...
                </>
              ) : (
                <>
                  <FaCheckCircle /> {L.confirmText} (
                  {preview.toCreate?.length || 0})
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* ✅ MODAL RAPPORT FINAL */}
      {step === "report" && report && (
        <Modal
          onClose={handleClose}
          title={`${title} — Résultat`}
          subtitle={`${report.total || 0} ligne(s) traitée(s)`}
        >
          <div style={summaryGridStyle}>
            <StatCard
              label="Créés"
              value={report.created?.length || 0}
              color="#10b981"
              bg="#d1fae5"
              icon={<FaCheck />}
            />
            <StatCard
              label="Non créés"
              value={report.notCreated?.length || 0}
              color="#ef4444"
              bg="#fee2e2"
              icon={<FaBan />}
            />
            <StatCard
              label="Erreurs"
              value={report.errors?.length || 0}
              color="#f59e0b"
              bg="#fef3c7"
              icon={<FaExclamationTriangle />}
            />
          </div>

          {/* ✅ Clients non créés */}
          {report.notCreated?.length > 0 && (
            <Section title="❌ Clients NON créés" color="#ef4444">
              <DataGrid
                items={report.notCreated}
                columns={
                  notCreatedColumns || [
                    { key: "nom", label: "Nom" },
                    { key: "phone", label: "Téléphone", render: (i) => i.phone || "—" },
                    { key: "reason", label: "Raison" },
                  ]
                }
                showLine
              />
            </Section>
          )}

          {/* ✅ Clients créés */}
          {report.created?.length > 0 && (
            <Section title={L.createdReportTitle} color="#10b981">
              <DataGrid items={report.created} columns={columns} showLine />
            </Section>
          )}

          {/* ✅ Erreurs */}
          {report.errors?.length > 0 && (
            <Section title="❌ Erreurs" color="#f59e0b">
              <ul
                style={{
                  margin: 0,
                  padding: "10px 12px 10px 30px",
                  fontSize: "12px",
                }}
              >
                {report.errors.map((e, i) => (
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

          <div style={footerStyle}>
            <button
              className="btn-modern btn-modern-primary"
              onClick={handleClose}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {/* ✅ ERREUR FLOTTANTE */}
      {error && (
        <div style={errorToastStyle}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} style={errorCloseStyle}>
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
const Modal = ({ onClose, title, subtitle, children }) => (
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
      if (e.target === e.currentTarget) onClose();
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
          {subtitle && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "12px",
                color: "var(--gray-500)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
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
      <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
        {children}
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value, color, bg, icon }) => (
  <div
    style={{
      padding: "14px 16px",
      background: bg,
      borderRadius: "10px",
      border: `1px solid ${color}30`,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "22px", color, marginBottom: "4px" }}>{icon}</div>
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
        maxHeight: "260px",
        overflowY: "auto",
        borderRadius: "8px",
        border: "1px solid var(--gray-200)",
      }}
    >
      {children}
    </div>
  </div>
);

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

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
  gap: "12px",
  marginBottom: "20px",
};
const footerStyle = {
  padding: "14px 24px",
  borderTop: "1px solid var(--gray-200)",
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "20px",
  marginLeft: "-24px",
  marginRight: "-24px",
  marginBottom: "-20px",
  background: "var(--gray-50)",
};
const errorToastStyle = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  padding: "12px 18px",
  background: "var(--danger-light)",
  color: "var(--danger)",
  borderRadius: "10px",
  boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
  zIndex: 99999,
  fontSize: "13px",
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  maxWidth: "400px",
};
const errorCloseStyle = {
  background: "transparent",
  border: "none",
  color: "var(--danger)",
  cursor: "pointer",
  padding: "4px",
  display: "flex",
  alignItems: "center",
};
const thStyle = {
  padding: "8px 10px",
  fontWeight: "700",
  fontSize: "11px",
  textTransform: "uppercase",
  color: "var(--gray-600)",
};
const tdStyle = { padding: "6px 10px", fontSize: "12px" };

export default ImportExcelButton;