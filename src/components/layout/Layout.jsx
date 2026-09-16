import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // ⚡ Sur mobile, toujours en mode expanded
    if (window.innerWidth <= 992) return false;
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // Détecter le changement de taille
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      
      // Si on passe en mobile, désactiver le collapse
      if (mobile) {
        setSidebarCollapsed(false);
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sauvegarder l'état du collapse (uniquement desktop)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    }
  }, [sidebarCollapsed, isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div className={`app-main ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} />

        <main className="app-content">
          <div className="fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        .app-layout {
          min-height: 100vh;
          background: #f9fafb;
        }

        .app-main {
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          /* ⚡ Pas de transition ici ! On l'applique séparément */
        }

        /* Appliquer la transition uniquement quand on toggle */
        .app-main.collapsed {
          margin-left: var(--sidebar-collapsed-width);
        }

        .app-content {
          margin-top: var(--header-height);
          padding: 24px;
          flex: 1;
        }

        /* ========================================== */
        /* RESPONSIVE */
        /* ========================================== */
        @media (max-width: 992px) {
          .app-main,
          .app-main.collapsed {
            margin-left: 0;
          }

          .app-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;