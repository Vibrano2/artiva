/**
 * analyticsService.js
 *
 * AnalyticsService.log(eventType, metadata) — fire-and-forget client analytics
 * NotificationService.subscribe(cb)         — real-time in-app notifications
 * NotificationService.markRead(id)
 * NotificationService.markAllRead()
 */

import { functions, db } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, doc, getDocs, writeBatch,
} from 'firebase/firestore';
import { requireCurrentUser } from './firebaseData';

const logEventFn = httpsCallable(functions, 'logAnalyticsEvent');

export const AnalyticsService = {
  /**
   * log(eventType, metadata)
   *
   * Silently drops errors — analytics must never break the user flow.
   */
  async log(eventType, metadata = {}) {
    try {
      await logEventFn({ eventType, metadata });
    } catch {
      // intentionally silent
    }
  },
};

export const NotificationService = {
  /**
   * subscribe(callback)
   *
   * Real-time listener for notifications/{userId}.
   * Returns unsubscribe function.
   * callback receives: Notification[]
   */
  subscribe(callback) {
    const user = requireCurrentUser();
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) =>
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
        }))
      )
    );
  },

  /**
   * markRead(notificationId)
   */
  async markRead(notificationId) {
    const user = requireCurrentUser();
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return { success: true };
  },

  /**
   * markAllRead()
   */
  async markAllRead() {
    const user = requireCurrentUser();
    const snap = await getDocs(
      query(
        collection(db, 'notifications'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      )
    );
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    return { success: true, count: snap.size };
  },
};
