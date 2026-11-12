import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaTimes, FaChevronRight } from "react-icons/fa";
import { getStock } from "../../api/stock";
import { useAuth } from "../../context/AuthContext";

// ============================================================
// ✅ ALERTES STOCK (header, à côté de l'alerte de retard)
// Pièces en rupture (quantité 0) ou sous leur seuil d'alerte.
// Rafraîchi toutes les 5 minutes et au retour sur l'onglet.
// ============================================================
const REFRESH_MS = 5 * 60 * 1000;

const libelle = (s) =>
  [s.code, s.typeArticle?.nom, s.categorie?.nom, s.marque?.nom, s.modele?.nom]
    .filter(Boolean)
    .join(" ") || "Pièce sans nom";

const AlertesStock = () => {
  const { hasAnyPermission } = useAuth();
  const visible = hasAnyPermission(["stock", "stock:read"]);
  const [isOpen, setIsOpen] = useState(false);
  const [alertes, setAlertes] = useState([]);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 640 : false
  );
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const charger = useCallback(
    () =>
      getStock({ etat: "rupture,faible", limit: "all" })
        .then((res) => {
          const list = (res.data?.data || []).filter((s) => s.etat === "rupture" || s.etat === "faible");
          // Ruptures d'abord, puis les plus faibles quantités
          list.sort((a, b) =>
            a.etat === b.etat ? a.quantite - b.quantite : a.etat === "rupture" ? -1 : 1
          );
          setAlertes(list);
        })
        .catch(() => setAlertes([])),
    []
  );

  useEffect(() => {
    if (!visible) return undefined;
    charger();
    const timer = setInterval(charger, REFRESH_MS);
    const onFocus = () => charger();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [visible, charger]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fermer au clic extérieur / Échap
  useEffect(() => {
    if (!isOpen) return undefined;
    const outside = (e) => {
      if (panelRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setIsOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("touchstart", outside);
    window.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("touchstart", outside);
      window.removeEventListener("keydown", esc);
    };
  }, [isOpen]);

  if (!visible || alertes.length === 0) return null;

  const ruptures = alertes.filter((s) => s.etat === "rupture").length;
  const count = alertes.length;
  const ouvrirStock = () => {
    setIsOpen(false);
    navigate("/stock");
  };

  return (
    <div style={{ position: "relative" }}>
      {/* BOUTON */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`${count} pièce(s) en alerte de stock`}
        aria-label={`${count} pièce(s) en alerte de stock`}
        className={`as-btn ${isOpen ? "open" : ""}`}
      >
        <FaBoxOpen />
        <span className="as-badge">{count > 9 ? "9+" : count}</span>
      </button>

      {isOpen && isMobile && <div className="as-overlay" onClick={() => setIsOpen(false)} />}

      {/* PANNEAU */}
      {isOpen && (
        <div ref={panelRef} className={`as-panel ${isMobile ? "mobile" : ""}`}>
          <div className="as-head">
            <div className="as-head-icon"><FaBoxOpen /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="as-title">Alertes de stock</div>
              <div className="as-sub">
                {ruptures > 0 && `${ruptures} en rupture · `}
                {count - ruptures} sous le seuil
              </div>
            </div>
            <button type="button" className="as-close" onClick={() => setIsOpen(false)} aria-label="Fermer">
              <FaTimes size={12} />
            </button>
          </div>

          <div className="as-list">
            {alertes.map((s) => {
              const rupture = s.etat === "rupture";
              return (
                <div key={s._id} className="as-item" onClick={ouvrirStock}>
                  <div className={`as-dot ${rupture ? "rupture" : "faible"}`}>{rupture ? "0" : s.quantite}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="as-name" title={libelle(s)}>{libelle(s)}</div>
                    <div className={`as-state ${rupture ? "rupture" : "faible"}`}>
                      {rupture ? "Rupture de stock" : `Reste ${s.quantite} · seuil ${s.seuilAlerte}`}
                    </div>
                  </div>
                  <FaChevronRight size={12} style={{ color: "#d97706", flexShrink: 0 }} />
                </div>
              );
            })}
          </div>

          <div className="as-foot">
            <button type="button" onClick={ouvrirStock}>Voir le stock →</button>
          </div>
        </div>
      )}
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .as-btn {
    position: relative; width: 42px; height: 42px; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #fffbeb, #fef3c7); color: #d97706; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.18); transition: all 200ms ease;
  }
  @media (max-width: 576px) { .as-btn { width: 36px; height: 36px; font-size: 16px; } }
  .as-btn.open { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); }
  .as-badge {
    position: absolute; top: -6px; right: -6px; min-width: 20px; height: 20px; border-radius: 10px;
    background: #d97706; color: #fff; font-size: 11px; font-weight: 800; display: flex;
    align-items: center; justify-content: center; padding: 0 5px; border: 2px solid #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  }
  .as-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9998; }
  .as-panel {
    position: absolute; top: calc(100% + 10px); right: 0; width: 380px; max-width: calc(100vw - 32px);
    max-height: 520px; background: #fff; border-radius: 16px; border: 1px solid var(--gray-200, #e5e7eb);
    box-shadow: 0 12px 32px rgba(0,0,0,0.15); overflow: hidden; z-index: 9999;
    display: flex; flex-direction: column;
  }
  .as-panel.mobile { position: fixed; top: 70px; left: 8px; right: 8px; width: auto; max-height: calc(100vh - 90px); }
  .as-head {
    padding: 16px 18px; background: linear-gradient(135deg, #fef3c7, #fffbeb);
    border-bottom: 1px solid #fde68a; display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }
  .as-head-icon {
    width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #fff; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
  }
  .as-title { font-size: 13px; font-weight: 800; color: #92400e; }
  .as-sub { font-size: 11.5px; font-weight: 600; color: #b45309; }
  .as-close {
    width: 28px; height: 28px; border-radius: 6px; border: none; background: #fff; color: #92400e;
    cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .as-list { flex: 1; overflow-y: auto; min-height: 0; -webkit-overflow-scrolling: touch; }
  .as-item {
    padding: 12px 18px; border-bottom: 1px solid var(--gray-100, #f3f4f6); cursor: pointer;
    display: flex; align-items: center; gap: 12px; background: #fff; transition: background 150ms ease;
  }
  .as-item:hover { background: #fffbeb; }
  .as-dot {
    width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; flex-shrink: 0;
  }
  .as-dot.rupture { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
  .as-dot.faible { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
  .as-name { font-size: 12.5px; font-weight: 700; color: var(--gray-800, #1f2937); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .as-state { font-size: 11px; font-weight: 600; margin-top: 2px; }
  .as-state.rupture { color: #dc2626; }
  .as-state.faible { color: #b45309; }
  .as-foot { padding: 12px 18px; background: var(--gray-50, #f9fafb); border-top: 1px solid var(--gray-200, #e5e7eb); text-align: center; flex-shrink: 0; }
  .as-foot button { background: none; border: none; color: var(--primary, #2563eb); font-size: 12px; font-weight: 700; cursor: pointer; }
  [data-theme="dark"] .as-panel, [data-theme="dark"] .as-item, [data-theme="dark"] .as-close { background: #1a1d27; border-color: #2d3140; }
  [data-theme="dark"] .as-item:hover { background: #2a2416; }
  [data-theme="dark"] .as-name { color: #e5e7eb; }
  [data-theme="dark"] .as-foot { background: #151821; border-color: #2d3140; }
`;

export default AlertesStock;
