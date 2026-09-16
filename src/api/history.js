import apiClient from './client';

export const getHistory = async (params = {}) => {
  const response = await apiClient.get('/history', { params });
  return response.data;
};

export const getHistoryStats = async (params = {}) => {
  const response = await apiClient.get('/history/stats', { params });
  return response.data;
};

export const getEntityHistory = async (entityType, entityId) => {
  const response = await apiClient.get(`/history/entity/${entityType}/${entityId}`);
  return response.data;
};

export const getHistoryEntry = async (id) => {
  const response = await apiClient.get(`/history/${id}`);
  return response.data;
};

export const cleanOldHistory = async (days = 365) => {
  const response = await apiClient.delete(`/history/clean?days=${days}`);
  return response.data;
};