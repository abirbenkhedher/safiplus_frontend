// ============================================================
// ✅ Champ remise : valeur + bouton « % / DT » (pourcentage ou montant)
// type : "pct" | "montant" ; onChange(type, valeur)
// ============================================================
const RemiseInput = ({ type = "pct", valeur, onChange, disabled = false, ariaLabel = "Remise" }) => (
  <div className="doc-remise">
    <input
      type="number" min="0" max={type === "pct" ? 100 : undefined} step={type === "pct" ? "0.01" : "0.001"}
      className="form-control-modern" aria-label={ariaLabel} disabled={disabled}
      value={valeur ?? ""} placeholder="0"
      onChange={(e) => onChange(type, e.target.value)}
    />
    <button type="button" disabled={disabled} title={type === "pct" ? "Remise en pourcentage — cliquer pour un montant" : "Remise en montant — cliquer pour un pourcentage"}
      onClick={() => onChange(type === "pct" ? "montant" : "pct", "")}>
      {type === "pct" ? "%" : "DT"}
    </button>
  </div>
);

export default RemiseInput;
