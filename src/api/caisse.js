import apiClient from "./client";

// ✅ Caisse journalière + rapport commercial
const newKey = () =>
  (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const idem = () => ({ headers: { "Idempotency-Key": newKey() } });

export const getCaisseCourante = () => apiClient.get("/caisse/courante");
export const getSessionsCaisse = (params) => apiClient.get("/caisse/sessions", { params });
export const getSessionCaisse = (id) => apiClient.get(`/caisse/sessions/${id}`);
export const ouvrirCaisse = (data) => apiClient.post("/caisse/ouvrir", data, idem());
export const mouvementCaisse = (id, data) => apiClient.post(`/caisse/sessions/${id}/mouvements`, data, idem());
export const annulerMouvementCaisse = (id, motif) => apiClient.post(`/caisse/mouvements/${id}/annuler`, { motif }, idem());
export const fermerCaisse = (id, data) => apiClient.post(`/caisse/sessions/${id}/fermer`, data, idem());
export const rouvrirCaisse = (id, motif) => apiClient.post(`/caisse/sessions/${id}/rouvrir`, { motif }, idem());

export const getRapportCommercial = (params) => apiClient.get("/rapport-commercial", { params });
export const getTableauDeBordCommerce = () => apiClient.get("/rapport-commercial/tableau-de-bord");
export const getVueGlobale = (params) => apiClient.get("/rapport-commercial/global", { params });
export const telechargerRapportCommercial = async (params) => {
  const r = await apiClient.get("/rapport-commercial", { params: { ...params, format: "xlsx" }, responseType: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(r.data);
  a.download = `rapport-commercial-${params.from || ""}-${params.to || ""}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const CATEGORIES_MOUVEMENT = [
  ["apport", "Apport (monnaie, fond)"], ["retrait_banque", "Dépôt en banque"], ["depense", "Petite dépense (enregistrée en dépense)"], ["autre", "Autre"],
];
export const BILLETS = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];
