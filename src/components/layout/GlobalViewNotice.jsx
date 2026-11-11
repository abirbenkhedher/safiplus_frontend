import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStore, FaTimes, FaGlobe } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { registerGlobalViewNotice } from '../../utils/boutiqueStorage';

// ============================================================
// ✅ VUE GLOBALE = CONSULTATION
// Affiché quand on tente d'ajouter / modifier des données d'une boutique
// en vue « Toutes les boutiques ». Propose de passer dans une boutique
// (on reste sur la même page).
// ============================================================
const DEFAULT_MESSAGE =
  "La vue « Toutes les boutiques » sert à consulter. Pour ajouter ou modifier, travaillez dans une boutique.";

const GlobalViewNotice = () => {
  const { boutiques, isAllBoutiques, changeBoutique } = useAuth();
  const location = useLocation();
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isAllBoutiques) return undefined;
    return registerGlobalViewNotice((msg) => setMessage(msg || DEFAULT_MESSAGE));
  }, [isAllBoutiques]);

  const close = useCallback(() => setMessage(null), []);

  useEffect(() => {
    if (!message) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [message, close]);

  if (!message) return null;

  return (
    <div className="gvn-backdrop" onClick={close}>
      <div
        className="gvn-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gvn-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gvn-head">
          <h2 id="gvn-title"><FaGlobe className="gvn-globe" /> Vue globale : consultation</h2>
          <button type="button" className="gvn-close" onClick={close} aria-label="Fermer">
            <FaTimes />
          </button>
        </div>
        <p className="gvn-sub">{message}</p>
        <p className="gvn-label">Passer dans la boutique :</p>
        <div className="gvn-list">
          {boutiques.map((b) => (
            <button
              key={b._id}
              type="button"
              className="gvn-item"
              onClick={() => changeBoutique(b._id, location.pathname)}
            >
              <FaStore className="gvn-icon" />
              <span className="gvn-name">{b.nom}</span>
              <span className="gvn-code">{b.code}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .gvn-backdrop {
    position: fixed; inset: 0; z-index: 3000;
    background: rgba(15, 23, 42, 0.45);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  }
  .gvn-card {
    width: 100%; max-width: 440px; background: var(--white, #fff);
    border-radius: 14px; padding: 20px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  }
  .gvn-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .gvn-head h2 {
    font-size: 17px; font-weight: 700; margin: 0; color: var(--gray-900, #0f172a);
    display: flex; align-items: center; gap: 8px;
  }
  .gvn-globe { color: #059669; }
  .gvn-close { border: none; background: transparent; cursor: pointer; color: var(--gray-500, #64748b); padding: 4px; }
  .gvn-sub { font-size: 13px; color: var(--gray-600, #475569); margin: 10px 0 14px; line-height: 1.5; }
  .gvn-label { font-size: 12px; font-weight: 600; color: var(--gray-500, #64748b); margin: 0 0 8px; }
  .gvn-list { display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; }
  .gvn-item {
    display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
    padding: 12px 14px; border: 1px solid var(--gray-200, #e5e7eb); border-radius: 10px;
    background: var(--white, #fff); color: inherit; cursor: pointer;
  }
  .gvn-item:hover, .gvn-item:focus-visible { border-color: var(--primary, #2563eb); outline: none; }
  .gvn-icon { color: var(--primary, #2563eb); flex-shrink: 0; }
  .gvn-name { font-weight: 600; font-size: 14px; flex: 1; }
  .gvn-code {
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
    background: var(--gray-100, #f1f5f9); color: var(--gray-600, #475569);
  }
  [data-theme="dark"] .gvn-card,
  [data-theme="dark"] .gvn-item { background: #1a1d27; border-color: #2d3140; color: #e5e7eb; }
  [data-theme="dark"] .gvn-head h2 { color: #e5e7eb; }
  [data-theme="dark"] .gvn-sub { color: #cbd5e1; }
  [data-theme="dark"] .gvn-code { background: #2d3140; color: #cbd5e1; }
`;

export default GlobalViewNotice;
