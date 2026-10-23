// src/utils/filterStorage.js

const FILTERS_KEY = "reparations_filters";
const RETARD_MODE_KEY = "reparations_retard_mode";
const REFRESH_FLAG = "reparations_refresh_flag";

// ============================================================
// ✅ Appelé UNE SEULE FOIS dans App.js
//    Pose un flag AVANT le refresh / fermeture d'onglet
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
// ✅ Vérifie si on vient de faire un refresh
//    - Si oui → efface le flag et retourne true
//    - Sinon → retourne false
// ============================================================
const consumeRefreshFlag = () => {
  try {
    if (sessionStorage.getItem(REFRESH_FLAG) === "1") {
      sessionStorage.removeItem(REFRESH_FLAG);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

// ============================================================
// ✅ Chargement des filtres
//    - Si refresh → efface filtres + mode retard
//    - Sinon → restaure ce qui était sauvegardé
// ============================================================
export const loadFilters = (defaultFilters) => {
  try {
    if (consumeRefreshFlag()) {
      sessionStorage.removeItem(FILTERS_KEY);
      sessionStorage.removeItem(RETARD_MODE_KEY);
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
// ✅ Effacement des filtres (reset manuel ou déconnexion)
// ============================================================
export const clearFilters = () => {
  try {
    sessionStorage.removeItem(FILTERS_KEY);
    sessionStorage.removeItem(RETARD_MODE_KEY);
    sessionStorage.removeItem(REFRESH_FLAG);
  } catch (e) {
    // silently fail
  }
};

// ============================================================
// ✅ Mode "Réparations en retard"
// ============================================================
export const saveRetardMode = (isRetard) => {
  try {
    if (isRetard) {
      sessionStorage.setItem(RETARD_MODE_KEY, "1");
    } else {
      sessionStorage.removeItem(RETARD_MODE_KEY);
    }
  } catch (e) {
    // silently fail
  }
};

export const loadRetardMode = () => {
  try {
    return sessionStorage.getItem(RETARD_MODE_KEY) === "1";
  } catch (e) {
    return false;
  }
};