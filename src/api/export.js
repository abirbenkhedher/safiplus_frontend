import apiClient from './client';

// ============================================================
// ✅ Télécharger un blob
// ============================================================
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ============================================================
// ✅ EXPORT RÉPARATIONS
// ============================================================
export const exportReparations = async (options = {}) => {
  const { reparations, filters, ...serverFilters } = options;
  const filename = `reparations_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (Array.isArray(reparations)) {
    const response = await apiClient.post(
      '/export/reparations',
      { reparations, filters: filters || {} },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, filename);
    return { success: true };
  }

  const queryString = new URLSearchParams(serverFilters).toString();
  const url = `/export/reparations${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};

// ============================================================
// ✅ EXPORT CLIENTS
// ============================================================
export const exportClients = async (options = {}) => {
  const { clients, filters, ...serverFilters } = options;
  const filename = `clients_${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (Array.isArray(clients)) {
    const response = await apiClient.post(
      '/export/clients',
      { clients, filters: filters || {} },
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, filename);
    return { success: true };
  }

  const queryString = new URLSearchParams(serverFilters).toString();
  const url = `/export/clients${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};

// ============================================================
// ✅ EXPORT UTILISATEURS
// ============================================================
export const exportUsers = async () => {
  const filename = `utilisateurs_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const response = await apiClient.get('/export/users', { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};

// ============================================================
// ✅ EXPORT HISTORIQUE
// ============================================================
export const exportHistory = async (params = {}) => {
  const filename = `historique_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const queryString = new URLSearchParams(params).toString();
  const url = `/export/history${queryString ? `?${queryString}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};

// ============================================================
// ✅ NOUVEAU : EXPORT APPAREILS (Statistiques)
// ============================================================
export const exportAppareils = async ({ appareils, filters = {} }) => {
  const filename = `appareils_stats_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const response = await apiClient.post(
    '/export/appareils',
    { appareils, filters },
    { responseType: 'blob' }
  );

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};


// ============================================================
// ✅ NOUVEAU : EXPORT FAMILLES
// ============================================================
export const exportFamilles = async ({ familles, filters = {} }) => {
  const filename = `familles_stats_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const response = await apiClient.post(
    '/export/familles',
    { familles, filters },
    { responseType: 'blob' }
  );
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};

// ============================================================
// ✅ NOUVEAU : EXPORT CATÉGORIES
// ============================================================
export const exportCategories = async ({ categories, filters = {} }) => {
  const filename = `categories_stats_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const response = await apiClient.post(
    '/export/categories',
    { categories, filters },
    { responseType: 'blob' }
  );
  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, filename);
  return { success: true };
};