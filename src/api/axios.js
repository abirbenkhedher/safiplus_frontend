import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// ============================================================
// ✅ INTERCEPTEUR DE REQUÊTE : ajouter le token
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// ✅ INTERCEPTEUR DE RÉPONSE : gérer les erreurs d'auth
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // 🔴 Déconnexion auto côté serveur (inactivité COMMERCIAL)
    if (status === 401 && code === 'INACTIVITY_TIMEOUT') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // ✅ Éviter la boucle si on est déjà sur /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?reason=inactivity';
      }
      return Promise.reject(error);
    }

    // Token invalide / expiré (hors inactivité)
    if (status === 401 && !code) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;