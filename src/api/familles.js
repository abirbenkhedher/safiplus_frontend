import apiClient from './client';

export const getFamilles = async () => {
  const response = await apiClient.get('/familles');
  return response.data;
};

export const getFamille = async (id) => {
  const response = await apiClient.get(`/familles/${id}`);
  return response.data;
};

export const createFamille = async (data) => {
  const response = await apiClient.post('/familles', data);
  return response.data;
};

export const updateFamille = async (id, data) => {
  const response = await apiClient.put(`/familles/${id}`, data);
  return response.data;
};

export const deleteFamille = async (id) => {
  const response = await apiClient.delete(`/familles/${id}`);
  return response.data;
};