import apiClient from './client';

export const getObjets = async () => {
  const response = await apiClient.get('/objets');
  return response.data;
};

export const getObjet = async (id) => {
  const response = await apiClient.get(`/objets/${id}`);
  return response.data;
};

export const createObjet = async (data) => {
  const response = await apiClient.post('/objets', data);
  return response.data;
};

export const updateObjet = async (id, data) => {
  const response = await apiClient.put(`/objets/${id}`, data);
  return response.data;
};

export const deleteObjet = async (id) => {
  const response = await apiClient.delete(`/objets/${id}`);
  return response.data;
};