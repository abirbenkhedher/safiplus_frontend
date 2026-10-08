const FILTERS_KEY = "reparations_filters";

export const saveFilters = (filters) => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch (e) {
    // silently fail
  }
};

export const loadFilters = (defaultFilters) => {
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return defaultFilters;

    const parsed = JSON.parse(raw);

    // ✅ Fusion avec les valeurs par défaut
    // (au cas où un nouveau filtre a été ajouté)
    return { ...defaultFilters, ...parsed };
  } catch (e) {
    return defaultFilters;
  }
};

export const clearFilters = () => {
  try {
    localStorage.removeItem(FILTERS_KEY);
  } catch (e) {
    // silently fail
  }
};