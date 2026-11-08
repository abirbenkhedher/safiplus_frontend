// ============================================================
// ✅ MULTI-TENANT : boutique active (mémorisée dans le navigateur)
// Valeur : id d'une boutique ('' = aucune : écran de choix / backoffice)
// ============================================================
const KEY = 'activeBoutique';

export const getActiveBoutique = () => {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
};

export const setActiveBoutique = (value) => {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* stockage indisponible */
  }
};

export const clearActiveBoutique = () => setActiveBoutique('');

/**
 * Boutique active valide pour l'utilisateur (garde la précédente si possible).
 *  - une seule boutique → choisie automatiquement
 *  - plusieurs          → '' tant que l'utilisateur n'a pas choisi (écran de choix)
 *  - SUPER_ADMIN        → '' = backoffice
 */
export const resolveActiveBoutique = (user) => {
  const list = user?.boutiquesAccessibles || [];
  const current = getActiveBoutique();
  if (list.some((b) => b._id === current)) return current;
  if (user?.role !== 'SUPER_ADMIN' && list.length === 1) return list[0]._id;
  return '';
};

/** En-tête HTTP à joindre aux requêtes API. */
export const applyBoutiqueHeader = (config) => {
  const active = getActiveBoutique();
  if (active) config.headers['X-Boutique-Id'] = active;
  return config;
};

/** Gère les refus liés à la boutique (boutique retirée, désactivée...). */
export const handleBoutiqueError = (error) => {
  const code = error.response?.data?.code;
  if (error.response?.status === 403 && code === 'BOUTIQUE_FORBIDDEN') {
    clearActiveBoutique();
    window.location.reload();
    return true;
  }
  return false;
};
