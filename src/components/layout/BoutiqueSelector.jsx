import { FaStore } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// ✅ MULTI-TENANT : sélecteur de boutique (header)
// - 1 seule boutique → simple badge
// - plusieurs        → liste des boutiques (changer de boutique)
// - SUPER_ADMIN      → boutiques groupées par société + retour au backoffice
// ============================================================
const BACKOFFICE = '__backoffice__';

const BoutiqueSelector = () => {
  const { boutiques, activeBoutique, changeBoutique, isSuperAdmin } = useAuth();
  const superAdmin = isSuperAdmin();

  if (boutiques.length === 0) return null;

  if (!superAdmin && boutiques.length === 1) {
    return (
      <div className="boutique-selector single" title="Boutique">
        <FaStore className="boutique-selector-icon" />
        <span className="boutique-selector-name">{boutiques[0].nom}</span>
        <style>{styles}</style>
      </div>
    );
  }

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === BACKOFFICE) changeBoutique('', '/organisations');
    else changeBoutique(value, '/');
  };

  // Regroupement par société (SUPER_ADMIN)
  const groups = superAdmin
    ? Object.values(
        boutiques.reduce((acc, b) => {
          const id = b.organisation?._id || b.organisation || 'x';
          if (!acc[id]) acc[id] = { nom: b.organisation?.nom || 'Société', items: [] };
          acc[id].items.push(b);
          return acc;
        }, {})
      )
    : null;

  const option = (b) => (
    <option key={b._id} value={b._id}>
      {b.nom} ({b.code})
    </option>
  );

  return (
    <div className={`boutique-selector ${superAdmin && !activeBoutique ? 'backoffice' : ''}`} title="Changer de boutique">
      <FaStore className="boutique-selector-icon" />
      <select
        className="boutique-selector-select"
        value={activeBoutique || (superAdmin ? BACKOFFICE : '')}
        onChange={handleChange}
        aria-label="Boutique active"
      >
        {superAdmin ? (
          <>
            <option value={BACKOFFICE}>🏠 Backoffice</option>
            {groups.map((g) => (
              <optgroup key={g.nom} label={g.nom}>
                {g.items.map(option)}
              </optgroup>
            ))}
          </>
        ) : (
          <>
            {!activeBoutique && <option value="">Choisir une boutique…</option>}
            {boutiques.map(option)}
          </>
        )}
      </select>
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .boutique-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: 10px;
    background: var(--white, #fff);
    margin-right: auto;
    max-width: 280px;
    min-width: 0;
  }
  .boutique-selector.backoffice { border-color: #7c3aed; }
  .boutique-selector-icon { color: var(--primary, #2563eb); flex-shrink: 0; }
  .boutique-selector-name {
    font-weight: 600;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .boutique-selector-select {
    border: none;
    background: transparent;
    font-weight: 600;
    font-size: 14px;
    color: inherit;
    outline: none;
    cursor: pointer;
    min-width: 0;
    max-width: 230px;
    text-overflow: ellipsis;
  }
  [data-theme="dark"] .boutique-selector {
    background: #1a1d27;
    border-color: #2d3140;
    color: #e5e7eb;
  }
  [data-theme="dark"] .boutique-selector-select option,
  [data-theme="dark"] .boutique-selector-select optgroup { background: #1a1d27; color: #e5e7eb; }
  @media (max-width: 576px) {
    .boutique-selector { max-width: 160px; padding: 4px 8px; }
    .boutique-selector-select { max-width: 120px; font-size: 13px; }
  }
`;

export default BoutiqueSelector;
