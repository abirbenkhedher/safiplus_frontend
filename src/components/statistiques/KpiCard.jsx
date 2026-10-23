import React from "react";

const KpiCard = ({ icon, label, value, suffix = "", variation, subtitle }) => {
  const isPositive = variation >= 0;

  return (
    <div
      className="card-modern"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))";
      }}
    >
      {/* Ligne du haut : icône + badge variation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: "var(--primary-light, #e0e7ff)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}>
          {icon}
        </div>

        {variation !== undefined && variation !== null && (
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              padding: "4px 8px",
              borderRadius: "6px",
              color: isPositive ? "var(--success, #10b981)" : "var(--danger, #ef4444)",
              background: isPositive ? "var(--success-light, #e6f4ea)" : "var(--danger-light, #fce8e6)",
            }}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(variation)}%
          </span>
        )}
      </div>

      {/* Bloc du bas : valeur + label */}
      <div style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--gray-900)", lineHeight: 1.2 }}>
          {value !== undefined && value !== null ? value : 0}
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--gray-500)", marginLeft: "4px" }}>
            {suffix}
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "var(--gray-500)", marginTop: "4px", fontWeight: "500" }}>
          {label}
        </div>
        {subtitle && (
          <div style={{ fontSize: "11px", color: "var(--gray-400)", marginTop: "4px" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;