import apiClient from './client';

export const getCategories = async (params = {}) => {
  const response = await apiClient.get('/categories', { params });
  return response.data;
};

export const getCategorie = async (id) => {
  const response = await apiClient.get(`/categories/${id}`);
  return response.data;
};

export const createCategorie = async (data) => {
  const response = await apiClient.post('/categories', data);
  return response.data;
};

export const updateCategorie = async (id, data) => {
  const response = await apiClient.put(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategorie = async (id) => {
  const response = await apiClient.delete(`/categories/${id}`);
  return response.data;
};