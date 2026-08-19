import { apiCall } from './apiConfig';

export const ChatService = {
  getChatMessages: async (matchId) => {
    return apiCall(`/chat/${matchId}/messages`, 'GET');
  },

  sendChatMessage: async (matchId, text) => {
    return apiCall(`/chat/${matchId}/messages`, 'POST', { text });
  }
};
