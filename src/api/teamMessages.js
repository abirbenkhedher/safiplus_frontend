import apiClient from './client';

export const getTeamMessages = async () => {
  const response = await apiClient.get('/team-messages');
  return response.data;
};

export const sendTeamMessage = async (message, priority = 'normal') => {
  const response = await apiClient.post('/team-messages', {
    message,
    priority,
  });
  return response.data;
};

export const markMessageAsRead = async (id) => {
  const response = await apiClient.patch(`/team-messages/${id}/read`);
  return response.data;
};

export const markAllMessagesAsRead = async () => {
  const response = await apiClient.patch('/team-messages/read-all');
  return response.data;
};

export const deleteTeamMessage = async (id) => {
  const response = await apiClient.delete(`/team-messages/${id}`);
  return response.data;
};