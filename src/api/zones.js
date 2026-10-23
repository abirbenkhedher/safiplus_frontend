import apiClient from './client';

export const getZones = (params = {}) => apiClient.get('/zones', { params });
export const getZone = (id) => apiClient.get(`/zones/${id}`);
export const createZone = (data) => apiClient.post('/zones', data);
export const updateZone = (id, data) => apiClient.put(`/zones/${id}`, data);
export const deleteZone = (id) => apiClient.delete(`/zones/${id}`);