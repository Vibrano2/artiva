import { encodePath, fetchWithAuth } from './apiConfig';
import { normalizeJob } from './normalizers';

function messageList(response) {
  const messages = response?.data?.messages || response?.messages || response?.data || [];
  return Array.isArray(messages) ? messages : [];
}

export const ChatService = {
  subscribeToChat(jobId, callback) {
    let active = true;
    let timerId;
    let delivered = false;
    const poll = async () => {
      try {
        const messages = await this.getChatMessages(jobId);
        if (active) callback(messages);
        delivered = true;
      } catch {
        if (active && !delivered) callback([]);
      } finally {
        if (active) timerId = setTimeout(poll, 5_000);
      }
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timerId);
    };
  },

  async getChatMessages(jobId) {
    const response = await fetchWithAuth(`/api/chat/job/${encodePath(jobId)}`);
    return messageList(response);
  },

  async sendChatMessage(jobId, content) {
    const response = await fetchWithAuth(`/api/chat/job/${encodePath(jobId)}`, {
      method: 'POST',
      body: JSON.stringify({ content: String(content || '').trim() }),
    });
    return response.data?.message || response.data || response;
  },

  subscribeToTracking(jobId, callback) {
    let active = true;
    let timerId;
    const poll = async () => {
      try {
        const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}`);
        const job = normalizeJob(response.data?.job || response.job || response.data || response);
        if (active) callback({ status: job.tracking_state || 'awaiting_departure', job });
      } catch {
        // Keep the last known status and retry without creating an unhandled rejection.
      } finally {
        if (active) timerId = setTimeout(poll, 10_000);
      }
    };
    void poll();
    return () => {
      active = false;
      clearTimeout(timerId);
    };
  },

  async streamGpsLocation() {
    throw new Error('Precise GPS sharing is not enabled for this release.');
  },
};
