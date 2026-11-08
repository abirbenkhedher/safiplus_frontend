import apiClient from './client';

// ✅ Organisations (franchisés) — SUPER_ADMIN
export const getOrganisations = async () => (await apiClient.get('/organisations')).data;
export const getOrganisation = async (id) => (await apiClient.get(`/organisations/${id}`)).data;
export const createOrganisation = async (data) => (await apiClient.post('/organisations', data)).data;
export const updateOrganisation = async (id, data) => (await apiClient.put(`/organisations/${id}`, data)).data;
export const toggleOrganisationStatus = async (id) => (await apiClient.patch(`/organisations/${id}/status`)).data;
export const addOrganisationOwner = async (id, data) => (await apiClient.post(`/organisations/${id}/owners`, data)).data;
