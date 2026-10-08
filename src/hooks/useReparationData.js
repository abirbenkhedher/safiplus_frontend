import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../api/categories';
import { getObjets } from '../api/objets';
import { getMarques } from '../api/marques';
import { getModeles } from '../api/modeles';
import { getPannes } from '../api/pannes';
import { getStatuses } from '../api/statuses';
import { getUsers } from '../api/users';
import { getFamilles } from '../api/familles';   // ✅ AJOUT
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

export const useReparationData = () => {
  const [data, setData] = useState({
    categories: [],
    objets: [],
    marques: [],
    modeles: [],
    pannes: [],
    statuses: [],
    reparateurs: [],
    familles: [],       // ✅ AJOUT
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------------------------------------------
  // ✅ Helper : mise à jour du cache localStorage après un reload ciblé
  // ------------------------------------------------------------
  const updateCache = useCallback((partialData) => {
    try {
      const cached = localStorage.getItem(REF_CACHE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);
      const merged = { ...parsed.data, ...partialData };

      localStorage.setItem(
        REF_CACHE_KEY,
        JSON.stringify({
          data: merged,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      localStorage.removeItem(REF_CACHE_KEY);
    }
  }, []);

  // ------------------------------------------------------------
  // ✅ Chargement global (avec cache)
  // ------------------------------------------------------------
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = localStorage.getItem(REF_CACHE_KEY);
        if (cached) {
          try {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const age = Date.now() - timestamp;

            // ✅ Vérifier aussi que familles existe dans le cache
            if (
              age < REF_CACHE_TTL &&
              cachedData.pannes &&
              cachedData.familles
            ) {
              setData({
                ...cachedData,
                categories: sortByOrdre(cachedData.categories),
                objets: sortByOrdre(cachedData.objets),
                marques: sortByOrdre(cachedData.marques),
                modeles: sortByOrdre(cachedData.modeles),
                pannes: sortByOrdreOnly(cachedData.pannes),
                familles: sortByOrdre(cachedData.familles || []),   // ✅ AJOUT
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem(REF_CACHE_KEY);
          }
        }
      }

      setLoading(true);
      const [
        categoriesRes,
        objetsRes,
        marquesRes,
        modelesRes,
        pannesRes,
        statusesRes,
        usersRes,
        famillesRes,      // ✅ AJOUT
      ] = await Promise.all([
        getCategories(),
        getObjets(),
        getMarques(),
        getModeles(),
        getPannes(),
        getStatuses(),
        getUsers(),
        getFamilles(),    // ✅ AJOUT
      ]);

      const freshData = {
        categories: sortByOrdre(categoriesRes.data),
        objets: sortByOrdre(objetsRes.data),
        marques: sortByOrdre(marquesRes.data),
        modeles: sortByOrdre(modelesRes.data),
        pannes: sortByOrdreOnly(pannesRes.data),
        statuses: statusesRes.data,
        reparateurs: usersRes.data,
        familles: sortByOrdre(famillesRes.data || []),   // ✅ AJOUT
      };

      setData(freshData);

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

  // ------------------------------------------------------------
  // ✅ Refresh GLOBAL
  // ------------------------------------------------------------
  const refresh = useCallback(() => {
    localStorage.removeItem(REF_CACHE_KEY);
    return loadData(true);
  }, [loadData]);

  // ------------------------------------------------------------
  // ✅ Refresh CIBLÉ des modèles
  // ------------------------------------------------------------
  const reloadModeles = useCallback(async () => {
    try {
      const res = await getModeles();
      const freshModeles = sortByOrdre(res.data || []);

      setData((prev) => ({ ...prev, modeles: freshModeles }));
      updateCache({ modeles: freshModeles });

      return freshModeles;
    } catch (err) {
      console.error('Erreur reloadModeles:', err);
      return [];
    }
  }, [updateCache]);

  // ------------------------------------------------------------
  // ✅ BONUS : reloadMarques
  // ------------------------------------------------------------
  const reloadMarques = useCallback(async () => {
    try {
      const res = await getMarques();
      const freshMarques = sortByOrdre(res.data || []);
      setData((prev) => ({ ...prev, marques: freshMarques }));
      updateCache({ marques: freshMarques });
      return freshMarques;
    } catch (err) {
      console.error('Erreur reloadMarques:', err);
      return [];
    }
  }, [updateCache]);

  // ------------------------------------------------------------
  // ✅ BONUS : reloadObjets
  // ------------------------------------------------------------
  const reloadObjets = useCallback(async () => {
    try {
      const res = await getObjets();
      const freshObjets = sortByOrdre(res.data || []);
      setData((prev) => ({ ...prev, objets: freshObjets }));
      updateCache({ objets: freshObjets });
      return freshObjets;
    } catch (err) {
      console.error('Erreur reloadObjets:', err);
      return [];
    }
  }, [updateCache]);

  return {
    ...data,
    loading,
    error,
    refresh,
    reloadModeles,
    reloadMarques,
    reloadObjets,
  };
};