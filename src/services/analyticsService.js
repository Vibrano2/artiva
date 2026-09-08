import { logEvent as logAnalyticsEvent } from 'firebase/analytics';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { analytics, auth, db } from '../config/firebase';

export const AnalyticsService = {
  async log(eventType, metadata = {}) {
    if (!analytics || !/^[a-z][a-z0-9_]{0,39}$/.test(eventType)) return;
    const safeMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    );
    logAnalyticsEvent(analytics, eventType, safeMetadata);
  },
};

function createdAtMillis(value) {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?._seconds === 'number') return value._seconds * 1000;
  return 0;
}

export const NotificationService = {
  subscribe(callback) {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      callback([]);
      return () => {};
    }
    const notifications = query(
      collection(db, 'notifications'),
      where('recipient_uid', '==', uid),
      limit(100)
    );
    return onSnapshot(notifications, (snapshot) => {
      const values = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((left, right) => createdAtMillis(right.created_at) - createdAtMillis(left.created_at));
      callback(values);
    }, () => callback([]));
  },

  async markRead(notificationId) {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    return { success: true };
  },

  async markAllRead() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Authentication required.');
    const snapshot = await getDocs(query(
      collection(db, 'notifications'),
      where('recipient_uid', '==', uid),
      where('read', '==', false),
      limit(100)
    ));
    const batch = writeBatch(db);
    snapshot.docs.forEach((item) => batch.update(item.ref, { read: true }));
    await batch.commit();
    return { success: true, count: snapshot.size };
  },
};
