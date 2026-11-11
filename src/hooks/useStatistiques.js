import { useState, useEffect, useCallback } from "react";
import { useStatistiquesContext } from "../context/StatistiquesContext";
import {
  getOverview,
  getReparationsStats,
  getFamillesStats,
  getCategoriesStats,
  getAppareilsStats,
  getReparateursStats,
  getStatutsStats, // ✅ NOUVEAU
  getBeneficeStats,
  getBeneficeFamillesStats,
} from "../api/statistiques";

export const useStatistiques = (tab) => {
  const { period, filters } = useStatistiquesContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const params = {
      from: period.from,
      to: period.to,
      ...filters,
    };

    // On choisit la bonne fonction selon l'onglet actif
    const fetchers = {
      overview:    getOverview,
      reparations: getReparationsStats,
      familles:    getFamillesStats,
      categories:  getCategoriesStats,
      appareils:   getAppareilsStats,
      reparateurs: getReparateursStats,
      statuts:     getStatutsStats, // ✅ NOUVEAU
      benefice:    getBeneficeStats, // ✅ NOUVEAU
      beneficeFamilles: getBeneficeFamillesStats, // ✅ bénéfice détaillé

    };

    try {
      setLoading(true);
      setError("");
      const response = await fetchers[tab](params);
      setData(response.data); // Le fameux JSON du backend !
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [tab, period, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // On renvoie les données et la fonction pour recharger manuellement
  return { data, loading, error, refetch: fetchData };
};