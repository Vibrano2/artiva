import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { fetchWithAuth } from './apiConfig';
import { AuthService } from './authService';

export const ChatService = {
  /**
   * Real-time listener for chat messages using Firestore.
   * Messages live at jobs/{jobId}/messages (PRD §7.4).
   * Falls back to REST polling if Firestore is unavailable.
   *
   * @param {string} jobId
   * @param {Function} callback - called with the messages array on each update
   * @returns {Function} unsubscribe
   */
  subscribeToChat(jobId, callback) {
    try {
      const db = getFirestore();
      const msgsRef = collection(db, 'jobs', String(jobId), 'messages');
      const q = query(msgsRef, orderBy('created_at', 'asc'));

      return onSnapshot(q, (snap) => {
        const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(messages);
      }, () => {
        // Firestore listener failed — fall back to one-time REST fetch
        this.getChatMessages(jobId).then(callback).catch(() => callback([]));
      });
    } catch {
      // Firestore SDK not initialised — REST fallback
      this.getChatMessages(jobId).then(callback).catch(() => callback([]));
      return () => {};
    }
  },

  /**
   * Fetch chat message history via REST (PRD §9.5)
   */
  async getChatMessages(jobId) {
    try {
      const res = await fetchWithAuth(`/api/chat/job/${jobId}`);
      return res.messages || res.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  },

  /**
   * Send a chat message (PRD §7.4).
   * Tries Firestore direct write first (lower latency), falls back to REST.
   */
  async sendChatMessage(jobId, content, senderUid) {
    const uid = senderUid || AuthService.getCurrentUser()?.uid;

    // Try Firestore direct write
    try {
      const db = getFirestore();
      const msgsRef = collection(db, 'jobs', String(jobId), 'messages');
      await addDoc(msgsRef, {
        job_id: jobId,
        sender_uid: uid,
        content,
        is_read: false,
        created_at: serverTimestamp()
      });
      return { success: true };
    } catch {
      // Fall back to REST
    }

    const res = await fetchWithAuth(`/api/chat/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ content, sender_uid: uid })
    });
    return res.data || res;
  },

  /**
   * Real-time artisan GPS tracking simulation (frontend-only, no backend needed).
   */
  subscribeToTracking(jobId, callback) {
    const clientLocation = [9.0632, 7.4233];
    let current = [9.0550, 7.4100];

    const interval = setInterval(() => {
      const [lat, lng] = current;
      const [tLat, tLng] = clientLocation;
      const latDiff = tLat - lat;
      const lngDiff = tLng - lng;

      if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
        callback({ lat: tLat, lng: tLng, heading: 0, status: 'arrived' });
        clearInterval(interval);
        return;
      }
      current = [lat + latDiff * 0.1, lng + lngDiff * 0.1];
      callback({ lat: current[0], lng: current[1], heading: 45, status: 'en_route' });
    }, 2000);

    return () => clearInterval(interval);
  },

  async streamGpsLocation(jobId, { latitude, longitude, heading = 0, status = 'en_route' }) {
    return fetchWithAuth(`/api/jobs/${jobId}/tracking/arrive`, {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, heading, status })
    });
  }
};
