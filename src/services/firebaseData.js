/**
 * firebaseData.js
 *
 * Shared data-mapping utilities used across all service files.
 * No business logic — only mapping, validation, and upload helpers.
 */

import { auth, db, storage } from '../config/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * requireCurrentUser()
 *
 * Throws if no Firebase Auth user is signed in.
 * Returns: firebase.User
 */
export function requireCurrentUser() {
  if (!auth.currentUser) throw new Error('You must be signed in to continue.');
  return auth.currentUser;
}

/**
 * toIsoDate(value)
 *
 * Converts Firestore Timestamp | Date | string → ISO string | null
 */
export function toIsoDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : null;
}

/**
 * withoutUndefined(value)
 *
 * Recursively strips undefined values (Firestore rejects them).
 */
export function withoutUndefined(value) {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, withoutUndefined(v)])
    );
  }
  return value;
}

/**
 * mapJob(snapshot) → job object
 *
 * Canonical job shape consumed by all screens:
 *   job_id, id, client_id, artisan_id, trade, description, location,
 *   urgency, timing, budget, status, escrowStatus, photos,
 *   rating, review, created_at, updated_at
 */
export function mapJob(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    job_id: snapshot.id,
    client_id: data.clientId,
    artisan_id: data.artisanId || null,
    match_id: data.matchId || null,
    created_at: toIsoDate(data.createdAt),
    updated_at: toIsoDate(data.updatedAt),
  };
}

/**
 * mapArtisan(snapshot) → artisan object
 *
 * Public artisan shape — NIN and idDocumentUrl are never included.
 *   uid, id, first_name, last_name, trade, location, services, skills,
 *   tagline, work_photos, available, is_available,
 *   isVerified, verified, is_verified,
 *   reputation_score, completed_jobs, priority_score,
 *   no_response_flags, created_at, updated_at
 */
export function mapArtisan(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    uid: snapshot.id,
    verified: Boolean(data.isVerified),
    is_verified: Boolean(data.isVerified),
    // NIN badge: shown when admin has verified the artisan
    nin_verified: Boolean(data.isVerified),
    available: data.available !== false,
    is_available: data.available !== false,
    reputation_score: data.reputation_score ?? 0,
    completed_jobs: data.completed_jobs ?? 0,
    priority_score: data.priority_score ?? 0,
    no_response_flags: data.no_response_flags ?? 0,
    // distance_km: estate-level matching means all artisans are in Life Camp.
    // Show a fixed display value; real distance ranking is handled server-side
    // via priority_score. A specific value is only available if the artisan
    // stored their coordinates and we computed haversine distance — not done yet.
    distance_km: data.distance_km ?? '< 5',
    // match_fee is always ₦500 per PRD Section 12.1
    match_fee: 500,
    created_at: toIsoDate(data.createdAt),
    updated_at: toIsoDate(data.updatedAt),
  };
}

/**
 * mapProforma(snapshot) → proforma object
 *   id, job_id, artisanId, supplier_name, total_amount,
 *   materials_cost, labor_cost, items, receipt_url, status,
 *   created_at, updated_at
 */
export function mapProforma(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    job_id: data.jobId || data.job_id,
    created_at: toIsoDate(data.createdAt),
    updated_at: toIsoDate(data.updatedAt),
  };
}

/**
 * mapMessage(snapshot) → message object
 *
 * ChatScreen reads: msg.sender_uid, msg.content (or msg.text), msg.created_at
 */
export function mapMessage(snapshot) {
  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    sender_uid: data.senderUid,
    text: data.content,       // backward-compat alias
    content: data.content,
    created_at: toIsoDate(data.createdAt),
  };
}

/**
 * uploadUserFile(path, file)
 *
 * Uploads a Blob/File to Firebase Storage and returns the download URL.
 */
export async function uploadUserFile(path, file) {
  if (!(file instanceof Blob)) throw new Error('Please choose a file to upload.');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || undefined });
  return getDownloadURL(storageRef);
}
