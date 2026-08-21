import { fetchWithAuth } from './apiConfig';
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const ChatService = {
  /**
   * Real-time Firestore listener for bi-directional chat messages
   * @param {string} jobId 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  subscribeToChat(jobId, callback) {
    if (!db || !jobId) return () => {};
    try {
      const messagesRef = collection(db, 'jobs', String(jobId), 'messages');
      const q = query(messagesRef, orderBy('created_at', 'asc'));
      return onSnapshot(
        q, 
        (snapshot) => {
          const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(messages);
        },
        (error) => {
          console.warn('Firestore chat listener fallback:', error);
          this.getChatMessages(jobId).then(callback).catch(() => {});
        }
      );
    } catch (err) {
      console.warn('Error initiating chat listener:', err);
      return () => {};
    }
  },

  /**
   * Fetch chat message history via REST API fallback
   */
  async getChatMessages(jobId) {
    const res = await fetchWithAuth(`/api/chat/job/${jobId}?limit=50`, { method: 'GET' });
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Send a chat message via REST API
   */
  async sendChatMessage(jobId, content) {
    return await fetchWithAuth(`/api/chat/job/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  /**
   * Real-time Firestore listener for live artisan GPS tracking
   * @param {string} jobId 
   * @param {Function} callback - Receives { lat, lng, heading, status }
   * @returns {Function} Unsubscribe function
   */
  subscribeToTracking(jobId, callback) {
    if (!db || !jobId) return () => {};
    try {
      const trackingDocRef = doc(db, 'jobs', String(jobId), 'tracking');
      return onSnapshot(
        trackingDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            callback({
              lat: data.latitude || data.lat,
              lng: data.longitude || data.lng,
              heading: data.heading || 0,
              status: data.status || 'en_route',
              updated_at: data.updated_at
            });
          }
        },
        (error) => {
          console.warn('Firestore tracking listener error:', error);
        }
      );
    } catch (err) {
      console.warn('Error setting tracking listener:', err);
      return () => {};
    }
  },

  /**
   * Artisan streams GPS coordinates to Firestore tracking doc
   */
  async streamGpsLocation(jobId, { latitude, longitude, heading = 0, status = 'en_route' }) {
    if (!db || !jobId) return;
    const trackingDocRef = doc(db, 'jobs', String(jobId), 'tracking');
    await setDoc(trackingDocRef, {
      latitude,
      longitude,
      heading,
      status,
      updated_at: serverTimestamp()
    }, { merge: true });
  }
};
