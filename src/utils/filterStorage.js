// src/utils/filterStorage.js

const FILTERS_KEY = "reparations_filters";
const REFRESH_FLAG = "reparations_filters_refresh_flag";

// ============================================================
// ✅ Détection d'un VRAI refresh (F5) ou fermeture d'onglet
// ============================================================
// Principe :
// - `beforeunload` est déclenché UNIQUEMENT lors d'un refresh,
//   d'une fermeture d'onglet, ou d'une navigation "externe"
//   (pas lors d'une navigation SPA via React Router).
// - On pose un flag dans sessionStorage au moment du beforeunload.
// - Au chargement suivant, si le flag est présent → c'était un refresh.
// - Sinon → c'était une navigation SPA (retour depuis le détail, etc.)
// ============================================================
const isPageRefresh = () => {
  try {
    const refreshFlag = sessionStorage.getItem(REFRESH_FLAG);
    if (refreshFlag === "1") {
      sessionStorage.removeItem(REFRESH_FLAG);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

// ============================================================
// ✅ À appeler UNE SEULE FOIS au démarrage de l'app (App.js)
// ============================================================
export const setupRefreshDetection = () => {
  window.addEventListener("beforeunload", () => {
    try {
      sessionStorage.setItem(REFRESH_FLAG, "1");
    } catch (e) {
      // silently fail
    }
  });
};

// ============================================================
// ✅ Sauvegarde des filtres
// ============================================================
export const saveFilters = (filters) => {
  try {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (e) {
    // silently fail
  }
};

// ============================================================
// ✅ Chargement des filtres
// ============================================================
export const loadFilters = (defaultFilters) => {
  try {
    // Si c'est un VRAI refresh (F5) → on efface et on repart de zéro
    if (isPageRefresh()) {
      sessionStorage.removeItem(FILTERS_KEY);
      return defaultFilters;
    }

    const raw = sessionStorage.getItem(FILTERS_KEY);
    if (!raw) return defaultFilters;

    const parsed = JSON.parse(raw);
    return { ...defaultFilters, ...parsed };
  } catch (e) {
    return defaultFilters;
  }
};

// ============================================================
// ✅ Effacement des filtres (reset manuel ou déconnexion)
// ============================================================
export const clearFilters = () => {
  try {
    sessionStorage.removeItem(FILTERS_KEY);
  } catch (e) {
    // silently fail
  }
};