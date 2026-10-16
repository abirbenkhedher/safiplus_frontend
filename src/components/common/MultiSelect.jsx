import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaTimes, FaCheck } from "react-icons/fa";

/**
 * ✅ MultiSelect réutilisable
 *
 * Props :
 * - options    : [{ value, label, group? }]
 * - value      : tableau de valeurs sélectionnées
 * - onChange   : (newValues[]) => void
 * - placeholder: string
 * - label      : string (affiché au-dessus, optionnel)
 * - icon       : ReactNode (optionnel)
 * - disabled   : bool
 */
const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Tous",
  label,
  icon,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  // ✅ Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Options filtrées par recherche
  const filteredOptions = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const toggleOption = (val) => {
    if (disabled) return;
    const set = new Set(value);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onChange(Array.from(set));
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  const removeOne = (val, e) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", minWidth: 0 }}
    >
      {label && (
        <label
          className="filter-label"
          style={{
            fontSize: "10.5px",
            fontWeight: 700,
            color: "var(--gray-500)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            paddingLeft: 2,
            marginBottom: 4,
          }}
        >
          {icon} {label}
          {value.length > 0 && (
            <span
              style={{
                background: "var(--primary)",
                color: "white",
                borderRadius: 10,
                padding: "0 6px",
                fontSize: 9,
                fontWeight: 800,
                marginLeft: 4,
              }}
            >
              {value.length}
            </span>
          )}
        </label>
      )}

      {/* Trigger */}
      <div
        className="form-control-modern"
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          height: "42px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 10px",
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "var(--gray-100)" : "white",
          overflow: "hidden",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 4,
            overflow: "hidden",
          }}
        >
          {value.length === 0 ? (
            <span style={{ color: "var(--gray-400)", fontSize: 12.5 }}>
              {placeholder}
            </span>
          ) : value.length === 1 ? (
            <span
              style={{
                fontSize: 12.5,
                color: "var(--gray-800)",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedOptions[0]?.label}
            </span>
          ) : (
            <>
              {selectedOptions.slice(0, 2).map((o) => (
                <span
                  key={o.value}
                  style={{
                    background: "var(--primary-light, #e0e7ff)",
                    color: "var(--primary, #4361ee)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    maxWidth: 90,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {o.label}
                </span>
              ))}
              {value.length > 2 && (
                <span
                  style={{
                    background: "var(--gray-200)",
                    color: "var(--gray-700)",
                    borderRadius: 6,
                    padding: "2px 6px",
                    fontSize: 10.5,
                    fontWeight: 700,
                  }}
                >
                  +{value.length - 2}
                </span>
              )}
            </>
          )}
        </div>

        {value.length > 0 && !disabled && (
          <button
            type="button"
            onClick={clearAll}
            title="Tout effacer"
            style={{
              background: "transparent",
              border: "none",
              padding: 2,
              color: "var(--gray-400)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <FaTimes size={10} />
          </button>
        )}

        <FaChevronDown
          size={10}
          style={{
            color: "var(--gray-400)",
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 150ms ease",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid var(--gray-200)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1000,
            maxHeight: 280,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Barre de recherche interne */}
          {options.length > 8 && (
            <div
              style={{
                padding: "8px 10px",
                borderBottom: "1px solid var(--gray-100)",
              }}
            >
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 12.5,
                  padding: "4px 6px",
                  background: "var(--gray-50)",
                  borderRadius: 6,
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Liste */}
          <div style={{ overflowY: "auto", maxHeight: 220, padding: "4px 0" }}>
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "var(--gray-400)",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((o) => {
                const checked = value.includes(o.value);
                return (
                  <div
                    key={o.value}
                    onClick={() => toggleOption(o.value)}
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      background: checked ? "var(--primary-light, #eef2ff)" : "transparent",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = "var(--gray-50)";
                    }}
                    onMouseLeave={(e) => {
                      if (!checked)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `1.5px solid ${checked ? "var(--primary)" : "var(--gray-300)"}`,
                        background: checked ? "var(--primary)" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {checked && <FaCheck size={8} color="white" />}
                    </div>
                    <span
                      style={{
                        fontSize: 12.5,
                        color: "var(--gray-800)",
                        fontWeight: checked ? 600 : 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {o.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {value.length > 0 && (
            <div
              style={{
                borderTop: "1px solid var(--gray-100)",
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--gray-50)",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--gray-500)" }}>
                {value.length} sélectionné(s)
              </span>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--danger)",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "2px 6px",
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

export default MultiSelect;