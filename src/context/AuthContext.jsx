import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi, getMe } from '../api/auth';

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

  // ============================================================
  // ✅ Vérification de session au démarrage
  // ============================================================
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        setUser(response.data);
      } catch (err) {
        console.error('Erreur de vérification:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      setUser(user);

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
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, []);

  // ============================================================
  // ✅ Rôles
  // ============================================================
  const hasRole = (role) => user?.role === role;
  const hasAnyRole = (roles) => roles.includes(user?.role);

  // ✅ Permissions
  const hasPermission = (module) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(module) || false;
  };

  const hasAnyPermission = (modules) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return modules.some(m => user.permissions?.includes(m));
  };

  const isAdmin = () => user?.role === 'ADMIN';
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
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};