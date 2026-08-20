import { fetchWithAuth } from './apiConfig';

export const ChatService = {
  getChatMessages: async (jobId) => {
    return fetchWithAuth(`/api/chat/job/${jobId}?limit=50`, { method: 'GET' });
  },

  sendChatMessage: async (jobId, content) => {
    return fetchWithAuth(`/api/chat/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};
