import apiClient from './client';

export const getReparations = async (params = {}) => {
  const response = await apiClient.get('/reparations', { params });
  return response.data;
};

export const getReparation = async (id) => {
  const response = await apiClient.get(`/reparations/${id}`);
  return response.data;
};

export const createReparation = async (data) => {
  const response = await apiClient.post('/reparations', data);
  return response.data;
};

export const updateReparation = async (id, data) => {
  const response = await apiClient.put(`/reparations/${id}`, data);
  return response.data;
};

export const deleteReparation = async (id) => {
  const response = await apiClient.delete(`/reparations/${id}`);
  return response.data;
};

export const changeStatus = async (id, data) => {
  const response = await apiClient.patch(`/reparations/${id}/status`, data);
  return response.data;
};

export const assignReparateur = async (id, data) => {
  const response = await apiClient.patch(`/reparations/${id}/assign`, data);
  return response.data;
};

// Télécharger le PDF
export const downloadPDF = async (id) => {
  const response = await apiClient.get(`/reparations/${id}/pdf`, {
    responseType: 'blob'
  });
  return response.data;
};

// Obtenir le HTML du ticket
export const getTicketHTML = async (id) => {
  const response = await apiClient.get(`/reparations/${id}/ticket`, {
    responseType: 'text'
  });
  return response.data;
};

// ✅ Route PUBLIQUE (sans authentification)
export const getReparationPublic = async (numero) => {
  const response = await apiClient.get(`/reparations/public/${numero}`, {
    // ⚠️ Retirer le token si présent
    headers: { Authorization: undefined }
  });
  return response.data;
};

