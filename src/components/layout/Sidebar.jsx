import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaHome, FaUsers, FaTools, FaMoneyBillWave,
  FaTags, FaBoxes, FaCog, FaUserCog, FaHistory,
  FaClipboardList, FaWrench, FaChevronLeft, FaChevronRight,
  FaTrademark, FaMobileAlt
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
// ✅ Import du logo — adaptez le chemin selon votre projet
import logo from '../../assets/logo.png';

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { path: '/dashboard', icon: <FaHome />, label: 'Dashboard', module: 'dashboard' },
      ]
    },
    {
      title: 'Gestion',
      items: [
        { path: '/clients', icon: <FaUsers />, label: 'Clients', module: 'clients' },
        { path: '/reparations', icon: <FaTools />, label: 'Réparations', module: 'reparations' },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { path: '/familles', icon: <FaTags />, label: 'Familles', module: 'familles' },
        { path: '/categories', icon: <FaBoxes />, label: 'Catégories', module: 'categories' },
        { path: '/objets', icon: <FaClipboardList />, label: 'Objets', module: 'objets' },
        // ✅ NOUVEAU : Marques
        { path: '/marques', icon: <FaTrademark />, label: 'Marques', module: 'marques' },
        // ✅ NOUVEAU : Modèles
        { path: '/modeles', icon: <FaMobileAlt />, label: 'Modèles', module: 'modeles' },
        { path: '/statuses', icon: <FaCog />, label: 'Statuts', module: 'statuses' },
      ]
    },
    {
      title: 'Administration',
      items: [
        { path: '/users', icon: <FaUserCog />, label: 'Utilisateurs', module: 'users' },
      ]
    }
  ];

  const getRoleLabel = (role) => {
    const labels = { ADMIN: 'Admin', COMMERCIAL: 'Commercial', REPARATEUR: 'Réparateur' };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = { ADMIN: '#ef4444', COMMERCIAL: '#3b82f6', REPARATEUR: '#f59e0b' };
    return colors[role] || '#6b7280';
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <aside
        className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
      >
        {/* Header avec logo image */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Safi Info +" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-brand">
            <h5>Safi Info +</h5>
            <small>Gestion</small>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuSections.map((section, idx) => {
            const visibleItems = section.items.filter(item => hasPermission(item.module));
            if (visibleItems.length === 0) return null;

            return (
              <div className="nav-section" key={idx}>
                <div className="nav-section-title">{section.title}</div>

                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    title={isCollapsed ? item.label : ''}
                    onClick={() => {
                      if (window.innerWidth <= 992) onClose();
                    }}
                  >
                    <span className="nav-link-icon">{item.icon}</span>
                    <span className="nav-link-text">{item.label}</span>

                    {isCollapsed && (
                      <span className="nav-link-tooltip">{item.label}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
        >
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div
                className="sidebar-user-role"
                style={{ color: getRoleColor(user?.role) }}
              >
                {getRoleLabel(user?.role)}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          transform: translateX(0);
          transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }

        .sidebar.collapsed {
          transform: translateX(calc(var(--sidebar-width) * -1 + var(--sidebar-collapsed-width)));
        }

        .sidebar-header {
          padding: 20px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          min-height: 76px;
          overflow: hidden;
        }

        .sidebar-logo {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4361ee, #3a52c9);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.4);
          overflow: hidden;
        }

        .sidebar-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .sidebar-brand {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          transition: opacity 150ms ease;
        }

        .sidebar-brand h5 {
          font-size: 15px;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .sidebar-brand small {
          font-size: 10.5px;
          color: #94a3b8;
        }

        .sidebar-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 26px;
          cursor: pointer;
          margin-left: auto;
          padding: 0;
          width: 32px;
          height: 32px;
          display: none;
          align-items: center;
          justify-content: center;
          line-height: 1;
          border-radius: 8px;
        }

        .sidebar-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .nav-section { margin-bottom: 12px; }

        .nav-section-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
          padding: 8px 12px 4px;
          margin-bottom: 4px;
          white-space: nowrap;
        }

        .sidebar .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #cbd5e1;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: background 150ms ease, color 150ms ease;
          position: relative;
          margin-bottom: 2px;
          white-space: nowrap;
        }

        .sidebar .nav-link:hover {
          background: rgba(255, 255, 255, 0.06);
          color: white;
        }

        .sidebar .nav-link.active {
          background: linear-gradient(135deg, #4361ee, #3a52c9);
          color: white;
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.4);
        }

        .nav-link-icon {
          font-size: 15px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }

        .nav-link-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-link-tooltip {
          position: fixed;
          left: calc(var(--sidebar-collapsed-width) + 12px);
          background: #1e293b;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 150ms ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 1100;
          pointer-events: none;
        }

        .nav-link-tooltip::before {
          content: '';
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: #1e293b;
        }

        .sidebar.collapsed .nav-link {
          justify-content: center;
          padding: 12px;
          gap: 0;
        }

        .sidebar.collapsed .nav-link .nav-link-icon {
          opacity: 1;
          pointer-events: auto;
          font-size: 17px;
        }

        .sidebar.collapsed .nav-link:hover .nav-link-tooltip {
          opacity: 1;
          visibility: visible;
        }

        .sidebar-collapse-btn {
          position: absolute;
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #4361ee;
          border: 3px solid #0f172a;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          transition: all 150ms ease;
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.5);
        }

        .sidebar-collapse-btn:hover {
          background: #3a52c9;
          transform: translateY(-50%) scale(1.1);
        }

        @media (max-width: 992px) {
          .sidebar-collapse-btn { display: none; }
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          overflow: hidden;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          white-space: nowrap;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4361ee, #3a52c9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
          flex-shrink: 0;
        }

        .sidebar-user-info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          transition: opacity 150ms ease;
        }

        .sidebar-user-name {
          font-size: 12.5px;
          font-weight: 600;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-user-role {
          font-size: 10.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .sidebar.collapsed .sidebar-brand,
        .sidebar.collapsed .nav-section-title,
        .sidebar.collapsed .nav-link-text,
        .sidebar.collapsed .sidebar-user-info {
          opacity: 0;
          pointer-events: none;
        }

        .sidebar.collapsed .nav-link-icon {
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        .sidebar.collapsed .sidebar-user {
          justify-content: center;
          padding: 8px 0;
          background: transparent;
        }

        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: opacity 200ms ease, visibility 200ms ease;
        }

        .sidebar-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
            width: var(--sidebar-width);
            transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sidebar.open { transform: translateX(0); }
          .sidebar.collapsed { transform: translateX(-100%); width: var(--sidebar-width); }
          .sidebar.collapsed.open { transform: translateX(0); }

          .sidebar.collapsed .sidebar-brand,
          .sidebar.collapsed .nav-section-title,
          .sidebar.collapsed .nav-link-text,
          .sidebar.collapsed .sidebar-user-info {
            opacity: 1;
            pointer-events: auto;
          }

          .sidebar.collapsed .nav-link {
            justify-content: flex-start;
            padding: 10px 12px;
            gap: 12px;
          }

          .sidebar.collapsed .sidebar-user {
            justify-content: flex-start;
            padding: 8px;
            background: rgba(255, 255, 255, 0.04);
          }

          .sidebar-close-btn { display: flex; }
          .nav-link-tooltip { display: none; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;