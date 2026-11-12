import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth';
import { clearFilters } from '../utils/filterStorage';
import {
  getActiveBoutique,
  setActiveBoutique,
  clearActiveBoutique,
  resolveActiveBoutique,
  canUseGlobalView,
  ALL_BOUTIQUES,
} from '../utils/boutiqueStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ✅ Multi-tenant : boutique active ('all' = toutes mes boutiques)
  const [activeBoutique, setActiveBoutiqueState] = useState(getActiveBoutique());

  const applyUser = useCallback((u) => {
    const active = resolveActiveBoutique(u);
    setActiveBoutique(active);
    setActiveBoutiqueState(active);
    setUser(u);
  }, []);

  // ============================================================
  // ✅ Nettoyage centralisé : tokens + filtres persistés
  // ============================================================
  const clearSession = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearFilters(); // ✅ efface les filtres sauvegardés
    clearActiveBoutique();
    setActiveBoutiqueState('');
    setUser(null);
  }, []);

  // ============================================================
  // ✅ Vérification de session au démarrage
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Pas de token → on nettoie tout résidu (filtres inclus)
        clearFilters();
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        applyUser(response.data);
      } catch (err) {
        console.error('Erreur de vérification:', err);
        clearSession(); // ✅ nettoie tokens + filtres + user
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [clearSession, applyUser]);

  // ============================================================
  // ✅ LOGIN
  // ============================================================
  const login = async (username, password) => {
    setError(null);
    try {
      const response = await loginApi(username, password);
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      clearFilters(); // filtres d'un autre compte/boutique
      // ✅ Nouvelle connexion : on oublie la boutique précédente
      //    → super admin : backoffice ; plusieurs boutiques : écran de choix
      clearActiveBoutique();
      applyUser(user);

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion';
      setError(message);
      return { success: false, message };
    }
  };

  // ============================================================
  // ✅ LOGOUT
  // ============================================================
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Erreur lors du logout:', err);
    } finally {
      clearSession(); // ✅ nettoie tokens + filtres + user
    }
  }, [clearSession]);

  // ============================================================
  // ✅ Rôles
  // ============================================================
  // ✅ Le SUPER_ADMIN a les droits d'un ADMIN (propriétaire) dans la boutique où il entre
  const isSuperAdmin = () => user?.role === 'SUPER_ADMIN';
  const hasRole = (role) => user?.role === role || (role === 'ADMIN' && isSuperAdmin());
  const hasAnyRole = (roles) =>
    roles.includes(user?.role) || (roles.includes('ADMIN') && isSuperAdmin());

  // ✅ Permissions
  const hasPermission = (module) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(module) || false;
  };

  const hasAnyPermission = (modules) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    return modules.some(m => user.permissions?.includes(m));
  };

  const isAdmin = () => user?.role === 'ADMIN' || isSuperAdmin();
  const isOwner = () => (user?.role === 'ADMIN' && !!user?.isOwner) || isSuperAdmin();

  // ============================================================
  // ✅ MULTI-TENANT : boutiques
  // ============================================================
  const boutiques = user?.boutiquesAccessibles || [];
  const currentBoutique = boutiques.find((b) => b._id === activeBoutique) || null;
  // Boutiques de la société en cours (le SUPER_ADMIN reçoit celles de toutes les sociétés)
  const currentOrgId = currentBoutique?.organisation?._id || currentBoutique?.organisation;
  const orgBoutiques = isSuperAdmin()
    ? boutiques.filter((b) => (b.organisation?._id || b.organisation) === currentOrgId)
    : boutiques;
  // ✅ Page d'accueil selon les permissions :
  //    tableau de bord, sinon la liste des réparations, sinon le 1er module accessible
  const HOME_PAGES = [
    [['dashboard'], '/dashboard'],
    [['reparations'], '/reparations'],
    [['clients'], '/clients'],
    [['stock', 'stock:read'], '/stock'],
    [['depenses'], '/depenses'],
    [['statistiques'], '/statistiques'],
  ];
  const homePath = () => {
    if (isSuperAdmin() && !activeBoutique) return '/organisations';
    // ✅ Employés (réparateur / commercial) : leur tableau de bord personnel
    if (!isAdmin() && hasPermission('mon_dashboard')) return '/mon-tableau-de-bord';
    const found = HOME_PAGES.find(([mods]) => mods.some((m) => hasPermission(m)));
    return found ? found[1] : '/reparations';
  };

  // Utilisateur avec plusieurs boutiques qui n'a pas encore choisi
  const needsBoutiqueChoice = !!user && !isSuperAdmin() && boutiques.length > 1 && !activeBoutique;

  // Changer de boutique ('' = sortir de la boutique). On recharge l'application
  // pour que toutes les données (listes, caches, compteurs) soient celles de la boutique.
  const changeBoutique = (value, redirectTo = null) => {
    setActiveBoutique(value);
    clearFilters();
    if (redirectTo) window.location.assign(redirectTo);
    else window.location.reload();
  };
  const isCommercial = () => user?.role === 'COMMERCIAL';
  const isReparateur = () => user?.role === 'REPARATEUR';

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    isCommercial,
    isReparateur,
    isSuperAdmin,
    isOwner,
    boutiques,
    activeBoutique,
    currentBoutique,
    isAllBoutiques: activeBoutique === ALL_BOUTIQUES,
    canGlobalView: canUseGlobalView(user),
    // Boutique d'un document (id ou objet peuplé) → { nom, code }
    boutiqueOf: (ref) => {
      if (!ref) return null;
      if (typeof ref === 'object' && ref.nom) return ref;
      const id = typeof ref === 'object' ? ref._id : ref;
      return boutiques.find((b) => b._id === String(id)) || null;
    },
    orgBoutiques,
    needsBoutiqueChoice,
    homePath,
    changeBoutique,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};