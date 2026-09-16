import apiClient from './client';

export const login = async (username, password) => {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await apiClient.post('/auth/refresh', { refreshToken });
  return response.data;
};