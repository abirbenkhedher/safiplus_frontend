import { useStatistiquesContext } from "../../context/StatistiquesContext";

const PRESETS = [
  { id: "7d", label: "7 jours" },
  { id: "30d", label: "30 jours" },
  { id: "90d", label: "90 jours" },
  { id: "year", label: "Cette année" },
];

// ✅ Sélecteur de période — styles : .period-* dans styles/design-system.css
const PeriodSelector = () => {
  const { period, setPreset, setCustomRange } = useStatistiquesContext();

  return (
    <div className="card-modern period-selector">
      <div className="period-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`period-preset ${period.preset === p.id ? "active" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="period-dates">
        <input
          type="date"
          className="form-control-modern"
          aria-label="Date de début"
          value={period.from}
          onChange={(e) => setCustomRange({ ...period, from: e.target.value })}
        />
        <span className="period-arrow">→</span>
        <input
          type="date"
          className="form-control-modern"
          aria-label="Date de fin"
          value={period.to}
          onChange={(e) => setCustomRange({ ...period, to: e.target.value })}
        />
      </div>
    </div>
  );
};

export default PeriodSelector;
