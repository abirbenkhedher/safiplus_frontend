import apiClient from "./client";

// ============================================================
// ✅ Helper : construire les query params
// ============================================================
const buildQuery = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      q.append(key, val);
    }
  });
  return q.toString();
};

// ============================================================
// ✅ GET statistiques
// ============================================================
export const getOverview = (params) =>
  apiClient.get(`/statistiques/overview?${buildQuery(params)}`);

export const getReparationsStats = (params) =>
  apiClient.get(`/statistiques/reparations?${buildQuery(params)}`);

export const getFamillesStats = (params) =>
  apiClient.get(`/statistiques/familles?${buildQuery(params)}`);

export const getCategoriesStats = (params) =>
  apiClient.get(`/statistiques/categories?${buildQuery(params)}`);

export const getAppareilsStats = (params) =>
  apiClient.get(`/statistiques/appareils?${buildQuery(params)}`);

export const getReparateursStats = (params) =>
  apiClient.get(`/statistiques/reparateurs?${buildQuery(params)}`);

// ✅ NOUVEAU
export const getStatutsStats = (params) =>
  apiClient.get(`/statistiques/statuts?${buildQuery(params)}`);


// ✅ NOUVEAU : Bénéfice
export const getBeneficeStats = (params) =>
  apiClient.get(`/statistiques/benefice?${buildQuery(params)}`);

// ============================================================
// ✅ Export (JSON — legacy)
// ============================================================
export const exportStats = (params) =>
  apiClient.get(`/statistiques/export?${buildQuery(params)}`, { responseType: "blob" });


// ✅ Bénéfice détaillé par famille / catégorie
export const getBeneficeFamillesStats = (params) =>
  apiClient.get(`/statistiques/benefice-familles?${buildQuery(params)}`);
