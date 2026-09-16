import apiClient from './client';

export const getDashboardStats = async () => {
  const response = await apiClient.get('/dashboard/stats');
  return response.data;
};

export const getDashboardCharts = async () => {
  const response = await apiClient.get('/dashboard/charts');
  return response.data;
};