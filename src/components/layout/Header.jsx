import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaSun, FaMoon, FaDesktop, FaChevronDown, 
  FaUser, FaSignOutAlt, FaKeyboard,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AlertesRetard from "./AlertesRetard";
import TeamMessages from "./TeamMessages";

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // États
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Refs pour fermer les dropdowns au clic extérieur
  const themeRef = useRef(null);
  const shortcutsRef = useRef(null);
  const userRef = useRef(null);

  // ============================================
  // RACCOURCIS CLAVIER
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + Touche
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        
        const shortcuts = {
          'd': '/dashboard',
          'c': '/clients',
          'r': '/reparations',
          'u': '/users',
          'f': '/familles',
          'g': '/categories',
          'o': '/objets',
          's': '/statuses',
          'h': '/history',
        };

        if (shortcuts[key]) {
          e.preventDefault();
          navigate(shortcuts[key]);
        }
      }

      // Échap ferme tous les menus
      if (e.key === 'Escape') {
        setShowThemeMenu(false);
        setShowShortcutsMenu(false);
        setShowUserMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeRef.current && !themeRef.current.contains(e.target)) {
        setShowThemeMenu(false);
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(e.target)) {
        setShowShortcutsMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // GESTION DU THÈME
  // ============================================
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', newTheme);
    }
    
    localStorage.setItem('theme', newTheme);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setShowThemeMenu(false);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <FaMoon />;
    if (theme === 'system') return <FaDesktop />;
    return <FaSun />;
  };

  // ============================================
  // BREADCRUMB
  // ============================================
  const getBreadcrumb = () => {
    const path = location.pathname;
    
    const breadcrumbs = {
      '/dashboard': { title: 'Tableau de bord', icon: '📊' },
      '/clients': { title: 'Clients', icon: '👥' },
      '/clients/new': { title: 'Nouveau client', icon: '➕', parent: 'Clients', parentPath: '/clients' },
      '/reparations': { title: 'Réparations', icon: '🔧' },
      '/reparations/new': { title: 'Nouvelle réparation', icon: '➕', parent: 'Réparations', parentPath: '/reparations' },
      '/familles': { title: 'Familles', icon: '📁' },
      '/categories': { title: 'Catégories', icon: '📂' },
      '/objets': { title: 'Objets', icon: '📦' },
      '/statuses': { title: 'Statuts', icon: '🏷️' },
      '/users': { title: 'Utilisateurs', icon: '👤' },
      '/history': { title: 'Historique', icon: '📜' },
      '/paiements': { title: 'Paiements', icon: '💰' },
    };

    if (path.includes('/clients/edit/')) {
      return { title: 'Modifier un client', icon: '✏️', parent: 'Clients', parentPath: '/clients' };
    }
    if (path.match(/^\/clients\/[a-f0-9]+$/)) {
      return { title: 'Détail client', icon: '👁️', parent: 'Clients', parentPath: '/clients' };
    }
    if (path.includes('/reparations/edit/')) {
      return { title: 'Modifier une réparation', icon: '✏️', parent: 'Réparations', parentPath: '/reparations' };
    }
    if (path.match(/^\/reparations\/[a-f0-9]+$/)) {
      return { title: 'Détail réparation', icon: '👁️', parent: 'Réparations', parentPath: '/reparations' };
    }

    return breadcrumbs[path] || { title: 'Page', icon: '📄' };
  };

  const breadcrumb = getBreadcrumb();

  // ============================================
  // RACCOURCIS (pour le menu)
  // ============================================
  const shortcuts = [
    { keys: ['Alt', 'D'], label: 'Tableau de bord', action: () => navigate('/dashboard') },
    { keys: ['Alt', 'C'], label: 'Clients', action: () => navigate('/clients') },
    { keys: ['Alt', 'R'], label: 'Réparations', action: () => navigate('/reparations') },
    { keys: ['Alt', 'F'], label: 'Familles', action: () => navigate('/familles') },
    { keys: ['Alt', 'G'], label: 'Catégories', action: () => navigate('/categories') },
    { keys: ['Alt', 'O'], label: 'Objets', action: () => navigate('/objets') },
    { keys: ['Alt', 'S'], label: 'Statuts', action: () => navigate('/statuses') },
    { keys: ['Alt', 'U'], label: 'Utilisateurs', action: () => navigate('/users') },
    { keys: ['Alt', 'H'], label: 'Historique', action: () => navigate('/history') },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    const labels = {
      ADMIN: 'Administrateur',
      COMMERCIAL: 'Commercial',
      REPARATEUR: 'Réparateur'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: '#ef4444',
      COMMERCIAL: '#3b82f6',
      REPARATEUR: '#f59e0b'
    };
    return colors[role] || '#6b7280';
  };

  return (
    <header className="app-header">
      {/* Bouton menu mobile */}
      <button 
        className="header-menu-btn d-lg-none"
        onClick={onToggleSidebar}
      >
        ☰
      </button>

      {/* BREADCRUMB */}
      <div className="header-breadcrumb">
        {breadcrumb.parent && (
          <>
            <button 
              className="header-breadcrumb-parent"
              onClick={() => navigate(breadcrumb.parentPath)}
            >
              {breadcrumb.parent}
            </button>
            <span className="header-breadcrumb-separator">/</span>
          </>
        )}
        <div className="header-breadcrumb-current">
          <span className="header-breadcrumb-icon">{breadcrumb.icon}</span>
          <span className="header-breadcrumb-title">{breadcrumb.title}</span>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="header-actions">
        
        {/* ✅ ALERTES DE DÉLAI (+48h) — Cloche clignotante */}
        <AlertesRetard />
         {/* ✅ Messages d'équipe */}
  <TeamMessages />

        {/* Raccourcis clavier */}
        <div ref={shortcutsRef} style={{ position: 'relative' }}>
          <button 
            className={`header-icon-btn ${showShortcutsMenu ? 'active' : ''}`}
            onClick={() => {
              setShowShortcutsMenu(!showShortcutsMenu);
              setShowThemeMenu(false);
              setShowUserMenu(false);
            }}
            title="Raccourcis clavier"
          >
            <FaKeyboard />
          </button>

          {showShortcutsMenu && (
            <div className="header-dropdown-menu" style={{ minWidth: '280px' }}>
              <div className="header-dropdown-header">
                <strong>⌨️ Raccourcis clavier</strong>
              </div>
              <div className="header-dropdown-list">
                {shortcuts.map((shortcut, i) => (
                  <div 
                    key={i}
                    className="header-shortcut-item"
                    onClick={() => {
                      shortcut.action();
                      setShowShortcutsMenu(false);
                    }}
                  >
                    <span>{shortcut.label}</span>
                    <div className="header-shortcut-keys">
                      {shortcut.keys.map((key, j) => (
                        <React.Fragment key={j}>
                          <kbd>{key}</kbd>
                          {j < shortcut.keys.length - 1 && <span>+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thème */}
        <div ref={themeRef} style={{ position: 'relative' }}>
          <button 
            className={`header-icon-btn ${showThemeMenu ? 'active' : ''}`}
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowShortcutsMenu(false);
              setShowUserMenu(false);
            }}
            title="Thème"
          >
            {getThemeIcon()}
          </button>

          {showThemeMenu && (
            <div className="header-dropdown-menu" style={{ minWidth: '180px' }}>
              <div className="header-dropdown-header">
                <strong>🎨 Apparence</strong>
              </div>
              <div className="header-dropdown-list">
                {[
                  { value: 'light', label: 'Clair', icon: <FaSun /> },
                  { value: 'dark', label: 'Sombre', icon: <FaMoon /> },
                  { value: 'system', label: 'Système', icon: <FaDesktop /> },
                ].map((option) => (
                  <div
                    key={option.value}
                    className={`header-theme-item ${theme === option.value ? 'active' : ''}`}
                    onClick={() => handleThemeChange(option.value)}
                  >
                    <span className="header-theme-icon">{option.icon}</span>
                    <span>{option.label}</span>
                    {theme === option.value && <span className="header-theme-check">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="header-divider"></div>

        {/* Menu utilisateur */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button 
            className={`header-user-btn ${showUserMenu ? 'active' : ''}`}
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowThemeMenu(false);
              setShowShortcutsMenu(false);
            }}
          >
            <div className="header-user-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="header-user-info d-none d-md-flex">
              <span className="header-user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span 
                className="header-user-role"
                style={{ color: getRoleColor(user?.role) }}
              >
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <FaChevronDown 
              size={10} 
              className={`header-user-chevron ${showUserMenu ? 'rotated' : ''}`}
            />
          </button>

          {showUserMenu && (
            <div className="header-dropdown-menu" style={{ minWidth: '240px' }}>
              <div className="header-user-dropdown-header">
                <div className="header-user-avatar-large">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="header-user-name-large">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="header-user-email">{user?.email}</div>
                  <span 
                    className="badge-modern"
                    style={{ 
                      background: `${getRoleColor(user?.role)}20`,
                      color: getRoleColor(user?.role),
                      marginTop: '6px',
                    }}
                  >
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>

              <div className="header-dropdown-list">
                <div 
                  className="header-dropdown-item"
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                >
                  <FaUser size={13} />
                  <span>Mon profil</span>
                </div>

                <div 
                  className="header-dropdown-item header-dropdown-item-danger"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt size={13} />
                  <span>Déconnexion</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .app-header {
          height: var(--header-height);
          position: fixed;
          top: 0;
          left: var(--sidebar-width);
          right: 0;
          background: white;
          border-bottom: 1px solid var(--gray-200);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 24px;
          z-index: 998;
          transition: left 250ms ease;
        }

        .header-menu-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 10px;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
          cursor: pointer;
          font-size: 18px;
          transition: all 150ms ease;
          display: none;
        }

        .header-menu-btn:hover {
          background: var(--gray-100);
          color: var(--primary);
        }

        .header-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .header-breadcrumb-parent {
          background: transparent;
          border: none;
          color: var(--gray-500);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 6px;
          transition: all 150ms ease;
        }

        .header-breadcrumb-parent:hover {
          background: var(--gray-100);
          color: var(--primary);
        }

        .header-breadcrumb-separator {
          color: var(--gray-300);
          font-size: 14px;
        }

        .header-breadcrumb-current {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--primary-light);
          border-radius: 8px;
          font-weight: 600;
        }

        .header-breadcrumb-icon {
          font-size: 15px;
        }

        .header-breadcrumb-title {
          font-size: 13.5px;
          color: var(--primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .header-icon-btn {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
          cursor: pointer;
          position: relative;
          transition: all 150ms ease;
          font-size: 16px;
        }

        .header-icon-btn:hover,
        .header-icon-btn.active {
          background: var(--primary-light);
          color: var(--primary);
        }

        .header-divider {
          width: 1px;
          height: 24px;
          background: var(--gray-200);
          margin: 0 8px;
        }

        .header-user-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 10px 5px 5px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .header-user-btn:hover,
        .header-user-btn.active {
          background: var(--gray-50);
          border-color: var(--gray-200);
        }

        .header-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(67, 97, 238, 0.25);
        }

        .header-user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .header-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-800);
        }

        .header-user-role {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .header-user-chevron {
          color: var(--gray-400);
          transition: transform 200ms ease;
        }

        .header-user-chevron.rotated {
          transform: rotate(180deg);
        }

        .header-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid var(--gray-200);
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          z-index: 1100;
          overflow: hidden;
          animation: dropdownIn 0.15s ease-out;
        }

        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-dropdown-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--gray-100);
          background: var(--gray-50);
          font-size: 12px;
          color: var(--gray-700);
        }

        .header-dropdown-list {
          padding: 6px;
        }

        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 150ms ease;
          font-weight: 500;
        }

        .header-dropdown-item:hover {
          background: var(--primary-light);
          color: var(--primary);
        }

        .header-dropdown-item-danger:hover {
          background: var(--danger-light);
          color: var(--danger);
        }

        .header-shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .header-shortcut-item:hover {
          background: var(--gray-100);
        }

        .header-shortcut-keys {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--gray-400);
        }

        .header-shortcut-keys kbd {
          background: var(--gray-100);
          border: 1px solid var(--gray-200);
          border-radius: 4px;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 10px;
          color: var(--gray-700);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .header-theme-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13.5px;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 150ms ease;
          font-weight: 500;
        }

        .header-theme-item:hover {
          background: var(--gray-100);
        }

        .header-theme-item.active {
          background: var(--primary-light);
          color: var(--primary);
          font-weight: 600;
        }

        .header-theme-icon {
          font-size: 15px;
        }

        .header-theme-check {
          margin-left: auto;
          color: var(--primary);
          font-weight: 700;
        }

        .header-user-dropdown-header {
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          border-bottom: 1px solid var(--gray-100);
        }

        .header-user-avatar-large {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }

        .header-user-name-large {
          font-size: 14px;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 2px;
        }

        .header-user-email {
          font-size: 11.5px;
          color: var(--gray-500);
          word-break: break-all;
        }

        @media (max-width: 992px) {
          .app-header {
            left: 0;
            padding: 0 16px;
          }

          .header-menu-btn {
            display: flex;
          }
        }

        @media (max-width: 576px) {
          .header-breadcrumb-parent {
            display: none;
          }

          .header-breadcrumb-separator {
            display: none;
          }

          .header-divider {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;