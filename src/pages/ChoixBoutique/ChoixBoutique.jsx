import { Navigate } from 'react-router-dom';
import { FaStore, FaMapMarkerAlt, FaPhone, FaSignOutAlt, FaGlobe } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// ✅ MULTI-TENANT : choix de la boutique après la connexion
// (utilisateurs ayant accès à plusieurs boutiques)
// ============================================================
const ChoixBoutique = () => {
  const { user, boutiques, activeBoutique, changeBoutique, isSuperAdmin, logout, canGlobalView } = useAuth();

  if (isSuperAdmin()) return <Navigate to="/organisations" replace />;
  if (boutiques.length <= 1) return <Navigate to="/" replace />;

  return (
    <div className="choix-boutique-page">
      <div className="choix-boutique-card">
        <div className="choix-boutique-head">
          <div>
            <h1>Bonjour {user?.firstName || user?.username} 👋</h1>
            <p>Choisissez la boutique dans laquelle vous voulez travailler.</p>
          </div>
          <button type="button" className="choix-boutique-logout" onClick={logout}>
            <FaSignOutAlt /> Déconnexion
          </button>
        </div>

        <div className="choix-boutique-grid">
          {canGlobalView && (
            <button
              type="button"
              className={`choix-boutique-item global ${activeBoutique === 'all' ? 'active' : ''}`}
              onClick={() => changeBoutique('all', '/')}
            >
              <span className="choix-boutique-icon"><FaGlobe /></span>
              <span className="choix-boutique-name">Toutes les boutiques</span>
              <span className="choix-boutique-code">VUE GLOBALE</span>
              <span className="choix-boutique-meta">
                Données de vos {boutiques.length} boutiques réunies
              </span>
            </button>
          )}
          {boutiques.map((b) => (
            <button
              key={b._id}
              type="button"
              className={`choix-boutique-item ${b._id === activeBoutique ? 'active' : ''}`}
              onClick={() => changeBoutique(b._id, '/')}
            >
              <span className="choix-boutique-icon"><FaStore /></span>
              <span className="choix-boutique-name">{b.nom}</span>
              <span className="choix-boutique-code">{b.code}</span>
              {b.adresse && (
                <span className="choix-boutique-meta"><FaMapMarkerAlt /> {b.adresse}</span>
              )}
              {b.telephone && (
                <span className="choix-boutique-meta"><FaPhone /> {b.telephone}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .choix-boutique-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--gray-50, #f8fafc);
  }
  .choix-boutique-card {
    width: 100%;
    max-width: 860px;
    background: var(--white, #fff);
    border: 1px solid var(--gray-200, #e5e7eb);
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }
  .choix-boutique-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .choix-boutique-head h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: var(--gray-900, #0f172a); }
  .choix-boutique-head p { margin: 0; font-size: 14px; color: var(--gray-500, #64748b); }
  .choix-boutique-logout {
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--gray-200, #e5e7eb); background: transparent;
    border-radius: 10px; padding: 8px 12px; font-size: 13px; cursor: pointer;
    color: var(--gray-600, #475569);
  }
  .choix-boutique-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
    gap: 14px;
  }
  .choix-boutique-item {
    display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
    text-align: left; padding: 18px; cursor: pointer;
    border: 1px solid var(--gray-200, #e5e7eb); border-radius: 14px;
    background: var(--white, #fff); color: inherit;
    transition: border-color .15s, box-shadow .15s, transform .15s;
  }
  .choix-boutique-item:hover, .choix-boutique-item:focus-visible {
    border-color: var(--primary, #2563eb);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.12);
    transform: translateY(-1px);
    outline: none;
  }
  .choix-boutique-item.active { border-color: var(--primary, #2563eb); }
  .choix-boutique-item.global { border-style: dashed; border-color: #059669; }
  .choix-boutique-item.global .choix-boutique-icon { background: #d1fae5; color: #059669; }
  .choix-boutique-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    background: var(--primary-light, #dbeafe); color: var(--primary, #2563eb);
    margin-bottom: 6px;
  }
  .choix-boutique-name { font-weight: 700; font-size: 15px; color: var(--gray-900, #0f172a); }
  .choix-boutique-code {
    font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px;
    background: var(--gray-100, #f1f5f9); color: var(--gray-600, #475569);
  }
  .choix-boutique-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gray-500, #64748b); }
  [data-theme="dark"] .choix-boutique-page { background: #0f1117; }
  [data-theme="dark"] .choix-boutique-card,
  [data-theme="dark"] .choix-boutique-item { background: #1a1d27; border-color: #2d3140; }
  [data-theme="dark"] .choix-boutique-head h1,
  [data-theme="dark"] .choix-boutique-name { color: #e5e7eb; }
  [data-theme="dark"] .choix-boutique-code { background: #2d3140; color: #cbd5e1; }
  @media (max-width: 576px) { .choix-boutique-card { padding: 20px; } }
`;

export default ChoixBoutique;
