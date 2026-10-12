import apiClient from './client';

// ============================================================
// ✅ GET - Liste des clients (avec params : limit, page, search...)
// ============================================================
export const getClients = async (params = {}) => {
  const response = await apiClient.get('/clients', { params });
  return response.data;
};

// ============================================================
// ✅ GET - Clients passagers (numéro 00000000)
// ============================================================
export const getPassengerClients = async () => {
  const response = await apiClient.get('/clients/passengers');
  return response.data;
};

// ============================================================
// GET - Un client par ID
// ============================================================
export const getClient = async (id) => {
  const response = await apiClient.get(`/clients/${id}`);
  return response.data;
};

// ============================================================
// POST - Créer un client
// ============================================================
export const createClient = async (data) => {
  const response = await apiClient.post('/clients', data);
  return response.data;
};

// ============================================================
// PUT - Modifier un client
// ============================================================
export const updateClient = async (id, data) => {
  const response = await apiClient.put(`/clients/${id}`, data);
  return response.data;
};

// ============================================================
// GET - Recherche par téléphone / code fidélité
// ============================================================
export const findClientByPhone = async (phone) => {
  const response = await apiClient.get('/clients/search/phone', {
    params: { phone },
  });
  return response.data;
};

// ============================================================
// DELETE - Supprimer un client
// ============================================================
export const deleteClient = async (id) => {
  const response = await apiClient.delete(`/clients/${id}`);
  return response.data;
};

// ============================================================
// DELETE - Supprimer plusieurs clients
// ============================================================
export const deleteManyClients = async (ids) => {
  const response = await apiClient.delete('/clients/many', {
    data: { ids },
  });
  return response.data;
};