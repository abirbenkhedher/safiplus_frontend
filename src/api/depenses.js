import apiClient from './client';

export const getDepenses = (params) =>
  apiClient.get('/depenses', { params });

export const getDepensesStats = (params) =>
  apiClient.get('/depenses/stats', { params });

export const createDepense = (data) =>
  apiClient.post('/depenses', data);

export const updateDepense = (id, data) =>
  apiClient.put(`/depenses/${id}`, data);

export const deleteDepense = (id) =>
  apiClient.delete(`/depenses/${id}`);