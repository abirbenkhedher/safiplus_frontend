import apiClient from './client';

export const getPannes = async (params = {}) => {
  const response = await apiClient.get('/pannes', { params });
  return response.data;
};

export const getPanne = async (id) => {
  const response = await apiClient.get(`/pannes/${id}`);
  return response.data;
};

export const createPanne = async (data) => {
  const response = await apiClient.post('/pannes', data);
  return response.data;
};

export const updatePanne = async (id, data) => {
  const response = await apiClient.put(`/pannes/${id}`, data);
  return response.data;
};

export const deletePanne = async (id) => {
  const response = await apiClient.delete(`/pannes/${id}`);
  return response.data;
};