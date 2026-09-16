import apiClient from './client';

export const getUsers = async (params = {}) => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

export const getUser = async (id) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await apiClient.post('/users', data);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await apiClient.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/users/${id}`);
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await apiClient.patch(`/users/${id}/status`);
  return response.data;
};

// ✅ NOUVEAU
export const getAvailableModules = async () => {
  const response = await apiClient.get('/users/meta/modules');
  return response.data;
};