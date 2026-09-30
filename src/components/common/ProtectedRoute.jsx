import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  permission = null,
  anyPermission = null,   // ✅ NOUVEAU : accepte plusieurs permissions (OU logique)
}) => {
  const { loading, isAuthenticated, hasAnyRole, hasPermission } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Vérification par rôle
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

  // ✅ Vérification par permission unique
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

  // ✅ NOUVEAU : vérification par plusieurs permissions (OU logique)
  // L'utilisateur doit avoir AU MOINS UNE des permissions listées
  if (anyPermission && Array.isArray(anyPermission) && anyPermission.length > 0) {
    const hasAtLeastOne = anyPermission.some((p) => hasPermission(p));
    if (!hasAtLeastOne) {
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
  }

  return children;
};

export default ProtectedRoute;