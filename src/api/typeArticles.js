import apiClient from './client';

export const getTypeArticles = (params) =>
  apiClient.get('/typearticles', { params });

export const createTypeArticle = (nom) =>
  apiClient.post('/typearticles', { nom });

export const deleteTypeArticle = (id) =>
  apiClient.delete(`/typearticles/${id}`);