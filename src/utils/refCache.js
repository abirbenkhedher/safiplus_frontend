import { REF_CACHE_KEY } from '../constants/reparations';

/**
 * ✅ Invalide le cache des données de référence.
 * À appeler après toute mutation (create/update/delete)
 * sur les catégories, objets, marques, modèles, pannes, statuses, users.
 */
export const invalidateRefCache = () => {
  try {
    localStorage.removeItem(REF_CACHE_KEY);
  } catch (e) {
    // ignore
  }
};