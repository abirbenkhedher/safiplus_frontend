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
// - Si `reparations` fourni → POST avec données filtrées
// - Sinon → GET avec filtres serveur (fallback)
// ============================================================
export const exportReparations = async (options = {}) => {
  const { reparations, filters, ...serverFilters } = options;
  const filename = `reparations_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // ✅ Cas 1 : données filtrées passées en direct → POST
  if (Array.isArray(reparations)) {
    const response = await apiClient.post(
      '/export/reparations',
      {
        reparations,
        filters: filters || {},
      },
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, filename);
    return { success: true };
  }

  // ✅ Cas 2 : filtres serveur classiques → GET
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
// - Si `clients` fourni → POST avec données filtrées
// - Sinon → GET avec filtres serveur (fallback)
// ============================================================
export const exportClients = async (options = {}) => {
  const { clients, filters, ...serverFilters } = options;
  const filename = `clients_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // ✅ Cas 1 : données filtrées passées en direct → POST
  if (Array.isArray(clients)) {
    const response = await apiClient.post(
      '/export/clients',
      {
        clients,
        filters: filters || {},
      },
      {
        responseType: 'blob',
      }
    );

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    downloadBlob(blob, filename);
    return { success: true };
  }

  // ✅ Cas 2 : filtres serveur classiques → GET
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
// ✅ EXPORT UTILISATEURS (inchangé)
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
// ✅ EXPORT HISTORIQUE (inchangé)
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