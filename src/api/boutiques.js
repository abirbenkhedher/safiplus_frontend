import apiClient from './client';

// ✅ Boutiques accessibles à l'utilisateur connecté
export const getMyBoutiques = async () => (await apiClient.get('/boutiques/mine')).data;

// ✅ Gestion (propriétaire / super admin)
export const getBoutiques = async (params = {}) => (await apiClient.get('/boutiques', { params })).data;
export const createBoutique = async (data) => (await apiClient.post('/boutiques', data)).data;
export const updateBoutique = async (id, data) => (await apiClient.put(`/boutiques/${id}`, data)).data;
export const toggleBoutiqueStatus = async (id) => (await apiClient.patch(`/boutiques/${id}/status`)).data;
