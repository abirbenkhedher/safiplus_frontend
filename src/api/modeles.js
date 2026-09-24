import apiClient from './client';

export const getModeles = async (params = {}) => {
  const response = await apiClient.get('/modeles', { params });
  return response.data;
};

export const getModele = async (id) => {
  const response = await apiClient.get(`/modeles/${id}`);
  return response.data;
};

export const createModele = async (data) => {
  const response = await apiClient.post('/modeles', data);
  return response.data;
};

export const updateModele = async (id, data) => {
  const response = await apiClient.put(`/modeles/${id}`, data);
  return response.data;
};

export const deleteModele = async (id) => {
  const response = await apiClient.delete(`/modeles/${id}`);
  return response.data;
};