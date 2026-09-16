import apiClient from './client';

export const getClients = async (params = {}) => {
  const response = await apiClient.get('/clients', { params });
  return response.data;
};

export const getClient = async (id) => {
  const response = await apiClient.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (data) => {
  const response = await apiClient.post('/clients', data);
  return response.data;
};

export const updateClient = async (id, data) => {
  const response = await apiClient.put(`/clients/${id}`, data);
  return response.data;
};

export const findClientByPhone = async (phone) => {
  const response = await apiClient.get('/clients/search/phone', {
    params: { phone }
  });
  return response.data;
};

export const deleteClient = async (id) => {
  const response = await apiClient.delete(`/clients/${id}`);
  return response.data;
};
