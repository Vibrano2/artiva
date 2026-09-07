/**
 * chatService.js
 *
 * Used by:
 *   ChatScreen → subscribeToChat(jobId, callback) → unsubscribe fn
 *              → sendChatMessage(jobId, content, senderUid) → { id, sender_uid, content }
 *   LiveTrackingScreen → subscribeToTracking(jobId, cb), streamGpsLocation(jobId, coords)
 */

import { db } from '../config/firebase';
import {
  addDoc, collection, doc,
  onSnapshot, orderBy, query,
  serverTimestamp, setDoc,
} from 'firebase/firestore';
import { mapMessage, requireCurrentUser } from './firebaseData';

export const ChatService = {
  /**
   * subscribeToChat(jobId, callback)
   *
   * Real-time Firestore listener for jobs/{jobId}/messages.
   * Messages are ordered by createdAt asc.
   * callback receives: Message[]  where message has { id, sender_uid, content, text, created_at }
   *
   * Returns unsubscribe function.
   */
  subscribeToChat(jobId, callback) {
    const key = String(jobId || 'default');
    return onSnapshot(
      query(collection(db, 'jobs', key, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => callback(snap.docs.map(mapMessage))
    );
  },

  /**
   * getChatMessages(jobId) — one-shot fetch
   */
  async getChatMessages(jobId) {
    return new Promise((resolve, reject) => {
      const unsub = this.subscribeToChat(jobId, (msgs) => { unsub(); resolve(msgs); }, reject);
    });
  },

  /**
   * sendChatMessage(jobId, content, senderUid)
   *
   * Writes a message to jobs/{jobId}/messages.
   * Returns: { id, sender_uid, content }
   */
  async sendChatMessage(jobId, content, senderUid) {
    const key = String(jobId || 'default');
    const user = requireCurrentUser();
    const ref = await addDoc(collection(db, 'jobs', key, 'messages'), {
      senderUid: user.uid,
      content: String(content || '').trim(),
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, sender_uid: user.uid, content };
  },

  /**
   * subscribeToTracking(jobId, callback)
   *
   * Real-time listener for jobs/{jobId}/tracking/current.
   * Returns unsubscribe function.
   */
  subscribeToTracking(jobId, callback) {
    return onSnapshot(doc(db, 'jobs', jobId, 'tracking', 'current'), (snap) => {
      if (snap.exists()) callback(snap.data());
    });
  },

  /**
   * streamGpsLocation(jobId, { latitude, longitude, heading, status })
   *
   * Artisan pushes their GPS position. Merges into tracking/current.
   */
  async streamGpsLocation(jobId, { latitude, longitude, heading = 0, status = 'en_route' }) {
    const user = requireCurrentUser();
    await setDoc(
      doc(db, 'jobs', jobId, 'tracking', 'current'),
      { artisanId: user.uid, latitude, longitude, heading, status, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  },
};
