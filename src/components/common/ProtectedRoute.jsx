import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, roles = [], permission = null }) => {
  const { loading, isAuthenticated, hasAnyRole, hasPermission } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div className="empty-state" style={{ minHeight: '400px' }}>
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Accès refusé</div>
        <div className="empty-state-text">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </div>
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="empty-state" style={{ minHeight: '400px' }}>
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Accès refusé</div>
        <div className="empty-state-text">
          Vous n'avez pas accès à ce module. Contactez l'administrateur.
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;