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

    // Si erreur 401 et PAS une route d'auth NI publique → on tente le refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute &&
      !isPublicRoute
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh échoué → logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Rediriger seulement si on n'est pas déjà sur une page publique
        const currentPath = window.location.pathname;
        const isOnPublicPage = currentPath.startsWith('/suivi/');

        if (!isOnPublicPage && currentPath !== '/login' && currentPath !== '/') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;