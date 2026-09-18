import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaExclamationTriangle,
  FaTimes,
  FaChevronRight,
} from "react-icons/fa";
import { useReparationsEnRetard } from "../../hooks/useReparationsEnRetard";

const AlertesRetard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const { reparationsEnRetard, count } = useReparationsEnRetard();

  // ✅ Fermer le panneau au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClickAlerte = (reparationId) => {
    setIsOpen(false);
    navigate(`/reparations/${reparationId}`);
  };

  if (count === 0) return null;

  return (
    <div style={{ position: "relative" }}>
      {/* BOUTON CLOCHE */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        title={`${count} réparation(s) en retard`}
        style={{
          position: "relative",
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          border: "none",
          background: isOpen
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #fef2f2, #fee2e2)",
          color: isOpen ? "white" : "#dc2626",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          boxShadow: isOpen
            ? "0 6px 16px rgba(239, 68, 68, 0.4)"
            : "0 2px 8px rgba(239, 68, 68, 0.15)",
          transition: "all 200ms ease",
          animation: !isOpen ? "bellShake 3s ease-in-out infinite" : "none",
        }}
      >
        <FaBell />

        {/* BADGE COMPTEUR */}
        <span
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            minWidth: "20px",
            height: "20px",
            borderRadius: "10px",
            background: "#dc2626",
            color: "white",
            fontSize: "11px",
            fontWeight: "800",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 5px",
            border: "2px solid white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            animation: "badgePulse 1.5s ease-in-out infinite",
          }}
        >
          {count > 9 ? "9+" : count}
        </span>
      </button>

      {/* PANNEAU DÉROULANT */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
            border: "1px solid var(--gray-200)",
            overflow: "hidden",
            zIndex: 9999,
            animation: "slideDown 200ms ease-out",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg, #fee2e2, #fef2f2)",
              borderBottom: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              <FaExclamationTriangle />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "800",
                  color: "#991b1b",
                }}
              >
                Alertes de délai
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#dc2626",
                  fontWeight: "600",
                }}
              >
                {count} réparation(s) en retard (+48h)
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                border: "none",
                background: "white",
                color: "#991b1b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FaTimes size={11} />
            </button>
          </div>

          {/* LISTE DES ALERTES */}
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {reparationsEnRetard.map((rep) => (
              <div
                key={rep._id}
                onClick={() => handleClickAlerte(rep._id)}
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--gray-100)",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.paddingLeft = "22px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.paddingLeft = "18px";
                }}
              >
                {/* Indicateur */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #fee2e2, #fef2f2)",
                    border: "1px solid #fecaca",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  <FaExclamationTriangle />
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12.5px",
                        fontWeight: "800",
                        color: "#991b1b",
                      }}
                    >
                      {rep.numero}
                    </span>
                    <span
                      style={{
                        padding: "1px 7px",
                        borderRadius: "8px",
                        background: "#dc2626",
                        color: "white",
                        fontSize: "9.5px",
                        fontWeight: "700",
                        letterSpacing: "0.3px",
                      }}
                    >
                      +{rep.depassement}h
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--gray-700)",
                      fontWeight: "600",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rep.marque} {rep.modele} — {rep.client}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#dc2626",
                      fontWeight: "600",
                      marginTop: "2px",
                    }}
                  >
                    En cours depuis {rep.label}
                  </div>
                </div>

                {/* Flèche */}
                <FaChevronRight
                  size={12}
                  style={{ color: "#dc2626", flexShrink: 0 }}
                />
              </div>
            ))}
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: "12px 18px",
              background: "var(--gray-50)",
              borderTop: "1px solid var(--gray-200)",
              textAlign: "center",
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/reparations");
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary)",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Voir toutes les réparations →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertesRetard;