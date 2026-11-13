import apiClient from "./client";

// ============================================================
// ✅ Gestion commerciale : documents de vente + règlements clients
// Les validations / règlements envoient une clé d'idempotence
// (pas de double facture ni de double encaissement sur double clic).
// ============================================================
const newKey = () =>
  (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const idem = (key = newKey()) => ({ headers: { "Idempotency-Key": key } });

// Documents
export const getParametresVente = () => apiClient.get("/ventes/parametres");
export const getDocuments = (params) => apiClient.get("/ventes", { params });
export const getDocument = (id) => apiClient.get(`/ventes/${id}`);
export const createDocument = (data) => apiClient.post("/ventes", data);
export const updateDocument = (id, data) => apiClient.put(`/ventes/${id}`, data);
export const deleteDocument = (id) => apiClient.delete(`/ventes/${id}`);
export const validerDocument = (id) => apiClient.post(`/ventes/${id}/valider`, {}, idem());
export const statutDevis = (id, statut) => apiClient.post(`/ventes/${id}/statut`, { statut });
export const annulerDocument = (id, motif) => apiClient.post(`/ventes/${id}/annuler`, { motif }, idem());
export const transformerDocument = (id, type) => apiClient.post(`/ventes/${id}/transformer`, { type });
export const creerAvoir = (id) => apiClient.post(`/ventes/${id}/avoir`);
export const creerDepuis = (data) => apiClient.post("/ventes/depuis", data);
export const getAFacturer = (client) => apiClient.get("/ventes/a-facturer", { params: { client } });
export const getDocumentsReparation = (id) => apiClient.get(`/ventes/reparation/${id}`);

// Vente comptoir (la clé d'idempotence est fixée par vente : un double clic ne crée pas deux tickets)
export const getArticlesComptoir = (search) => apiClient.get("/ventes/comptoir/articles", { params: { search } });
export const venteComptoir = (data, key) => apiClient.post("/ventes/comptoir", data, idem(key));
export const getComptoirJour = (params) => apiClient.get("/ventes/comptoir/jour", { params });
export const nouvelleCleVente = () => newKey();

// Règlements
export const getReglements = (params) => apiClient.get("/reglements", { params });
export const createReglement = (data) => apiClient.post("/reglements", data, idem());
export const affecterReglement = (id, data) => apiClient.post(`/reglements/${id}/affecter`, data, idem());
export const annulerReglement = (id, motif) => apiClient.post(`/reglements/${id}/annuler`, { motif }, idem());
export const etatCheque = (id, etat) => apiClient.post(`/reglements/${id}/cheque`, { etat }, idem());
export const getFacturesImpayees = (client) => apiClient.get("/reglements/impayees", { params: { client } });
export const getReleve = (clientId) => apiClient.get(`/reglements/releve/${clientId}`);
export const getSolde = (clientId) => apiClient.get(`/reglements/solde/${clientId}`);
export const getCreances = () => apiClient.get("/reglements/creances");
export const getJournal = (params) => apiClient.get("/reglements/journal", { params });
export const getSynthese = (params) => apiClient.get("/reglements/synthese", { params });

export const TYPES_DOC = {
  DEVIS: { label: "Devis", pluriel: "Devis", titre: "DEVIS" },
  BL: { label: "Bon de livraison", pluriel: "Bons de livraison", titre: "BON DE LIVRAISON" },
  FACTURE: { label: "Facture", pluriel: "Factures", titre: "FACTURE" },
  AVOIR: { label: "Avoir", pluriel: "Avoirs", titre: "AVOIR" },
  TICKET: { label: "Ticket", pluriel: "Tickets comptoir", titre: "TICKET DE CAISSE" },
};

export const MODES_REGLEMENT = [
  ["ESPECES", "Espèces"], ["CHEQUE", "Chèque"], ["VIREMENT", "Virement"], ["CARTE", "Carte / TPE"], ["AUTRE", "Autre"],
];
export const modeLabel = (m) => (MODES_REGLEMENT.find(([v]) => v === m) || [m, m])[1];
