import apiClient from './client';

export const getMarques = async (params = {}) => {
  const response = await apiClient.get('/marques', { params });
  return response.data;
};

export const getMarque = async (id) => {
  const response = await apiClient.get(`/marques/${id}`);
  return response.data;
};

export const createMarque = async (data) => {
  const response = await apiClient.post('/marques', data);
  return response.data;
};

export const updateMarque = async (id, data) => {
  const response = await apiClient.put(`/marques/${id}`, data);
  return response.data;
};

export const deleteMarque = async (id) => {
  const response = await apiClient.delete(`/marques/${id}`);
  return response.data;
};