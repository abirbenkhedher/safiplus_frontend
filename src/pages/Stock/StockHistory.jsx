import { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { getMouvements } from "../../api/stock";

// ============================================================
// ✅ Configuration des types de mouvements
// ============================================================
const TYPE_LABELS = {
  CREATION: {
    label: "Création",
    icon: "✨",
    color: "#6b7280",
    bg: "#f3f4f6",
  },
  AJOUT_MANUEL: {
    label: "Ajout manuel",
    icon: "➕",
    color: "#065f46",
    bg: "#d1fae5",
  },
  RETRAIT_MANUEL: {
    label: "Retrait manuel",
    icon: "➖",
    color: "#991b1b",
    bg: "#fee2e2",
  },
  RETRAIT_REPARATION: {
    label: "Consommation réparation",
    icon: "🔧",
    color: "#92400e",
    bg: "#fef3c7",
  },
  RESTAURATION_REPARATION: {
    label: "Restauration (NON REPARE)",
    icon: "♻️",
    color: "#065f46",
    bg: "#d1fae5",
  },
  ANNULATION_CONSOMMATION: {
    label: "Annulation de consommation",
    icon: "↩️",
    color: "#6b7280",
    bg: "#e5e7eb",
  },
  AJUSTEMENT: {
    label: "Ajustement",
    icon: "⚙️",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
};

const StockHistory = ({ stock, onClose }) => {
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMouvements(stock._id);
        setMouvements(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [stock._id]);

  // ✅ Nom complet de la ligne de stock
  const label =
    `${stock.typeArticle?.nom || ""} ${stock.marque?.nom || ""} ${
      stock.modele?.nom || ""
    }`.trim() ||
    `${stock.categorie?.nom || ""} ${stock.objet?.nom || ""}`.trim() ||
    "Ligne de stock";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            📜
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>
              Historique des mouvements
            </h2>
            <p
              style={{
                fontSize: "11.5px",
                color: "var(--gray-500)",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={label}
            >
              {label} — stock actuel : <strong>{stock.quantite}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              border: "none",
              background: "var(--gray-100)",
              color: "var(--gray-500)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              flexShrink: 0,
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div
              style={{
                padding: "30px",
                textAlign: "center",
                color: "var(--gray-400)",
              }}
            >
              Chargement...
            </div>
          ) : mouvements.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--gray-400)",
              }}
            >
              <div style={{ fontSize: "32px", opacity: 0.4, marginBottom: "8px" }}>
                📭
              </div>
              <div style={{ fontSize: "13px" }}>Aucun mouvement enregistré</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {mouvements.map((m) => {
                const t =
                  TYPE_LABELS[m.type] || {
                    label: m.type,
                    icon: "•",
                    color: "#6b7280",
                    bg: "#f3f4f6",
                  };
                const sign = m.quantite > 0 ? "+" : "";
                const isPos = m.quantite > 0;

                return (
                  <div
                    key={m._id}
                    style={{
                      padding: "12px",
                      border: "1px solid var(--gray-200)",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            fontWeight: "700",
                            background: t.bg,
                            color: t.color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{t.icon}</span>
                          {t.label}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>
                          {new Date(m.createdAt).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--gray-700)" }}>
                        {m.motif || "—"}
                        {m.reparationId?.numero && (
                          <span style={{ color: "var(--gray-500)" }}>
                            {" "}
                            · 🔧 {m.reparationId.numero}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--gray-400)",
                          marginTop: "2px",
                        }}
                      >
                        par{" "}
                        {m.createdBy?.firstName ||
                          m.createdBy?.username ||
                          "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "800",
                          color: isPos
                            ? "var(--success)"
                            : "var(--danger)",
                          lineHeight: 1,
                        }}
                      >
                        {sign}
                        {m.quantite}
                      </div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--gray-400)",
                          marginTop: "2px",
                        }}
                      >
                        {m.quantiteAvant} → {m.quantiteApres}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockHistory;