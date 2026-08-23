import { mockDb } from '../data/mockDatabase';

export const ChatService = {
  /**
   * Real-time client-side listener for bi-directional chat messages
   * @param {string} jobIdOrMatchId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribeToChat(jobIdOrMatchId, callback) {
    const key = String(jobIdOrMatchId || 'default');
    return mockDb.subscribeChat(key, callback);
  },

  /**
   * Fetch chat message history locally
   */
  async getChatMessages(jobIdOrMatchId) {
    const key = String(jobIdOrMatchId || 'default');
    return mockDb.getMessages(key);
  },

  /**
   * Send a chat message locally
   */
  async sendChatMessage(jobIdOrMatchId, content, senderUid) {
    const key = String(jobIdOrMatchId || 'default');
    return mockDb.addMessage(key, content, senderUid);
  },

  /**
   * Real-time listener for live artisan GPS tracking simulation
   * @param {string} jobId 
   * @param {Function} callback - Receives { lat, lng, heading, status }
   * @returns {Function} Unsubscribe function
   */
  subscribeToTracking(jobId, callback) {
    const clientLocation = [9.0632, 7.4233];
    let current = [9.0550, 7.4100];
    let heading = 45;

    const interval = setInterval(() => {
      const [lat, lng] = current;
      const [targetLat, targetLng] = clientLocation;
      const latDiff = targetLat - lat;
      const lngDiff = targetLng - lng;

      if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
        callback({
          lat: targetLat,
          lng: targetLng,
          heading: 0,
          status: 'arrived'
        });
        clearInterval(interval);
        return;
      }

      current = [lat + (latDiff * 0.1), lng + (lngDiff * 0.1)];
      callback({
        lat: current[0],
        lng: current[1],
        heading,
        status: 'en_route'
      });
    }, 2000);

    return () => clearInterval(interval);
  },

  /**
   * Stream artisan GPS location locally
   */
  async streamGpsLocation(jobId, { latitude, longitude, heading = 0, status = 'en_route' }) {
    return { success: true };
  }
};
