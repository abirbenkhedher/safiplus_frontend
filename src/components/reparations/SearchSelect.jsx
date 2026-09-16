import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

/**
 * ✅ Select avec recherche optimisée
 * - Recherche instantanée
 * - Navigation clavier
 * - Aucune dépendance externe
 */
const SearchSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  labelField = 'label',
  valueField = 'value',
  icon,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Filtrer les options
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const term = search.toLowerCase();
    return options.filter(opt =>
      String(opt[labelField]).toLowerCase().includes(term)
    );
  }, [options, search, labelField]);

  // ✅ Option sélectionnée
  const selectedOption = useMemo(
    () => options.find(opt => opt[valueField] === value),
    [options, value, valueField]
  );

  // ✅ Sync search avec la sélection
  useEffect(() => {
    if (selectedOption && !isOpen) {
      setSearch(selectedOption[labelField]);
    } else if (!selectedOption) {
      setSearch('');
    }
  }, [selectedOption, isOpen, labelField]);

  // ✅ Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Navigation clavier
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    onChange(option[valueField], option);
    setSearch(option[labelField]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', null);
    setSearch('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '14px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--gray-400)',
            fontSize: '13px', pointerEvents: 'none', zIndex: 1,
          }}>
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="form-control-modern"
          style={{
            width: '100%',
            paddingLeft: icon ? '38px' : '14px',
            paddingRight: '36px',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />
        
        {/* Bouton effacer ou icône recherche */}
        {search && !disabled ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)', background: 'transparent',
              border: 'none', color: 'var(--gray-400)', cursor: 'pointer',
              padding: '4px', display: 'flex', alignItems: 'center',
            }}
          >
            <FaTimes size={12} />
          </button>
        ) : (
          <FaSearch style={{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--gray-400)',
            fontSize: '12px', pointerEvents: 'none',
          }} />
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid var(--gray-200)',
          borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          maxHeight: '220px', overflowY: 'auto', zIndex: 1000,
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{
              padding: '12px 14px', fontSize: '12.5px',
              color: 'var(--gray-500)', textAlign: 'center',
            }}>
              Aucun résultat
            </div>
          ) : (
            filteredOptions.map((option, index) => (
              <div
                key={option[valueField]}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: index === highlightedIndex ? 'var(--primary-light)' : 'white',
                  color: index === highlightedIndex ? 'var(--primary)' : 'var(--gray-700)',
                  borderBottom: index < filteredOptions.length - 1 ? '1px solid var(--gray-100)' : 'none',
                  transition: 'background 100ms ease',
                  fontWeight: option[valueField] === value ? '600' : '400',
                }}
              >
                {option.icon && (
                  <span style={{ marginRight: '8px' }}>{option.icon}</span>
                )}
                {option[labelField]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;