import { useState, useEffect } from 'react';
import { getCategories } from '../api/categories';
import { getObjets } from '../api/objets';
import { getMarques } from '../api/marques';
import { getModeles } from '../api/modeles';
import { getStatuses } from '../api/statuses';
import { getUsers } from '../api/users';
import { REF_CACHE_KEY, REF_CACHE_TTL } from '../constants/reparations';

/**
 * ✅ Hook avec cache intelligent
 * Charge les données de référence UNE SEULE FOIS
 * et les met en cache dans localStorage pendant 5 min
 */
export const useReparationData = () => {
  const [data, setData] = useState({
    categories: [],
    objets: [],
    marques: [],
    modeles: [],
    statuses: [],
    reparateurs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // ✅ Vérifier le cache
        const cached = localStorage.getItem(REF_CACHE_KEY);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          if (age < REF_CACHE_TTL) {
            // ⚠️ Migration du cache : si les anciennes données n'ont pas marques/modeles
            if (!cachedData.marques || !cachedData.modeles) {
              localStorage.removeItem(REF_CACHE_KEY);
            } else {
              setData(cachedData);
              setLoading(false);
              return;
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
          statusesRes,
          usersRes,
        ] = await Promise.all([
          getCategories(),
          getObjets(),
          getMarques(),
          getModeles(),
          getStatuses(),
          getUsers(),
        ]);

        const freshData = {
          categories: categoriesRes.data,
          objets: objetsRes.data,
          marques: marquesRes.data,
          modeles: modelesRes.data,
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ✅ Forcer le rechargement
  const refresh = async () => {
    localStorage.removeItem(REF_CACHE_KEY);
    window.location.reload();
  };

  return { ...data, loading, error, refresh };
};