import { useState, useEffect, useCallback } from 'react';
import { getCategories } from '../api/categories';
import { getObjets } from '../api/objets';
import { getMarques } from '../api/marques';
import { getModeles } from '../api/modeles';
import { getPannes } from '../api/pannes';
import { getStatuses } from '../api/statuses';
import { getUsers } from '../api/users';
import { getFamilles } from '../api/familles';
import { getZones } from '../api/zones';
import { REF_CACHE_KEY, REF_CACHE_TTL } from '../constants/reparations';

// ------------------------------------------------------------
// ✅ Helper : extrait un tableau quel que soit le format de réponse
//   - array direct           → [...]
//   - { data: [...] }        → [...]   (API custom)
//   - { data: { data: [...] }} → [...] (axios + API custom)
//   - autre                  → []
// ------------------------------------------------------------
const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

// ✅ Tri par ordre puis nom (défensif)
const sortByOrdre = (arr) => {
  const safe = Array.isArray(arr) ? arr : extractArray(arr);
  return [...safe].sort(
    (a, b) =>
      (a.ordre ?? 0) - (b.ordre ?? 0) ||
      (a.nom || '').localeCompare(b.nom || '')
  );
};

// ✅ Tri par ordre uniquement (pannes)
const sortByOrdreOnly = (arr) => {
  const safe = Array.isArray(arr) ? arr : extractArray(arr);
  return [...safe].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
};

export const useReparationData = () => {
  const [data, setData] = useState({
    categories: [],
    objets: [],
    marques: [],
    modeles: [],
    pannes: [],
    statuses: [],
    reparateurs: [],
    familles: [],
    zones: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------------------------------------------
  // ✅ Mise à jour du cache localStorage après un reload ciblé
  // ------------------------------------------------------------
  const updateCache = useCallback((partialData) => {
    try {
      const cached = localStorage.getItem(REF_CACHE_KEY);
      if (!cached) return;

      const parsed = JSON.parse(cached);
      const merged = { ...parsed.data, ...partialData };

      localStorage.setItem(
        REF_CACHE_KEY,
        JSON.stringify({ data: merged, timestamp: Date.now() })
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

            if (
              age < REF_CACHE_TTL &&
              cachedData.pannes &&
              cachedData.familles &&
              cachedData.zones
            ) {
              setData({
                ...cachedData,
                categories: sortByOrdre(cachedData.categories),
                objets: sortByOrdre(cachedData.objets),
                marques: sortByOrdre(cachedData.marques),
                modeles: sortByOrdre(cachedData.modeles),
                pannes: sortByOrdreOnly(cachedData.pannes),
                familles: sortByOrdre(cachedData.familles),
                zones: sortByOrdre(cachedData.zones),
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
        famillesRes,
        zonesRes,
      ] = await Promise.all([
        getCategories(),
        getObjets(),
        getMarques(),
        getModeles(),
        getPannes(),
        getStatuses(),
        getUsers(),
        getFamilles(),
        getZones(),
      ]);

      // ✅ On passe la réponse complète : extractArray gère les formats
      const freshData = {
        categories: sortByOrdre(categoriesRes),
        objets: sortByOrdre(objetsRes),
        marques: sortByOrdre(marquesRes),
        modeles: sortByOrdre(modelesRes),
        pannes: sortByOrdreOnly(pannesRes),
        statuses: extractArray(statusesRes),
        reparateurs: extractArray(usersRes),
        familles: sortByOrdre(famillesRes),
        zones: sortByOrdre(zonesRes),
      };

      setData(freshData);

      localStorage.setItem(
        REF_CACHE_KEY,
        JSON.stringify({ data: freshData, timestamp: Date.now() })
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
  // ✅ Reload ciblés — tous corrigés avec la même robustesse
  // ------------------------------------------------------------
  const reloadModeles = useCallback(async () => {
    try {
      const res = await getModeles();
      const freshModeles = sortByOrdre(res);
      setData((prev) => ({ ...prev, modeles: freshModeles }));
      updateCache({ modeles: freshModeles });
      return freshModeles;
    } catch (err) {
      console.error('Erreur reloadModeles:', err);
      return [];
    }
  }, [updateCache]);

  const reloadMarques = useCallback(async () => {
    try {
      const res = await getMarques();
      const freshMarques = sortByOrdre(res);
      setData((prev) => ({ ...prev, marques: freshMarques }));
      updateCache({ marques: freshMarques });
      return freshMarques;
    } catch (err) {
      console.error('Erreur reloadMarques:', err);
      return [];
    }
  }, [updateCache]);

  const reloadObjets = useCallback(async () => {
    try {
      const res = await getObjets();
      const freshObjets = sortByOrdre(res);
      setData((prev) => ({ ...prev, objets: freshObjets }));
      updateCache({ objets: freshObjets });
      return freshObjets;
    } catch (err) {
      console.error('Erreur reloadObjets:', err);
      return [];
    }
  }, [updateCache]);

  const reloadZones = useCallback(async () => {
    try {
      const res = await getZones();
      const freshZones = sortByOrdre(res);
      setData((prev) => ({ ...prev, zones: freshZones }));
      updateCache({ zones: freshZones });
      return freshZones;
    } catch (err) {
      console.error('Erreur reloadZones:', err);
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
    reloadZones,
  };
};