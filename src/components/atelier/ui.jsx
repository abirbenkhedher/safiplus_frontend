import { Modal } from "react-bootstrap";
import { FaInbox } from "react-icons/fa";
import "../../styles/atelier.css";

// ============================================================
// ✅ Composants partagés du module atelier (design system Safi)
// Toutes les pages du module sont enveloppées par <Page>.
// ============================================================

/** Conteneur de page : applique le style du module. */
export const Page = ({ children }) => <div className="fade-in-up atelier-page">{children}</div>;

export const PageHeader = ({ title, subtitle, icon, children }) => (
  <div className="at-header">
    <div className="at-header-main">
      {icon && <div className="at-header-icon">{icon}</div>}
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
    {children && <div className="at-header-actions">{children}</div>}
  </div>
);

/** Carte avec titre optionnel (icône + libellé en capitales). */
export const Card = ({ title, icon, actions, children, className = "", style }) => (
  <div className={`card-modern ${className}`} style={{ padding: 18, ...style }}>
    {(title || actions) && (
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        {title && (
          <div className="at-card-title">
            {icon && <span className="at-card-title-icon">{icon}</span>}
            {title}
          </div>
        )}
        {actions && <div className="d-flex gap-2 flex-wrap mb-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

export const PeriodeFilter = ({ range, onChange, children }) => (
  <div className="card-modern at-filters">
    <div>
      <label className="form-label">Du</label>
      <input type="date" className="form-control-modern" value={range.from}
        onChange={(e) => onChange({ ...range, from: e.target.value })} />
    </div>
    <div>
      <label className="form-label">Au</label>
      <input type="date" className="form-control-modern" value={range.to}
        onChange={(e) => onChange({ ...range, to: e.target.value })} />
    </div>
    {children}
  </div>
);

const STATUTS = {
  brouillon: ["gray", "Brouillon"],
  validee: ["success", "Validée"],
  cloturee: ["primary", "Clôturée"],
  annulee: ["danger", "Annulée"],
  calculee: ["warning", "À valider"],
  rouverte: ["warning", "Rouverte"],
  active: ["success", "Active"],
  doublon_exclu: ["warning", "Doublon exclu"],
};
export const StatutBadge = ({ statut }) => {
  const [color, label] = STATUTS[statut] || ["gray", statut];
  return <span className={`badge-modern badge-modern-${color}`}>{label}</span>;
};

const KPI_COLORS = {
  primary: ["#4361ee", "rgba(67, 97, 238, 0.1)"],
  success: ["#10b981", "rgba(16, 185, 129, 0.1)"],
  danger: ["#ef4444", "rgba(239, 68, 68, 0.1)"],
  warning: ["#f59e0b", "rgba(245, 158, 11, 0.12)"],
  info: ["#3b82f6", "rgba(59, 130, 246, 0.1)"],
  gray: ["#6b7280", "rgba(107, 114, 128, 0.1)"],
};
/** Carte indicateur (même style que les KPI des pages Dépenses / Stock). */
export const Kpi = ({ label, value, hint, icon, tone = "primary", valueColor }) => {
  const [c, bg] = KPI_COLORS[tone] || KPI_COLORS.primary;
  return (
    <div className="at-kpi">
      {icon && <div className="at-kpi-icon" style={{ color: c, background: bg }}>{icon}</div>}
      <div style={{ minWidth: 0 }}>
        <div className="at-kpi-label">{label}</div>
        <div className="at-kpi-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
        {hint && <div className="at-kpi-hint">{hint}</div>}
      </div>
    </div>
  );
};

export const Alert = ({ msg, type = "danger", onClose }) =>
  msg ? (
    <div className={`at-alert at-alert-${type}`} role="alert">
      <span>{msg}</span>
      {onClose && <button type="button" className="at-alert-close" onClick={onClose} aria-label="Fermer">×</button>}
    </div>
  ) : null;

/** Onglets segmentés. tabs = [[clé, libellé], ...] */
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="at-tabs" role="tablist">
    {tabs.map(([k, l]) => (
      <button key={k} type="button" role="tab" className={`at-tab ${value === k ? "active" : ""}`} onClick={() => onChange(k)}>
        {l}
      </button>
    ))}
  </div>
);

/** Bouton icône compact (actions de tableau). tone : "" | "success" | "danger" */
export const IconBtn = ({ title, tone = "", onClick, children, disabled }) => (
  <button type="button" className={`at-icon-btn ${tone}`} title={title} aria-label={title} onClick={onClick} disabled={disabled}>
    {children}
  </button>
);

export const FormModal = ({ show, title, onClose, onSubmit, submitLabel = "Enregistrer", busy, size, children }) => (
  <Modal show={show} onHide={onClose} centered size={size} dialogClassName="atelier-modal" scrollable>
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} style={{ display: "contents" }}>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn-modern btn-modern-outline" onClick={onClose}>Fermer</button>
        {onSubmit && (
          <button type="submit" className="btn-modern btn-modern-primary" disabled={busy}>
            {busy ? "Enregistrement…" : submitLabel}
          </button>
        )}
      </Modal.Footer>
    </form>
  </Modal>
);

export const Field = ({ label, children, col = "col-12", hint }) => (
  <div className={col}>
    <label className="form-label">{label}</label>
    {children}
    {hint && <div className="at-hint">{hint}</div>}
  </div>
);

export const Table = ({ cols, rows, empty = "Aucune donnée pour cette période", rowKey = (r, i) => r._id || i }) => (
  <div className="card-modern at-table-wrap">
    <table className="at-table">
      <thead>
        <tr>{cols.map((c, j) => <th key={j} className={c.right ? "text-end" : ""}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={cols.length} className="at-empty">
              <FaInbox className="at-empty-icon" />
              {empty}
            </td>
          </tr>
        )}
        {rows.map((r, i) => (
          <tr key={rowKey(r, i)}>
            {cols.map((c, j) => (
              <td key={j} className={c.right ? "text-end at-num" : ""}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
