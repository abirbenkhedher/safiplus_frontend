import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { getStock } from "../../api/stock";

const StockAlertWidget = () => {
  const navigate = useNavigate();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStock({});
        const all = res.data.data || [];
        // Garder uniquement les pièces en rupture ou en alerte
        const problematic = all
          .filter((s) => s.etat === "rupture" || s.etat === "faible")
          // Ruptures d'abord, puis faibles
          .sort((a, b) => {
            if (a.etat === "rupture" && b.etat !== "rupture") return -1;
            if (a.etat !== "rupture" && b.etat === "rupture") return 1;
            return a.quantite - b.quantite;
          });

        setAlertes(problematic.slice(0, 5)); // max 5
      } catch (err) {
        console.error("Erreur chargement alertes stock:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ne rien afficher si chargement, erreur, ou aucune alerte
  if (loading) return null;
  if (error) return null;
  if (alertes.length === 0) return null;

  const label = (s) =>
    `${s.categorie?.nom || ""} ${s.marque?.nom || ""} ${s.modele?.nom || ""}`.trim();

  return (
    <div
      className="card-modern"
      style={{
        border: "1px solid var(--warning, #f59e0b)",
        background:
          "linear-gradient(135deg, var(--warning-light, #fef3c7) 0%, white 100%)",
      }}
    >
      {/* En-tête */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: "var(--warning, #f59e0b)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FaExclamationTriangle />
          </div>
          <div>
            <h6 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>
              Alertes stock
            </h6>
            <p
              style={{
                fontSize: "11.5px",
                color: "var(--gray-500, #6b7280)",
                margin: 0,
              }}
            >
              {alertes.length} produit{alertes.length > 1 ? "s" : ""} à
              réapprovisionner
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/stock")}
          style={{
            padding: "7px 14px",
            background: "white",
            border: "1px solid var(--warning, #f59e0b)",
            color: "var(--warning, #f59e0b)",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--warning, #f59e0b)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
            e.currentTarget.style.color = "var(--warning, #f59e0b)";
          }}
        >
          Voir tout <FaArrowRight size={10} />
        </button>
      </div>

      {/* Liste des alertes */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {alertes.map((s) => {
          const isRupture = s.etat === "rupture";
          return (
            <div
              key={s._id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid var(--gray-200, #e5e7eb)",
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
              onClick={() => navigate("/stock")}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isRupture
                  ? "var(--danger, #ef4444)"
                  : "var(--warning, #f59e0b)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--gray-200, #e5e7eb)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <span style={{ fontSize: "14px", flexShrink: 0 }}>
                {isRupture ? "🔴" : "🟡"}
              </span>
              <span
                style={{
                  flex: 1,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={label(s)}
              >
                {label(s) || "Pièce sans nom"}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: isRupture
                    ? "var(--danger, #ef4444)"
                    : "var(--warning, #f59e0b)",
                  flexShrink: 0,
                }}
              >
                {isRupture
                  ? "Rupture"
                  : `${s.quantite} / ${s.seuilAlerte}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockAlertWidget;