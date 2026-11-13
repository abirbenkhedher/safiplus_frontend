import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaTools, FaCashRegister } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { setEspace, PAGES_COMMERCE, PAGES_ATELIER, pageDe } from "../../utils/espace";

// ============================================================
// ✅ Bascule Atelier / Commerce (en haut du menu latéral)
// Visible seulement si l'utilisateur a accès aux deux espaces.
// Arriver sur une page de l'autre espace (lien, favori) bascule le menu.
// compact = menu replié : deux icônes empilées.
// ============================================================
const EspaceSwitch = ({ compact = false }) => {
  const { commerceDispo, atelierDispo, espaceActif, homeAtelier, homeCommerce, isSuperAdmin, activeBoutique } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const deux = commerceDispo && atelierDispo && (!isSuperAdmin() || !!activeBoutique);

  useEffect(() => {
    if (!deux) return;
    if (pageDe(location.pathname, PAGES_COMMERCE)) setEspace("commerce");
    else if (pageDe(location.pathname, PAGES_ATELIER)) setEspace("atelier");
  }, [location.pathname, deux]);

  if (!deux) return null;

  const aller = (e) => {
    if (e === espaceActif) return;
    setEspace(e);
    // Accueil de l'espace CIBLE (tableau de bord atelier ou commerce)
    navigate(e === "commerce" ? homeCommerce() : homeAtelier());
  };

  const boutons = [
    ["atelier", <FaTools key="a" />, "Atelier"],
    ["commerce", <FaCashRegister key="c" />, "Commerce"],
  ];

  return (
    <div className={`espace-switch ${compact ? "compact" : ""}`} role="tablist" aria-label="Espace de travail">
      {boutons.map(([e, icon, label]) => (
        <button key={e} type="button" role="tab" aria-selected={espaceActif === e} title={label}
          className={`espace-${e} ${espaceActif === e ? "active" : ""}`} onClick={() => aller(e)}>
          {icon} {!compact && <span>{label}</span>}
        </button>
      ))}
      <style>{`
        .espace-switch {
          display: grid; grid-template-columns: 1fr 1fr; gap: 3px; padding: 3px;
          background: rgba(255, 255, 255, 0.06); border-radius: 11px;
        }
        .espace-switch.compact { grid-template-columns: 1fr; width: 44px; }
        .espace-switch button {
          border: none; background: transparent; color: #94a3b8; border-radius: 8px;
          padding: 7px 8px; font-size: 12.5px; font-weight: 600; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: background 150ms ease, color 150ms ease;
        }
        .espace-switch button:hover:not(.active) { color: white; background: rgba(255, 255, 255, 0.06); }
        .espace-switch button:focus-visible { outline: 2px solid white; outline-offset: 1px; }
        .espace-switch button.active { color: white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
        .espace-switch button.espace-atelier.active { background: #4361ee; }
        .espace-switch button.espace-commerce.active { background: #c2410c; }
      `}</style>
    </div>
  );
};

export default EspaceSwitch;
