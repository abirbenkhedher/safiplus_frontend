// ============================================================
// ✅ Carte KPI unique de l'application (styles : styles/design-system.css)
// Même rendu sur toutes les pages : icône à gauche, libellé, valeur, aide.
// ============================================================

const TONES = {
  primary: ["var(--primary)", "rgba(var(--primary-rgb), 0.1)"],
  success: ["#10b981", "rgba(16, 185, 129, 0.1)"],
  danger: ["#ef4444", "rgba(239, 68, 68, 0.1)"],
  warning: ["#f59e0b", "rgba(245, 158, 11, 0.12)"],
  info: ["#3b82f6", "rgba(59, 130, 246, 0.1)"],
  gray: ["#6b7280", "rgba(107, 114, 128, 0.1)"],
};

/**
 * @param tone      "primary" | "success" | "danger" | "warning" | "info" | "gray"
 * @param color/bg  couleurs personnalisées de l'icône (prioritaires sur tone)
 * @param variation pourcentage d'évolution (affiche ▲/▼)
 */
const StatCard = ({ icon, label, value, suffix, hint, tone = "primary", color, bg, valueColor, variation, className = "" }) => {
  const [c, b] = TONES[tone] || TONES.primary;
  const hasTrend = variation !== undefined && variation !== null;
  return (
    <div className={`kpi-card ${className}`}>
      {icon && <div className="kpi-icon" style={{ color: color || c, background: bg || b }}>{icon}</div>}
      <div className="kpi-body">
        <div className="kpi-top">
          <div className="kpi-label" title={typeof label === "string" ? label : undefined}>{label}</div>
          {hasTrend && (
            <span className={`kpi-trend ${variation >= 0 ? "up" : "down"}`}>
              {variation >= 0 ? "▲" : "▼"} {Math.abs(variation)}%
            </span>
          )}
        </div>
        <div className="kpi-value" style={valueColor ? { color: valueColor } : undefined}>
          {value ?? 0}
          {suffix && <span className="kpi-value-suffix">{suffix}</span>}
        </div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </div>
  );
};

export default StatCard;
