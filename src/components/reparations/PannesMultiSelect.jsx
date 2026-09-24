import React, { useState, useRef, useEffect } from 'react';
import { FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';

/**
 * ✅ Sélecteur multi-pannes
 * - Affiche uniquement les pannes de la catégorie sélectionnée
 * - Multi-sélection par cases à cocher
 * - Pas de limite
 */
const PannesMultiSelect = ({
  options = [],       // Liste des pannes disponibles
  value = [],         // Tableau des pannes sélectionnées (strings)
  onChange,           // Callback quand la sélection change
  disabled = false,
  placeholder = 'Sélectionnez les pannes...',
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // ============================================================
  // FERMER AU CLIC EXTÉRIEUR
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // FILTRER LES OPTIONS
  // ============================================================
  const filteredOptions = options.filter((opt) => {
    if (!search) return true;
    return opt.nom.toLowerCase().includes(search.toLowerCase());
  });

  // ============================================================
  // COCHER / DÉCOCHER
  // ============================================================
  const togglePanne = (nom) => {
    if (disabled) return;

    const isSelected = value.includes(nom);
    let newValue;

    if (isSelected) {
      newValue = value.filter((v) => v !== nom);
    } else {
      newValue = [...value, nom];
    }

    onChange(newValue);
  };

  // ============================================================
  // RETIRER UNE PANNE (badge)
  // ============================================================
  const removePanne = (nom, e) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(value.filter((v) => v !== nom));
  };

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
          border: '1px solid var(--gray-200)',
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
            {disabled ? 'Choisissez d\'abord une catégorie' : placeholder}
          </span>
        ) : (
          value.map((nom) => (
            <span
              key={nom}
              className="badge-modern badge-modern-warning"
              style={{
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
              }}
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
          ))
        )}

        {/* Icône chevron à droite */}
        <span
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-400)',
            fontSize: '10px',
            pointerEvents: 'none',
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
            border: '1px solid var(--gray-200)',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            maxHeight: '280px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {/* Recherche */}
          {options.length > 5 && (
            <div
              style={{
                padding: '8px 10px',
                borderBottom: '1px solid var(--gray-100)',
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 1,
              }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                autoFocus
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

          {/* Options */}
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
                  {/* Case à cocher */}
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
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PannesMultiSelect;