import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../api/categories';
import { getObjets } from '../api/objets';
import { getMarques } from '../api/marques';
import { getModeles } from '../api/modeles';
import { getPannes } from '../api/pannes';
import { getStatuses } from '../api/statuses';
import { getUsers } from '../api/users';
import { REF_CACHE_KEY, REF_CACHE_TTL } from '../constants/reparations';

// ✅ Helper de tri par ordre puis nom
const sortByOrdre = (arr = []) =>
  [...arr].sort(
    (a, b) =>
      (a.ordre ?? 0) - (b.ordre ?? 0) ||
      (a.nom || '').localeCompare(b.nom || '')
  );

// ✅ Helper de tri par ordre uniquement (pour les pannes)
const sortByOrdreOnly = (arr = []) =>
  [...arr].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

/**
 * ✅ Hook avec cache intelligent
 * Charge les données de référence UNE SEULE FOIS
 * et les met en cache dans localStorage pendant 5 min
 * + expose refresh() pour forcer le rechargement sans reload de page
 */
export const useReparationData = () => {
  const [data, setData] = useState({
    categories: [],
    objets: [],
    marques: [],
    modeles: [],
    pannes: [],
    statuses: [],
    reparateurs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      // ✅ Vérifier le cache (sauf si refresh forcé)
      if (!forceRefresh) {
        const cached = localStorage.getItem(REF_CACHE_KEY);
        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            if (age < REF_CACHE_TTL && cachedData.pannes) {
              // ✅ Tri défensif même sur le cache (au cas où l'ancien cache n'était pas trié)
              setData({
                ...cachedData,
                categories: sortByOrdre(cachedData.categories),
                objets: sortByOrdre(cachedData.objets),
                marques: sortByOrdre(cachedData.marques),
                modeles: sortByOrdre(cachedData.modeles),
                pannes: sortByOrdreOnly(cachedData.pannes),
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(REF_CACHE_KEY);
          }
        }
      }

      // ✅ Charger en parallèle
      setLoading(true);
      const [
        categoriesRes,
        objetsRes,
        marquesRes,
        modelesRes,
        pannesRes,
        statusesRes,
        usersRes,
      ] = await Promise.all([
        getCategories(),
        getObjets(),
        getMarques(),
        getModeles(),
        getPannes(),
        getStatuses(),
        getUsers(),
      ]);

      // ✅ Tri explicite côté client (ceinture + bretelles)
      const freshData = {
        categories: sortByOrdre(categoriesRes.data),
        objets: sortByOrdre(objetsRes.data),
        marques: sortByOrdre(marquesRes.data),
        modeles: sortByOrdre(modelesRes.data),
        pannes: sortByOrdreOnly(pannesRes.data),
        statuses: statusesRes.data,
        reparateurs: usersRes.data.filter((u) => u.role === 'REPARATEUR'),
      };

      setData(freshData);

      // ✅ Sauvegarder en cache
      localStorage.setItem(
        REF_CACHE_KEY,
        JSON.stringify({
          data: freshData,
          timestamp: Date.now(),
        })
      );

      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Forcer le rechargement SANS reload de page
  const refresh = useCallback(() => {
    localStorage.removeItem(REF_CACHE_KEY);
    return loadData(true);
  }, [loadData]);

  return { ...data, loading, error, refresh };
};