import React from "react";
import { useStatistiquesContext } from "../../context/StatistiquesContext";

const PRESETS = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "year", label: "Cette année" },
];

const PeriodSelector = () => {
  const { period, setPreset, setCustomRange } = useStatistiquesContext();

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between", // Pousse les boutons à gauche et les dates à droite
      alignItems: "center",
      flexWrap: "wrap", // Sur mobile, ça passe à la ligne
      gap: "16px",
      width: "100%", // Prend toute la largeur
      background: "var(--white, #fff)",
      padding: "16px 20px",
      borderRadius: "12px",
      boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
      border: "1px solid var(--gray-200)",
      boxSizing: "border-box", // Évite que le padding dépasse
    }}>
      {/* Groupe des boutons (Presets) */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`btn-modern ${period.preset === p.id ? "btn-modern-primary" : "btn-modern-secondary"}`}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "8px",
              transition: "all 0.2s ease",
              border: period.preset === p.id ? "none" : "1px solid var(--gray-200)",
              whiteSpace: "nowrap",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Groupe des dates (Custom Range) */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "8px", 
        flexWrap: "wrap",
        flex: 1, // Permet de prendre l'espace restant si besoin
        justifyContent: "flex-end", // Aligne les dates à droite
        minWidth: "280px" // Assure que les dates ne se compressent pas trop
      }}>
        <input
          type="date"
          value={period.from}
          onChange={(e) => setCustomRange({ ...period, from: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--gray-300)",
            fontSize: "13px",
            background: "var(--gray-50)",
            color: "var(--gray-700)",
            outline: "none",
            flex: "1 1 auto", // Permet aux inputs de s'étirer
            maxWidth: "160px",
          }}
        />
        <span style={{ color: "var(--gray-400)", fontSize: "14px" }}>→</span>
        <input
          type="date"
          value={period.to}
          onChange={(e) => setCustomRange({ ...period, to: e.target.value })}
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--gray-300)",
            fontSize: "13px",
            background: "var(--gray-50)",
            color: "var(--gray-700)",
            outline: "none",
            flex: "1 1 auto",
            maxWidth: "160px",
          }}
        />
      </div>
    </div>
  );
};

export default PeriodSelector;