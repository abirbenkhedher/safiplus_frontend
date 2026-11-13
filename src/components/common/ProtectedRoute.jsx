import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ 
  children, 
  roles = [], 
  permission = null,
  anyPermission = null,   // ✅ NOUVEAU : accepte plusieurs permissions (OU logique)
  superAdmin = false,     // ✅ MULTI-TENANT : page réservée au SUPER_ADMIN
  owner = false,          // ✅ MULTI-TENANT : page réservée au propriétaire
  layout = false,         // ✅ route parente (Layout) : authentification seule
  chooser = false,        // ✅ écran de choix de boutique
  redirectHome = false,   // ✅ sans la permission → page d'accueil au lieu de "Accès refusé"
  module = null,          // ✅ module souscrit requis (ex : "commercial")
}) => {
  const {
    loading, isAuthenticated, hasAnyRole, hasPermission, isSuperAdmin, isOwner, hasModule,
    needsBoutiqueChoice, activeBoutique, homePath,
  } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ MULTI-TENANT : plusieurs boutiques → choisir d'abord la boutique
  if (chooser) return children;
  if (needsBoutiqueChoice) return <Navigate to="/choisir-boutique" replace />;

  // ✅ Route parente : on vérifie seulement l'authentification
  if (layout) return children;

  // ✅ MULTI-TENANT : le SUPER_ADMIN hors boutique n'a accès qu'au backoffice
  if (isSuperAdmin() && !superAdmin && !activeBoutique) {
    return <Navigate to="/organisations" replace />;
  }
  if (superAdmin && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }
  if (owner && !isOwner()) {
    return (
      <div className="empty-state" style={{ minHeight: '400px' }}>
        <div className="empty-state-icon">🚫</div>
        <div className="empty-state-title">Accès refusé</div>
        <div className="empty-state-text">
          Cette page est réservée au propriétaire de l'organisation.
        </div>
      </div>
    );
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

  // ✅ Module non souscrit par la société
  if (module && !hasModule(module)) {
    return (
      <div className="empty-state" style={{ minHeight: '400px' }}>
        <div className="empty-state-icon">🧩</div>
        <div className="empty-state-title">Module non activé</div>
        <div className="empty-state-text">
          La gestion commerciale n'est pas incluse dans la formule de votre société.
        </div>
      </div>
    );
  }

  // ✅ Vérification par permission unique
  if (permission && !hasPermission(permission) && redirectHome) {
    return <Navigate to={homePath()} replace />;
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