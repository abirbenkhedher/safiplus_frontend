import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (window.innerWidth <= 992) return false;
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 992;
      setIsMobile(mobile);
      
      if (mobile) {
        setSidebarCollapsed(false);
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          background: var(--gray-50);
          transition: background 250ms ease;
        }

        .app-main {
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-main.collapsed {
          margin-left: var(--sidebar-collapsed-width);
        }

        .app-content {
          margin-top: var(--header-height);
          padding: 24px;
          flex: 1;
        }

        /* ✅ Mode sombre */
        [data-theme="dark"] .app-layout {
          background: #0f1117;
        }

        [data-theme="dark"] .app-main,
        [data-theme="dark"] .app-content {
          background: #0f1117;
          color: #e5e7eb;
        }

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