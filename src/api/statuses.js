import apiClient from './client';

export const getStatuses = async () => {
  const response = await apiClient.get('/statuses');
  return response.data;
};

export const getStatus = async (id) => {
  const response = await apiClient.get(`/statuses/${id}`);
  return response.data;
};

export const createStatus = async (data) => {
  const response = await apiClient.post('/statuses', data);
  return response.data;
};

export const updateStatus = async (id, data) => {
  const response = await apiClient.put(`/statuses/${id}`, data);
  return response.data;
};

export const deleteStatus = async (id) => {
  const response = await apiClient.delete(`/statuses/${id}`);
  return response.data;
};

export const setDefaultStatus = async (id) => {
  const response = await apiClient.patch(`/statuses/${id}/default`);
  return response.data;
};