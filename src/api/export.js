import apiClient from './client';

// Télécharger un fichier
const downloadFile = async (url, filename) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob'
    });

    // Créer un lien de téléchargement
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    
    return { success: true };
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    throw error;
  }
};

export const exportReparations = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `/export/reparations${queryString ? `?${queryString}` : ''}`;
  const filename = `reparations_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(url, filename);
};

export const exportClients = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `/export/clients${queryString ? `?${queryString}` : ''}`;
  const filename = `clients_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(url, filename);
};

export const exportUsers = async () => {
  const url = '/export/users';
  const filename = `utilisateurs_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(url, filename);
};

export const exportHistory = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = `/export/history${queryString ? `?${queryString}` : ''}`;
  const filename = `historique_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return downloadFile(url, filename);
};