import { REF_CACHE_KEY } from '../constants/reparations';

/**
 * ✅ Invalide le cache des données de référence.
 * À appeler après toute mutation (create/update/delete)
 * sur les catégories, objets, marques, modèles, pannes, statuses, users.
 * Le cache est propre à chaque compte et boutique (clé « REF_CACHE_KEY:utilisateur:boutique ») :
 * on supprime toutes ses variantes.
 */
export const invalidateRefCache = () => {
  try {
    Object.keys(localStorage)
      .filter((k) => k === REF_CACHE_KEY || k.startsWith(`${REF_CACHE_KEY}:`))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};
