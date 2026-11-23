import { FaCaretUp, FaCaretDown, FaLock } from "react-icons/fa";

// ============================================================
// ✅ Champ TVA d'un produit
// - Flèches ▲▼ (ou touches ↑ ↓) : passe d'un taux autorisé à l'autre (ex. 7 % ↔ 19 %)
// - Saisie manuelle libre possible
// - Grisé (cadenas) quand la TVA est figée (produit ayant déjà eu des mouvements)
// ============================================================
const TvaInput = ({ value, onChange, taux = [7, 19], disabled = false, locked = false, className = "form-control-modern", style, inputStyle }) => {
  const liste = [...new Set((taux && taux.length ? taux : [7, 19]).map(Number))].sort((a, b) => a - b);
  const off = disabled || locked;

  const cycler = (sens) => {
    if (off) return;
    const v = value === "" || value === null || value === undefined ? null : Number(value);
    let i = v === null ? -1 : liste.indexOf(v);
    if (i === -1) {
      // valeur libre : aller au taux autorisé suivant / précédent
      const suivant = sens > 0 ? liste.find((t) => v === null || t > v) : [...liste].reverse().find((t) => v === null || t < v);
      onChange(String(suivant ?? (sens > 0 ? liste[0] : liste[liste.length - 1])));
      return;
    }
    i = (i + sens + liste.length) % liste.length;
    onChange(String(liste[i]));
  };

  const btn = {
    border: "none", background: "transparent", padding: 0, lineHeight: 1, height: "50%",
    color: off ? "var(--gray-300)" : "var(--gray-600)", cursor: off ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center",
  };

  return (
    <div style={{ position: "relative", ...style }} title={locked ? "TVA figée : le produit a déjà eu des mouvements de stock" : `Flèches : ${liste.join(" % ↔ ")} % — ou saisie libre`}>
      <input
        type="text"
        inputMode="decimal"
        className={className}
        value={value ?? ""}
        disabled={off}
        onChange={(e) => onChange(e.target.value.replace(",", ".").replace(/[^0-9.]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); cycler(1); }
          if (e.key === "ArrowDown") { e.preventDefault(); cycler(-1); }
        }}
        style={{ ...inputStyle, paddingRight: 44, background: off ? "var(--gray-100)" : undefined, color: off ? "var(--gray-500)" : undefined }}
      />
      <span style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--gray-500)", pointerEvents: "none" }}>
        {locked ? <FaLock size={10} /> : "%"}
      </span>
      <div style={{ position: "absolute", right: 6, top: 4, bottom: 4, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <button type="button" tabIndex={-1} style={btn} disabled={off} onClick={() => cycler(1)} aria-label="Taux suivant"><FaCaretUp /></button>
        <button type="button" tabIndex={-1} style={btn} disabled={off} onClick={() => cycler(-1)} aria-label="Taux précédent"><FaCaretDown /></button>
      </div>
    </div>
  );
};

export default TvaInput;

