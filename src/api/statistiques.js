import apiClient from "./client"; // Ton instance axios existante

// Fonction utilitaire pour construire les query params
const buildQuery = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, val);
    }
  });
  return q.toString();
};

export const getOverview = (params) => 
  apiClient.get(`/statistiques/overview?${buildQuery(params)}`);

export const getReparationsStats = (params) => 
  apiClient.get(`/statistiques/reparations?${buildQuery(params)}`);

export const getFamillesStats = (params) => 
  apiClient.get(`/statistiques/familles?${buildQuery(params)}`);

export const getCategoriesStats = (params) => 
  apiClient.get(`/statistiques/categories?${buildQuery(params)}`);

export const getAppareilsStats = (params) => 
  apiClient.get(`/statistiques/appareils?${buildQuery(params)}`); // ✅ apiClient, pas api

export const exportStats = (params) => 
  apiClient.get(`/statistiques/export?${buildQuery(params)}`, { responseType: "blob" });
// ✅ Pas d'accolade finale en trop