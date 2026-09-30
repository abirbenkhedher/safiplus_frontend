import React, { useState, useRef, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaCheck, FaPlus } from 'react-icons/fa';

/**
 * ✅ Sélecteur multi-pannes avec saisie manuelle
 * - Liste déroulante avec cases à cocher
 * - Champ de saisie pour ajouter une panne personnalisée
 * - Les pannes personnalisées sont sauvegardées automatiquement
 *   côté backend et réapparaîtront dans la liste au prochain chargement
 */
const PannesMultiSelect = ({
  options = [],
  value = [],
  onChange,
  disabled = false,
  placeholder = 'Sélectionnez les pannes...',
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef(null);

  // ============================================================
  // FERMER AU CLIC EXTÉRIEUR
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
        setCustomInput('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableNames = options.map((o) => o.nom);

  const filteredOptions = options.filter((opt) => {
    if (!search) return true;
    return opt.nom.toLowerCase().includes(search.toLowerCase());
  });

  const togglePanne = (nom) => {
    if (disabled) return;
    const isSelected = value.includes(nom);
    const newValue = isSelected
      ? value.filter((v) => v !== nom)
      : [...value, nom];
    onChange(newValue);
  };

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const exists = value.some(
      (v) => String(v).toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setCustomInput('');
      return;
    }

    onChange([...value, trimmed]);
    setCustomInput('');
    setSearch('');
  };

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustom();
    }
  };

  const removePanne = (nom, e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((v) => v !== nom));
  };

  const customCount = value.filter(
    (v) => !availableNames.includes(v)
  ).length;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* ============================================================ */}
      {/* CHAMP PRINCIPAL */}
      {/* ============================================================ */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        style={{
          minHeight: '42px',
          padding: '6px 36px 6px 14px',
          border: `1.5px solid ${isOpen ? 'var(--primary)' : 'var(--gray-200)'}`,
          borderRadius: '10px',
          background: disabled ? 'var(--gray-100)' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          transition: 'all 150ms ease',
          position: 'relative',
        }}
      >
        {value.length === 0 ? (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--gray-400)',
              userSelect: 'none',
            }}
          >
            {disabled ? "Choisissez d'abord une catégorie" : placeholder}
          </span>
        ) : (
          value.map((nom) => {
            const isCustom = !availableNames.includes(nom);
            return (
              <span
                key={nom}
                style={{
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                  fontWeight: '600',
                  border: isCustom
                    ? '1px dashed var(--warning)'
                    : '1px solid transparent',
                }}
                title={
                  isCustom
                    ? 'Panne personnalisée — sera enregistrée automatiquement'
                    : 'Panne configurée'
                }
              >
                <FaExclamationTriangle size={9} />
                {nom}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removePanne(nom, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'inherit',
                      padding: 0,
                      marginLeft: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Retirer"
                  >
                    <FaTimes size={9} />
                  </button>
                )}
              </span>
            );
          })
        )}

        {/* Chevron */}
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: `translateY(-50%) rotate(${isOpen ? '180deg' : '0deg'})`,
            color: 'var(--gray-400)',
            fontSize: '10px',
            pointerEvents: 'none',
            transition: 'transform 200ms ease',
          }}
        >
          ▼
        </span>
      </div>

      {/* ============================================================ */}
      {/* LISTE DÉROULANTE */}
      {/* ============================================================ */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '1.5px solid var(--gray-200)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* ============================================================ */}
          {/* SAISIE MANUELLE */}
          {/* ============================================================ */}
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid var(--gray-100)',
              background:
                'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                placeholder="➕ Ajouter une panne personnalisée..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 12px',
                  border: '1.5px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: 'white',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                onBlur={(e) =>
                  (e.target.style.borderColor = 'var(--gray-200)')
                }
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
                style={{
                  padding: '8px 12px',
                  background: customInput.trim()
                    ? 'var(--primary)'
                    : 'var(--gray-200)',
                  color: customInput.trim() ? 'white' : 'var(--gray-400)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: customInput.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 150ms ease',
                  flexShrink: 0,
                }}
              >
                <FaPlus size={10} /> Ajouter
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RECHERCHE */}
          {/* ============================================================ */}
          {options.length > 5 && (
            <div
              style={{
                padding: '8px 10px',
                borderBottom: '1px solid var(--gray-100)',
                background: 'white',
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Rechercher dans la configuration..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '12px',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '6px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* ============================================================ */}
          {/* LISTE DES OPTIONS */}
          {/* ============================================================ */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {loading ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--gray-500)',
                }}
              >
                Chargement...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--gray-500)',
                }}
              >
                {options.length === 0
                  ? 'Aucune panne pour cette catégorie'
                  : 'Aucun résultat'}
                <div style={{ marginTop: '6px', fontStyle: 'italic' }}>
                  💡 Utilisez le champ ci-dessus pour ajouter une panne
                </div>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = value.includes(opt.nom);
                return (
                  <div
                    key={opt._id || opt.nom}
                    onClick={() => togglePanne(opt.nom)}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: isChecked ? 'var(--warning-light)' : 'white',
                      color: isChecked ? 'var(--warning)' : 'var(--gray-700)',
                      fontWeight: isChecked ? '600' : '400',
                      borderBottom: '1px solid var(--gray-100)',
                      transition: 'background 100ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isChecked) {
                        e.currentTarget.style.background = 'var(--gray-50)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isChecked) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${
                          isChecked ? 'var(--warning)' : 'var(--gray-300)'
                        }`,
                        background: isChecked ? 'var(--warning)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 150ms ease',
                      }}
                    >
                      {isChecked && (
                        <FaCheck size={10} style={{ color: 'white' }} />
                      )}
                    </span>

                    <span style={{ flex: 1 }}>{opt.nom}</span>

                    {opt.ordre !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--gray-400)',
                          fontFamily: 'monospace',
                        }}
                      >
                        #{opt.ordre}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ============================================================ */}
          {/* FOOTER : RÉSUMÉ */}
          {/* ============================================================ */}
          {value.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--gray-100)',
                background: 'var(--gray-50)',
                fontSize: '11px',
                color: 'var(--gray-500)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <span>
                {value.length} panne{value.length > 1 ? 's' : ''} sélectionnée
                {value.length > 1 ? 's' : ''}
                {customCount > 0 && (
                  <span
                    style={{
                      color: 'var(--warning)',
                      fontWeight: '600',
                      marginLeft: '6px',
                    }}
                  >
                    • {customCount} personnalisée
                    {customCount > 1 ? 's' : ''}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PannesMultiSelect;