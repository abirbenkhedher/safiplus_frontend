const FILTERS_KEY = "reparations_filters";
const REFRESH_FLAG = "reparations_filters_refresh_flag";

// ✅ Détecte si la page est chargée suite à un refresh (F5)
const isPageRefresh = () => {
  const navEntries = performance.getEntriesByType?.("navigation");
  if (navEntries && navEntries.length > 0) {
    return navEntries[0].type === "reload";
  }
  // Fallback pour anciens navigateurs
  return performance.navigation?.type === 1; // 1 = TYPE_RELOAD
};

export const saveFilters = (filters) => {
  try {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (e) {
    // silently fail
  }
};

export const loadFilters = (defaultFilters) => {
  try {
    // ✅ Si c'est un refresh → on efface et on repart de zéro
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

export const clearFilters = () => {
  try {
    sessionStorage.removeItem(FILTERS_KEY);
  } catch (e) {
    // silently fail
  }
};