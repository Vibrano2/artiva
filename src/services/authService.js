/**
 * authService.js
 *
 * Used by:
 *   AuthScreen         → verifyFirebaseToken(token, role), verifyPhoneOtp(phone, otp, role)
 *   ArtisanSignupScreen → verifyFirebaseToken(token, 'artisan'), signupArtisan({...})
 */

import { auth, db } from '../config/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { requireCurrentUser, withoutUndefined } from './firebaseData';

const USER_KEY = 'artiva_current_user';

export const AuthService = {
  /**
   * verifyFirebaseToken(token, role)
   *
   * Called after Firebase Auth sign-in (Google, Apple, Phone OTP confirm).
   * Syncs Firestore users/{uid}, stores user in localStorage.
   * Returns: { token, user: { uid, first_name, last_name, email, phone, role } }
   */
  async verifyFirebaseToken(idToken, role = 'client') {
    return this.syncCurrentUser(role);
  },

  /**
   * verifyPhoneOtp(phone, otp, role)
   *
   * Fallback path when Firebase confirmationResult is unavailable.
   * In real usage Firebase phone auth handles this client-side.
   */
  async verifyPhoneOtp(phone, otp, role = 'client') {
    throw new Error('Phone verification must be completed through Firebase Authentication.');
  },

  /**
   * signupArtisan(data)
   *
   * Called by ArtisanSignupScreen on final step submission.
   * Creates artisanProfiles/{uid} and privateArtisans/{uid} documents.
   * Returns: { success, artisanId, user }
   */
  async signupArtisan(data) {
    const user = requireCurrentUser();

    const profile = withoutUndefined({
      uid: user.uid,
      first_name: data.first_name || 'Artisan',
      last_name: data.last_name || 'Professional',
      phone: data.phone || user.phoneNumber || '',
      trade: data.trade || 'Plumbing',
      location:
        typeof data.location === 'object'
          ? data.location.address || data.location.city || 'Life Camp, Abuja'
          : data.location || 'Life Camp, Abuja',
      services: data.services || data.skills || ['General Maintenance'],
      skills: data.services || data.skills || ['General Maintenance'],
      experience_years: Number(data.experience_years) || 0,
      hourly_rate: Number(data.hourly_rate) || 0,
      tagline: data.tagline || '',
      work_photos: (data.work_photos || []).filter((p) => typeof p === 'string'),
      available: true,
      isVerified: false,
      no_response_flags: 0,
      reputation_score: 0,
      completed_jobs: 0,
      priority_score: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // users/{uid} — role record
    await setDoc(
      doc(db, 'users', user.uid),
      withoutUndefined({
        uid: user.uid,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        role: 'artisan',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    // artisanProfiles/{uid} — public
    await setDoc(doc(db, 'artisanProfiles', user.uid), profile, { merge: true });

    // privateArtisans/{uid} — NIN + ID doc (admin-only read)
    await setDoc(
      doc(db, 'privateArtisans', user.uid),
      withoutUndefined({
        uid: user.uid,
        nin: data.nin || '',
        idDocumentUrl: data.id_photo || '',
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );

    const synced = await this.syncCurrentUser('artisan', profile);
    return { success: true, artisanId: user.uid, uid: user.uid, user: synced.user };
  },

  /**
   * registerClient({ idToken, first_name, last_name })
   *
   * Used by client signup path.
   */
  async registerClient({ idToken, first_name, last_name }) {
    return this.syncCurrentUser('client', { first_name, last_name });
  },

  /**
   * getMe() — re-sync current user from Firestore.
   */
  async getMe() {
    return this.syncCurrentUser();
  },

  logout() {
    localStorage.removeItem(USER_KEY);
    return signOut(auth);
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * syncCurrentUser(requestedRole, updates)
   *
   * Reads/writes users/{uid}, merges with Firebase Auth data, caches to localStorage.
   * Returns: { token, user }
   */
  async syncCurrentUser(requestedRole = 'client', updates = {}) {
    const user = requireCurrentUser();
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);
    const profile = existing.exists() ? existing.data() : {};

    // Preserve existing role; only upgrade to artisan/admin if explicitly requested
    const role = profile.role || (requestedRole === 'artisan' ? 'artisan' : 'client');

    const storedUser = withoutUndefined({
      uid: user.uid,
      first_name: updates.first_name || profile.first_name || user.displayName?.split(' ')[0] || 'User',
      last_name:
        updates.last_name ||
        profile.last_name ||
        user.displayName?.split(' ').slice(1).join(' ') ||
        '',
      email: user.email || profile.email || '',
      phone: user.phoneNumber || profile.phone || '',
      phoneNumber: user.phoneNumber || profile.phone || '',
      role,
      token: await user.getIdToken(),
    });

    const { token, ...profileFields } = storedUser;
    await setDoc(
      userRef,
      { ...profileFields, createdAt: profile.createdAt || serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );

    localStorage.setItem(USER_KEY, JSON.stringify(storedUser));
    return { token, user: storedUser };
  },
};
