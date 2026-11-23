import axios from 'axios';
import {
  applyBoutiqueHeader,
  handleBoutiqueError,
  handleGlobalViewRefusal,
} from '../utils/boutiqueStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// ✅ Renouvellement de session (jeton d'accès de 15 min)
//    Une seule demande à la fois : si plusieurs requêtes échouent en même temps,
//    elles attendent toutes le même renouvellement.
// ============================================================
let renouvellement = null;

export const renouvelerSession = () => {
  if (!renouvellement) {
    renouvellement = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('Pas de session à renouveler');
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: nouveau } = response.data.data;
      localStorage.setItem('accessToken', accessToken);
      if (nouveau) localStorage.setItem('refreshToken', nouveau);
      return accessToken;
    })().finally(() => { renouvellement = null; });
  }
  return renouvellement;
};

const deconnecter = (cible) => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  // Rediriger seulement si on n'est pas déjà sur une page publique / de connexion
  const currentPath = window.location.pathname;
  const isOnPublicPage = currentPath.startsWith('/suivi/') || currentPath.startsWith('/s/');
  if (!isOnPublicPage && currentPath !== '/login' && currentPath !== '/') {
    window.location.href = cible;
  }
};

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return applyBoutiqueHeader(config); // ✅ multi-tenant
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs de token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // ✅ Boutique non autorisée → on réinitialise la sélection
    if (handleBoutiqueError(error)) return Promise.reject(error);

    // ✅ Vue globale = consultation : avertir (et proposer de choisir une boutique)
    handleGlobalViewRefusal(error);

    // ⚠️ Routes d'authentification (ne PAS rediriger)
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    // ✅ NOUVELLE LIGNE : Routes publiques (ne PAS rediriger)
    const isPublicRoute = requestUrl.includes('/reparations/public/');

    // 🔴 Déconnexion pour inactivité décidée par le serveur : pas de renouvellement
    if (error.response?.status === 401 && error.response?.data?.code === 'INACTIVITY_TIMEOUT') {
      deconnecter('/login?reason=inactivity');
      return Promise.reject(error);
    }

    // Si erreur 401 et PAS une route d'auth NI publique → on renouvelle la session puis on rejoue la requête
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute &&
      !isPublicRoute
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await renouvelerSession();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Renouvellement impossible (session fermée, expirée, inactivité) → reconnexion
        const inactif = refreshError?.response?.data?.code === 'INACTIVITY_TIMEOUT';
        deconnecter(inactif ? '/login?reason=inactivity' : '/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;