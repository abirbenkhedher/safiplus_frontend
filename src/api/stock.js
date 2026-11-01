import apiClient from "./client";

// ============================================================
// ✅ CRUD Stock
// ============================================================
export const getStock = (params) => apiClient.get("/stock", { params });
export const getStockStats = () => apiClient.get("/stock/stats");
export const getStockReferentiels = () => apiClient.get("/stock/referentiels");
export const createStock = (data) => apiClient.post("/stock", data);
export const updateStock = (id, data) => apiClient.put(`/stock/${id}`, data);

// ============================================================
// ✅ Ajustements rapides
// ============================================================
export const setStockQuantite = (id, quantite, motif) =>
  apiClient.patch(`/stock/${id}/quantite`, { quantite, motif });

export const incrementStock = (id, delta) =>
  apiClient.post(`/stock/${id}/increment`, { delta });

// ============================================================
// ✅ Cycle de vie des pièces (réparations)
// ============================================================
export const consommerStock = (data) =>
  apiClient.post("/stock/consommer", data);

export const annulerConsommation = (reparationId, pieceId, motif) =>
  apiClient.patch(
    `/stock/pieces/${reparationId}/${pieceId}/annuler`,
    { motif }
  );

export const getPiecesReparation = (reparationId) =>
  apiClient.get(`/stock/pieces/${reparationId}`);

// ============================================================
// ✅ Historique
// ============================================================
export const getMouvements = (id) =>
  apiClient.get(`/stock/${id}/mouvements`);

// ============================================================
// ✅ Suppression
// ============================================================
export const deleteStock = (id) => apiClient.delete(`/stock/${id}`);