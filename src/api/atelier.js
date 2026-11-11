import apiClient from "./client";

// ============================================================
// ✅ Module atelier (cahier des charges V1.1)
// Les validations envoient une clé d'idempotence (évite les doubles
// validations en cas de réseau instable / double clic).
// ============================================================
const newKey = () =>
  (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const idem = (key = newKey()) => ({ headers: { "Idempotency-Key": key } });

// Paramètres de la boutique
export const getParametresAtelier = () => apiClient.get("/atelier/parametres");
export const updateParametresAtelier = (data) => apiClient.put("/atelier/parametres", data);

// Fournisseurs
export const getFournisseurs = (params) => apiClient.get("/atelier/fournisseurs", { params });
export const createFournisseur = (data) => apiClient.post("/atelier/fournisseurs", data);
export const updateFournisseur = (id, data) => apiClient.put(`/atelier/fournisseurs/${id}`, data);
export const deleteFournisseur = (id) => apiClient.delete(`/atelier/fournisseurs/${id}`);

// Factures d'achat (dépenses de type ACHAT)
export const getDepense = (id) => apiClient.get(`/depenses/${id}`);
export const validerDepense = (id, key) => apiClient.post(`/depenses/${id}/validate`, {}, idem(key));
export const annulerDepense = (id, motif) => apiClient.post(`/depenses/${id}/annuler`, { motif }, idem());
export const uploadPieceJointe = (id, file) => {
  const fd = new FormData();
  fd.append("fichier", file);
  return apiClient.post(`/depenses/${id}/pieces-jointes`, fd, { headers: { "Content-Type": "multipart/form-data" } });
};
export const openPieceJointe = async (id, pjId) => {
  const r = await apiClient.get(`/depenses/${id}/pieces-jointes/${pjId}`, { responseType: "blob" });
  window.open(URL.createObjectURL(r.data), "_blank");
};

// Stock : coût, transferts, inventaire
export const getCoutArticle = (id) => apiClient.get(`/stock/${id}/cout`);
export const transfertStock = (data) => apiClient.post("/stock/transfert", data, idem());
export const inventaireStock = (data) => apiClient.post("/stock/inventaire", data, idem());

// Déclarations journalières
export const getDeclarations = (params) => apiClient.get("/declarations", { params });
export const createDeclaration = (data) => apiClient.post("/declarations", data);
export const updateDeclaration = (id, data) => apiClient.put(`/declarations/${id}`, data);
export const validerDeclaration = (id) => apiClient.post(`/declarations/${id}/validate`, {}, idem());
export const annulerDeclaration = (id, motif) => apiClient.post(`/declarations/${id}/annuler`, { motif }, idem());

// Rémunération
export const getMaRemuneration = (params) => apiClient.get("/remuneration/me", { params });
export const getReparateurs = () => apiClient.get("/remuneration/reparateurs");
export const getSoldes = (params) => apiClient.get("/remuneration/summary", { params });
export const getRegles = (params) => apiClient.get("/remuneration/regles", { params });
export const createRegle = (data) => apiClient.post("/remuneration/regles", data);
export const updateRegle = (id, data) => apiClient.put(`/remuneration/regles/${id}`, data);
export const deleteRegle = (id) => apiClient.delete(`/remuneration/regles/${id}`);
export const getContrats = (params) => apiClient.get("/remuneration/contrats", { params });
export const createContrat = (data) => apiClient.post("/remuneration/contrats", data);
export const terminerContrat = (id, validTo) => apiClient.post(`/remuneration/contrats/${id}/terminer`, { validTo });
export const getCommissions = (params) => apiClient.get("/remuneration/commissions", { params });
export const calculerCommissions = (data) => apiClient.post("/remuneration/commissions/calculate", data, idem());
export const validerCommissions = (data) => apiClient.post("/remuneration/commissions/valider", data, idem());
export const getEcritures = (params) => apiClient.get("/remuneration/ecritures", { params });
export const createEcriture = (data) => apiClient.post("/remuneration/ecritures", data, idem());
export const annulerEcriture = (id, motif) => apiClient.post(`/remuneration/ecritures/${id}/annuler`, { motif }, idem());
export const getPaiementsReparateurs = (params) => apiClient.get("/remuneration/paiements", { params });
export const createPaiementReparateur = (data) => apiClient.post("/remuneration/paiements", data, idem());
export const annulerPaiementReparateur = (id, motif) => apiClient.post(`/remuneration/paiements/${id}/annuler`, { motif }, idem());

// Clôtures
export const getClotures = (params) => apiClient.get("/remuneration/clotures", { params });
export const getCloture = (id) => apiClient.get(`/remuneration/clotures/${id}`);
export const cloturerJour = (jour) => apiClient.post("/remuneration/clotures/jour", { jour }, idem());
export const cloturerMois = (periode) => apiClient.post("/remuneration/clotures/mois", { periode }, idem());
export const rouvrirCloture = (id, motif) => apiClient.post(`/remuneration/clotures/${id}/rouvrir`, { motif }, idem());

// Rapports
export const getDashboardAtelier = (params) => apiClient.get("/rapports/dashboard", { params });
export const getRentabiliteBoutique = (params) => apiClient.get("/rapports/rentabilite", { params });
export const getRentabiliteReparation = (id) => apiClient.get(`/rapports/reparation/${id}/rentabilite`);
export const getRapport = (nom, params) => apiClient.get(`/rapports/${nom}`, { params });
export const downloadRapport = async (nom, params) => {
  const r = await apiClient.get(`/rapports/${nom}`, { params: { ...params, format: "xlsx" }, responseType: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(r.data);
  a.download = `rapport-${nom}.xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
};
