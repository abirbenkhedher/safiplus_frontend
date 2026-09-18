import { useState, useEffect, useCallback } from "react";
import { getReparations } from "../api/reparations";

const DELAI_ALERTE_HEURES = 48;

/**
 * ✅ Hook qui détecte les réparations en retard (+48h)
 * ⚠️ UNIQUEMENT pour les réparations au statut "En cours"
 * Se rafraîchit toutes les 5 minutes
 */
export const useReparationsEnRetard = () => {
  const [reparationsEnRetard, setReparationsEnRetard] = useState([]);
  const [loading, setLoading] = useState(true);

  const checkRetards = useCallback(async () => {
    try {
      // Récupérer toutes les réparations (limitées à 500)
      const response = await getReparations({ limit: 500 });
      const all = response.data || [];

      const maintenant = new Date();
      const enRetard = [];

      all.forEach((rep) => {
        // ✅ Inclure UNIQUEMENT les réparations dont le statut contient "en cours"
        const statusLabel = (rep.status?.label || "").toLowerCase();
        const isEnCours =
          statusLabel.includes("en cours") || statusLabel.includes("cours");

        if (!isEnCours) return;

        // Calcul du délai
        const dateReception = rep.dateReception || rep.createdAt;
        if (!dateReception) return;

        const diffHeures =
          (maintenant - new Date(dateReception)) / (1000 * 60 * 60);

        if (diffHeures < DELAI_ALERTE_HEURES) return;

        const jours = Math.floor(diffHeures / 24);
        const heures = Math.floor(diffHeures % 24);

        enRetard.push({
          _id: rep._id,
          numero: rep.numero,
          client: rep.client?.nom || "N/A",
          marque: rep.marque,
          modele: rep.modele,
          status: rep.status,
          dateReception,
          heuresEcoulees: Math.floor(diffHeures),
          label:
            jours > 0 ? `${jours}j ${heures}h` : `${Math.floor(diffHeures)}h`,
          depassement: Math.floor(diffHeures - DELAI_ALERTE_HEURES),
        });
      });

      // Trier par dépassement le plus important
      enRetard.sort((a, b) => b.heuresEcoulees - a.heuresEcoulees);
      setReparationsEnRetard(enRetard);
    } catch (err) {
      console.error("Erreur check retards:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkRetards();
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(checkRetards, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkRetards]);

  return {
    reparationsEnRetard,
    count: reparationsEnRetard.length,
    loading,
    refresh: checkRetards,
  };
};