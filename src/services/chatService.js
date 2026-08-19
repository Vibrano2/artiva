import { fetchWithAuth } from './apiConfig';

export const ChatService = {
  getChatMessages: async (jobId) => {
    return fetchWithAuth(`/v1/chat/job/${jobId}?limit=50`, { method: 'GET' });
  },

  sendChatMessage: async (jobId, content) => {
    return fetchWithAuth(`/v1/chat/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }
};
