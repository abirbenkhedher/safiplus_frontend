import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome, FaUserClock, FaUsers, FaTools, FaMoneyBillWave,
  FaTags, FaBoxes, FaCog, FaUserCog,
  FaClipboardList, FaChevronLeft, FaChevronRight, FaChevronDown,
  FaTrademark, FaMobileAlt, FaExclamationTriangle, FaPlus,
  FaChartLine, FaMapMarkerAlt, FaWarehouse, FaReceipt, FaStore, FaBuilding,
  FaFileInvoice, FaTruck, FaExchangeAlt, FaWallet, FaLock, FaSlidersH,
  FaFileInvoiceDollar, FaHandHoldingUsd, FaCashRegister, FaMoneyCheckAlt, FaChartBar, FaGlobe,
  FaSearch, FaTimes,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useReparationModal } from '../../context/ReparationModalContext';
import EspaceSwitch from './EspaceSwitch';
import logo from '../../assets/logo.png';

// Sections repliées (préférence locale du navigateur)
const SECTIONS_KEY = 'sidebarSections.v2';
const normaliser = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// ============================================================
// ✅ MENU LATÉRAL
//  - bascule Atelier / Commerce en haut, couleur d'accent par espace
//  - bouton d'action principal de l'espace
//  - recherche de page (Ctrl+K)
//  - item.espace : 'atelier' | 'commerce' (absent = commun aux deux)
// ============================================================
const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const {
    user, hasPermission, hasAnyRole, isSuperAdmin, isOwner, isAdmin, activeBoutique,
    hasModule, espaceActif, isAllBoutiques, currentBoutique,
  } = useAuth();
  const { openNewReparation } = useReparationModal();
  const location = useLocation();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState('');
  const rechercheRef = useRef(null);
  const fermerSiMobile = () => { if (window.innerWidth <= 992) onClose(); };

  const menuSections = [
    {
      id: 'principal',
      items: [
        { path: '/dashboard', icon: <FaHome />, label: 'Tableau de bord', module: 'dashboard', espace: 'atelier' },
        { path: '/mon-tableau-de-bord', icon: <FaUserClock />, label: 'Mon tableau de bord', module: 'mon_dashboard', employeOnly: true, espace: 'atelier' },
        { path: '/commerce', icon: <FaHome />, label: 'Tableau de bord', anyModule: ['rapport_commercial', 'rapports', 'ventes', 'ventes:read'], espace: 'commerce' },
        { path: '/reparations', icon: <FaTools />, label: 'Réparations', module: 'reparations', espace: 'atelier' },
        { path: '/comptoir', icon: <FaCashRegister />, label: 'Vente comptoir', anyModule: ['comptoir', 'ventes'], espace: 'commerce' },
        { path: '/ventes', icon: <FaFileInvoiceDollar />, label: 'Devis & factures', anyModule: ['ventes', 'ventes:read'], espace: 'commerce' },
        { path: '/reglements', icon: <FaHandHoldingUsd />, label: 'Règlements & créances', anyModule: ['reglements', 'ventes', 'ventes:read'], espace: 'commerce' },
        { path: '/caisse', icon: <FaMoneyCheckAlt />, label: 'Caisse', anyModule: ['caisse', 'clotures_rouvrir'], espace: 'commerce' },
        { path: '/clients', icon: <FaUsers />, label: 'Clients', module: 'clients' },
      ],
    },
    {
      id: 'stock',
      title: 'Stock & achats',
      collapsible: true,
      items: [
        { path: '/stock', icon: <FaWarehouse />, label: espaceActif === 'commerce' ? 'Produits' : 'Pièces & stock', anyModule: ['stock', 'stock:read'] },
        { path: '/achats', icon: <FaFileInvoice />, label: "Factures d'achat", anyModule: ['achats', 'depenses'] },
        { path: '/fournisseurs', icon: <FaTruck />, label: 'Fournisseurs', anyModule: ['fournisseurs', 'achats'] },
        { path: '/stock-operations', icon: <FaExchangeAlt />, label: 'Transferts / inventaire', module: 'stock' },
      ],
    },
    {
      id: 'finances',
      title: 'Finances',
      collapsible: true,
      items: [
        { path: '/depenses', icon: <FaReceipt />, label: 'Dépenses', module: 'depenses' },
        { path: '/remuneration', icon: <FaMoneyBillWave />, label: 'Rémunérations', anyModule: ['remuneration', 'remuneration_autrui', 'remuneration_regles', 'commissions_valider', 'paiements_reparateurs'], espace: 'atelier' },
        { path: '/ma-remuneration', icon: <FaWallet />, label: 'Ma rémunération', roles: ['REPARATEUR', 'COMMERCIAL'], espace: 'atelier' },
        { path: '/clotures', icon: <FaLock />, label: 'Clôtures', anyModule: ['clotures', 'clotures_rouvrir'], espace: 'atelier' },
      ],
    },
    {
      id: 'analyses',
      title: 'Analyses',
      collapsible: true,
      items: [
        { path: '/statistiques', icon: <FaChartLine />, label: 'Statistiques atelier', anyModule: ['statistiques', 'rapports'], espace: 'atelier' },
        { path: '/rapport-commercial', icon: <FaChartBar />, label: 'Statistiques commerciales', anyModule: ['rapport_commercial', 'rapports'], espace: 'commerce' },
        { path: '/vue-globale', icon: <FaGlobe />, label: 'Vue globale', anyModule: ['statistiques', 'rapports', 'rapport_commercial'], requiresModule: 'commercial', vueGlobaleSeulement: true },
      ],
    },
    {
      id: 'configuration',
      title: 'Configuration',
      collapsible: true,
      defaultClosed: true,
      items: [
        // Ordre de la hiérarchie : famille → catégorie → objet → marque → modèle
        { path: '/familles', icon: <FaTags />, label: 'Familles', module: 'familles' },
        { path: '/categories', icon: <FaBoxes />, label: 'Catégories', module: 'categories' },
        { path: '/objets', icon: <FaClipboardList />, label: 'Objets', module: 'objets' },
        { path: '/marques', icon: <FaTrademark />, label: 'Marques', module: 'marques' },
        { path: '/modeles', icon: <FaMobileAlt />, label: 'Modèles', module: 'modeles' },
        { path: '/pannes', icon: <FaExclamationTriangle />, label: 'Pannes', module: 'pannes', espace: 'atelier' },
        { path: '/statuses', icon: <FaCog />, label: 'Statuts', module: 'statuses', espace: 'atelier' },
        { path: '/zones', icon: <FaMapMarkerAlt />, label: 'Zones', anyModule: ['zones', 'clients'] },
        { path: '/boutiques', icon: <FaStore />, label: 'Mes boutiques', owner: true },
        { path: '/users', icon: <FaUserCog />, label: 'Utilisateurs', module: 'users' },
        { path: '/parametres-atelier', icon: <FaSlidersH />, label: 'Paramètres', module: 'parametres_atelier' },
      ],
    },
    {
      id: 'plateforme',
      title: 'Plateforme',
      items: [
        { path: '/organisations', icon: <FaBuilding />, label: 'Backoffice (sociétés)', superAdmin: true },
      ],
    },
  ];

  // ✅ Filtre de visibilité : espace, module, rôle, permission
  const isVisible = (item) => {
    if (item.espace === 'commerce' && !hasModule('commercial')) return false;
    if (item.requiresModule && !hasModule(item.requiresModule)) return false;
    if (item.vueGlobaleSeulement && !isAllBoutiques) return false;
    if (item.espace && item.espace !== espaceActif) return false;
    if (item.employeOnly && isAdmin()) return false;
    // Super admin : plateforme hors boutique ; tout une fois entré dans une boutique
    if (isSuperAdmin()) return !!item.superAdmin || !!activeBoutique;
    if (item.superAdmin) return false;
    if (item.owner) return isOwner();
    if (item.roles?.length) return hasAnyRole(item.roles);
    if (item.module) return hasPermission(item.module);
    if (item.anyModule) return item.anyModule.some((m) => hasPermission(m));
    return true;
  };

  const sections = menuSections
    .map((s) => ({ ...s, items: s.items.filter(isVisible) }))
    .filter((s) => s.items.length > 0);

  // ✅ Recherche de page
  const q = normaliser(recherche.trim());
  const resultats = q ? sections.flatMap((s) => s.items).filter((i) => normaliser(i.label).includes(q)) : [];

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        rechercheRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ouvrir = (path) => { setRecherche(''); navigate(path); fermerSiMobile(); };

  // ✅ Sections repliées (mémorisées)
  const [closed, setClosed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SECTIONS_KEY) || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch { /* stockage indisponible */ }
    return Object.fromEntries(menuSections.filter((s) => s.defaultClosed).map((s) => [s.id, true]));
  });
  const toggleSection = (id) => {
    setClosed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(next)); } catch { /* ignoré */ }
      return next;
    });
  };

  // ✅ Action principale de l'espace
  const action = espaceActif === 'commerce'
    ? (hasModule('commercial') && (hasPermission('comptoir') || hasPermission('ventes'))
      ? { label: 'Vente comptoir', icon: <FaCashRegister />, onClick: () => ouvrir('/comptoir') } : null)
    : (hasPermission('reparations')
      ? { label: 'Nouvelle réparation', icon: <FaPlus />, onClick: () => { openNewReparation(); fermerSiMobile(); } } : null);
  const montrerAction = action && (!isSuperAdmin() || !!activeBoutique);

  const getRoleLabel = (role) => {
    if (role === 'ADMIN' && user?.isOwner) return 'Propriétaire';
    const labels = { SUPER_ADMIN: 'Super admin', ADMIN: 'Admin', COMMERCIAL: 'Commercial', REPARATEUR: 'Réparateur' };
    return labels[role] || role;
  };

  // "/stock" ne doit pas rester actif sur "/stock-operations"
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
      title={isCollapsed ? item.label : undefined}
      onClick={fermerSiMobile}
    >
      <span className="nav-link-icon">{item.icon}</span>
      <span className="nav-link-text">{item.label}</span>
      {isCollapsed && <span className="nav-link-tooltip">{item.label}</span>}
    </NavLink>
  );

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`} data-espace={espaceActif}>
        {/* ---------- En-tête ---------- */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo} alt="Safi Info +" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-brand">
            <h5>Safi Info +</h5>
            <small>{isAllBoutiques ? 'Toutes les boutiques' : currentBoutique?.nom || 'Gestion'}</small>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Fermer le menu">×</button>
        </div>

        {/* ---------- Espace + action + recherche ---------- */}
        <div className="sidebar-tools">
          {/* Menu replié (bureau uniquement) : bascule en icônes */}
          <EspaceSwitch compact={isCollapsed && window.innerWidth > 992} />
          {montrerAction && (
            <button type="button" className="sidebar-action" onClick={action.onClick} title={action.label}>
              <span className="sidebar-action-icon">{action.icon}</span>
              <span className="sidebar-action-text">{action.label}</span>
            </button>
          )}
          <div className="sidebar-search">
            <FaSearch className="sidebar-search-icon" aria-hidden="true" />
            <input
              ref={rechercheRef}
              type="search"
              placeholder="Rechercher une page…"
              aria-label="Rechercher une page du menu"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resultats[0]) ouvrir(resultats[0].path);
                if (e.key === 'Escape') setRecherche('');
              }}
            />
            {recherche
              ? <button type="button" className="sidebar-search-clear" onClick={() => setRecherche('')} aria-label="Effacer"><FaTimes /></button>
              : <kbd className="sidebar-search-kbd">Ctrl K</kbd>}
          </div>
        </div>

        {/* ---------- Navigation ---------- */}
        <nav className="sidebar-nav" aria-label="Menu principal">
          {recherche.trim() ? (
            <div className="nav-section">
              <div className="nav-section-title">Résultats</div>
              {resultats.length === 0 && <div className="nav-empty">Aucune page trouvée</div>}
              {resultats.map(renderItem)}
            </div>
          ) : sections.map((section) => {
            // Section de la page affichée : toujours ouverte. Menu replié : tout visible.
            const hasActive = section.items.some((i) => isActive(i.path));
            const isClosed = section.collapsible && !!closed[section.id] && !hasActive && !isCollapsed;
            const listId = `nav-section-${section.id}`;
            return (
              <div className={`nav-section ${section.title ? '' : 'no-title'}`} key={section.id}>
                {section.title && (section.collapsible ? (
                  <button
                    type="button"
                    className="nav-section-title nav-section-toggle"
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={!isClosed}
                    aria-controls={listId}
                    disabled={hasActive}
                  >
                    <span>{section.title}</span>
                    {!hasActive && <FaChevronDown className={`nav-section-chevron ${isClosed ? 'closed' : ''}`} />}
                  </button>
                ) : (
                  <div className="nav-section-title">{section.title}</div>
                ))}
                <div id={listId} className="nav-section-items" hidden={isClosed}>
                  {section.items.map(renderItem)}
                </div>
              </div>
            );
          })}
        </nav>

        <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={isCollapsed ? 'Déplier le menu' : 'Replier le menu'} aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>

        {/* ---------- Utilisateur ---------- */}
        <div className="sidebar-footer">
          <div className="sidebar-user" title={isCollapsed ? `${user?.firstName || ''} ${user?.lastName || ''}` : undefined}>
            <div className="sidebar-user-avatar">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role">{getRoleLabel(user?.role)}</div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        .sidebar {
          --accent: #4361ee;
          --accent-2: #3a52c9;
          --accent-soft: rgba(67, 97, 238, 0.16);
          --sb-text: #cbd5e1;
          --sb-muted: #7c8aa0;
          --sb-line: rgba(255, 255, 255, 0.07);
          width: var(--sidebar-width);
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background: #0f172a;
          background-image: linear-gradient(180deg, #172036 0%, #0f172a 60%);
          color: white;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        /* ✅ Couleur d'accent de l'espace Commerce (contraste texte blanc ≥ 4.5) */
        .sidebar[data-espace="commerce"] {
          --accent: #c2410c;
          --accent-2: #9a3412;
          --accent-soft: rgba(234, 88, 12, 0.18);
        }
        .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

        /* ---------- En-tête ---------- */
        .sidebar-header {
          padding: 18px 16px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .sidebar-logo {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; overflow: hidden;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          display: flex; align-items: center; justify-content: center;
          transition: background 200ms ease;
        }
        .sidebar-logo-img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .sidebar-brand { flex: 1; min-width: 0; white-space: nowrap; }
        .sidebar-brand h5 { font-size: 15px; font-weight: 700; margin: 0; color: white; }
        .sidebar-brand small { display: block; font-size: 11px; color: var(--sb-muted); overflow: hidden; text-overflow: ellipsis; }
        .sidebar-close-btn {
          background: transparent; border: none; color: var(--sb-muted); font-size: 26px; cursor: pointer;
          margin-left: auto; padding: 0; width: 32px; height: 32px; display: none;
          align-items: center; justify-content: center; line-height: 1; border-radius: 8px;
        }
        .sidebar-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: white; }

        /* ---------- Outils : espace, action, recherche ---------- */
        .sidebar-tools {
          padding: 0 12px 12px;
          display: flex; flex-direction: column; gap: 10px;
          border-bottom: 1px solid var(--sb-line);
          flex-shrink: 0;
        }
        .sidebar-action {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 10px 12px; border: none; border-radius: 10px; cursor: pointer;
          background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: white;
          font-size: 13.5px; font-weight: 700; white-space: nowrap;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
          transition: transform 150ms ease, filter 150ms ease;
        }
        .sidebar-action:hover { filter: brightness(1.08); transform: translateY(-1px); }
        .sidebar-action:focus-visible { outline: 2px solid white; outline-offset: 2px; }
        .sidebar-action-icon { display: flex; font-size: 13px; }

        .sidebar-search { position: relative; display: flex; align-items: center; }
        .sidebar-search-icon { position: absolute; left: 11px; font-size: 12px; color: var(--sb-muted); pointer-events: none; }
        .sidebar-search input {
          width: 100%; padding: 8px 56px 8px 32px; border-radius: 9px;
          border: 1px solid var(--sb-line); background: rgba(255, 255, 255, 0.05);
          color: white; font-size: 13px; outline: none;
          transition: border-color 150ms ease, background 150ms ease;
        }
        .sidebar-search input::placeholder { color: var(--sb-muted); }
        .sidebar-search input:focus { border-color: var(--accent); background: rgba(255, 255, 255, 0.08); }
        .sidebar-search input::-webkit-search-cancel-button { display: none; }
        .sidebar-search-kbd {
          position: absolute; right: 8px; font-size: 10px; font-family: inherit; color: var(--sb-muted);
          border: 1px solid var(--sb-line); border-radius: 5px; padding: 1px 5px; background: transparent; pointer-events: none;
        }
        .sidebar-search-clear {
          position: absolute; right: 6px; border: none; background: transparent; color: var(--sb-muted);
          cursor: pointer; padding: 4px; display: flex; border-radius: 6px;
        }
        .sidebar-search-clear:hover { color: white; }

        /* ---------- Navigation ---------- */
        .sidebar-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 10px;
          scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 2px; }
        .nav-section { margin-bottom: 8px; }
        .nav-section-title {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.9px;
          color: var(--sb-muted); padding: 8px 10px 4px; white-space: nowrap;
        }
        .nav-section-toggle {
          display: flex; align-items: center; justify-content: space-between; width: 100%;
          background: transparent; border: none; border-radius: 8px; cursor: pointer; text-align: left;
        }
        .nav-section-toggle:hover:not(:disabled), .nav-section-toggle:focus-visible { color: #cbd5e1; outline: none; }
        .nav-section-toggle:disabled { cursor: default; }
        .nav-section-chevron { font-size: 9px; transition: transform 150ms ease; }
        .nav-section-chevron.closed { transform: rotate(-90deg); }
        .nav-section-items[hidden] { display: none; }
        .nav-empty { padding: 8px 12px; font-size: 12.5px; color: var(--sb-muted); }

        .sidebar .nav-link {
          display: flex; align-items: center; gap: 11px;
          padding: 9px 12px; margin-bottom: 2px; border-radius: 9px;
          color: var(--sb-text); text-decoration: none; font-size: 13.5px; font-weight: 500;
          position: relative; white-space: nowrap;
          transition: background 150ms ease, color 150ms ease;
        }
        .sidebar .nav-link:hover { background: rgba(255, 255, 255, 0.06); color: white; }
        .sidebar .nav-link:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
        .sidebar .nav-link.active { background: var(--accent-soft); color: white; font-weight: 600; }
        .sidebar .nav-link.active::before {
          content: ''; position: absolute; left: -10px; top: 7px; bottom: 7px; width: 3px;
          border-radius: 0 3px 3px 0; background: var(--accent);
        }
        .sidebar .nav-link.active .nav-link-icon { color: white; }
        .nav-link-icon { font-size: 15px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 20px; color: var(--sb-muted); transition: color 150ms ease; }
        .sidebar .nav-link:hover .nav-link-icon { color: white; }
        .nav-link-text { flex: 1; overflow: hidden; text-overflow: ellipsis; }
        .nav-link-tooltip {
          position: fixed; left: calc(var(--sidebar-collapsed-width) + 10px);
          background: #1e293b; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
          white-space: nowrap; opacity: 0; visibility: hidden; transition: opacity 150ms ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 1100; pointer-events: none;
        }

        /* ---------- Bouton replier ---------- */
        .sidebar-collapse-btn {
          position: absolute; right: -14px; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 50%; background: var(--accent); border: 3px solid #0f172a;
          color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 10px; z-index: 1001; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4); transition: transform 150ms ease;
        }
        .sidebar-collapse-btn:hover { transform: translateY(-50%) scale(1.1); }

        /* ---------- Pied ---------- */
        .sidebar-footer { padding: 12px; border-top: 1px solid var(--sb-line); flex-shrink: 0; overflow: hidden; }
        .sidebar-user { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255, 255, 255, 0.04); border-radius: 10px; white-space: nowrap; }
        .sidebar-user-avatar {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12.5px;
        }
        .sidebar-user-info { flex: 1; min-width: 0; overflow: hidden; }
        .sidebar-user-name { font-size: 12.5px; font-weight: 600; color: white; overflow: hidden; text-overflow: ellipsis; }
        .sidebar-user-role { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: var(--sb-muted); }

        /* ---------- Menu replié (bureau) : icônes centrées ---------- */
        @media (min-width: 993px) {
          .sidebar.collapsed .sidebar-header { justify-content: center; padding: 18px 0 14px; }
          .sidebar.collapsed .sidebar-brand,
          .sidebar.collapsed .nav-section-title,
          .sidebar.collapsed .nav-link-text,
          .sidebar.collapsed .sidebar-user-info,
          .sidebar.collapsed .sidebar-action-text,
          .sidebar.collapsed .sidebar-search { display: none; }
          .sidebar.collapsed .sidebar-tools { padding: 0 10px 12px; align-items: center; }
          .sidebar.collapsed .sidebar-action { width: 44px; height: 40px; padding: 0; }
          .sidebar.collapsed .sidebar-nav { padding: 10px 8px; }
          .sidebar.collapsed .nav-link { justify-content: center; padding: 11px 0; gap: 0; }
          .sidebar.collapsed .nav-link.active::before { left: -8px; }
          .sidebar.collapsed .nav-link-icon { font-size: 17px; }
          .sidebar.collapsed .nav-link:hover .nav-link-tooltip { opacity: 1; visibility: visible; }
          .sidebar.collapsed .nav-section + .nav-section { border-top: 1px solid var(--sb-line); padding-top: 6px; }
          .sidebar.collapsed .sidebar-user { justify-content: center; padding: 6px 0; background: transparent; }
        }

        /* ---------- Mobile : tiroir ---------- */
        .sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); z-index: 999;
          opacity: 0; visibility: hidden; transition: opacity 200ms ease, visibility 200ms ease;
        }
        .sidebar-overlay.active { opacity: 1; visibility: visible; }
        @media (max-width: 992px) {
          .sidebar, .sidebar.collapsed { width: min(var(--sidebar-width), 86vw); transform: translateX(-100%); }
          .sidebar.open, .sidebar.collapsed.open { transform: translateX(0); }
          .sidebar-collapse-btn { display: none; }
          .sidebar-close-btn { display: flex; }
          .nav-link-tooltip { display: none; }
          .sidebar-search-kbd { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sidebar, .sidebar-action, .nav-link, .sidebar-collapse-btn { transition: none; }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
