/**
 * artisanService.js
 *
 * Used by:
 *   ClientDashboardScreen → getArtisans({trade?})          → artisan[]
 *   MatchListScreen       → getJobMatches(jobId)            → artisan[] (flat)
 *   ArtisanDashboardScreen→ getArtisanDashboard(uid)        → {held_total,released_total,completed_jobs,reputation_score,is_verified}
 *                         → updateAvailability(uid, bool)
 *   AdminAddArtisanScreen → addArtisan(payload)             → {success}
 *   AdminQueueScreen      → (via adminService) getAdminQueue()
 */

import { auth, db } from '../config/firebase';
import {
  collection, doc, getDoc, getDocs, query,
  serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { AuthService } from './authService';
import { mapArtisan, mapJob, requireCurrentUser, uploadUserFile, withoutUndefined } from './firebaseData';

export const ArtisanService = {
  /**
   * signupArtisan(data) — delegates to AuthService
   */
  async signupArtisan(data) {
    return AuthService.signupArtisan(data);
  },

  /**
   * getArtisans({ trade?, available? })
   *
   * Returns all public artisan profiles, optionally filtered.
   * ClientDashboard calls this with { trade } or {} for "All".
   */
  async getArtisans(filter = {}) {
    const snaps = await getDocs(collection(db, 'artisanProfiles'));
    return snaps.docs
      .map(mapArtisan)
      .filter((a) => !filter.trade || a.trade === filter.trade)
      .filter((a) => filter.available === undefined || a.available === filter.available);
  },

  /**
   * getArtisanProfile(uid)
   */
  async getArtisanProfile(uid) {
    const snap = await getDoc(doc(db, 'artisanProfiles', uid));
    return snap.exists() ? mapArtisan(snap) : null;
  },

  /**
   * getArtisanReviews(uid)
   */
  async getArtisanReviews(uid) {
    const snaps = await getDocs(
      query(collection(db, 'jobs'), where('artisanId', '==', uid))
    );
    return snaps.docs
      .map(mapJob)
      .filter((j) => j.rating)
      .map((j) => ({ id: j.id, rating: j.rating, comment: j.review || '', created_at: j.updated_at }));
  },

  /**
   * matchArtisans(jobId)
   *
   * Hard filter: trade + available + isVerified.
   * Sort: priority_score desc → completed_jobs desc (PRD Section 7.2).
   * Returns: { success, data: { matches: [{match_id, artisan}], count } }
   */
  async matchArtisans(jobId) {
    const jobSnap = await getDoc(doc(db, 'jobs', jobId));
    if (!jobSnap.exists()) throw new Error('Job not found.');
    const job = mapJob(jobSnap);

    const all = await this.getArtisans({ trade: job.trade, available: true });
    const verified = all.filter((a) => a.isVerified);

    // PRD priority sort
    const sorted = [...verified].sort((a, b) => {
      const pa = a.priority_score ?? 0;
      const pb = b.priority_score ?? 0;
      if (pb !== pa) return pb - pa;
      return (b.completed_jobs ?? 0) - (a.completed_jobs ?? 0);
    });

    return {
      success: true,
      data: {
        matches: sorted.map((a) => ({
          match_id: `match_${jobId}_${a.uid}`,
          artisan: {
            uid: a.uid,
            id: a.uid,
            first_name: a.first_name,
            last_name: a.last_name,
            trade: a.trade,
            tagline: a.tagline || '',
            services: a.services || [],
            skills: a.skills || [],
            reputation_score: a.reputation_score ?? 0,
            completed_jobs: a.completed_jobs ?? 0,
            priority_score: a.priority_score ?? 0,
            location: a.location,
            distance_km: a.distance_km ?? '< 5',
            work_photos: a.work_photos || [],
            verified: Boolean(a.isVerified),
            is_verified: Boolean(a.isVerified),
            nin_verified: Boolean(a.isVerified),
            available: a.available,
            match_fee: 500,
          },
        })),
        count: sorted.length,
      },
    };
  },

  /**
   * updateMyProfile(updateData)
   */
  async updateMyProfile(updateData) {
    const user = requireCurrentUser();
    // Strip fields the artisan must not self-write
    const { nin, isVerified, verified, uid, no_response_flags, priority_score, ...safe } = updateData;
    await updateDoc(doc(db, 'artisanProfiles', user.uid), withoutUndefined({
      ...safe,
      updatedAt: serverTimestamp(),
    }));
    return this.getArtisanProfile(user.uid);
  },

  /**
   * updateAvailability(uid, available)
   *
   * Called by ArtisanDashboardScreen toggle button.
   */
  async updateAvailability(uid, available) {
    const user = requireCurrentUser();
    if (user.uid !== uid) throw new Error('You can only update your own availability.');
    await updateDoc(doc(db, 'artisanProfiles', uid), {
      available: Boolean(available),
      updatedAt: serverTimestamp(),
    });
    return this.getArtisanProfile(uid);
  },

  /**
   * uploadProfilePhoto(uid, file)
   */
  async uploadProfilePhoto(uid, file) {
    const user = requireCurrentUser();
    if (user.uid !== uid) throw new Error('You can only upload your own profile photo.');
    const url = typeof file === 'string'
      ? file
      : await uploadUserFile(`users/${uid}/profile/${Date.now()}-${file.name}`, file);
    await updateDoc(doc(db, 'artisanProfiles', uid), { profile_photo: url, updatedAt: serverTimestamp() });
    return { success: true, url };
  },

  /**
   * uploadIdDocument(uid, nin, file)
   */
  async uploadIdDocument(uid, nin, file) {
    const user = requireCurrentUser();
    if (user.uid !== uid) throw new Error('You can only upload your own verification document.');
    const url = await uploadUserFile(`artisans/${uid}/verification/${Date.now()}-${file.name}`, file);
    await setDoc(
      doc(db, 'privateArtisans', uid),
      { uid, nin, idDocumentUrl: url, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true, message: 'ID document uploaded successfully', url };
  },

  /**
   * getArtisanDashboard(uid)
   *
   * Called by ArtisanDashboardScreen.
   * Returns: { held_total, released_total, completed_jobs, reputation_score, is_verified }
   */
  async getArtisanDashboard(uid) {
    const [artisan, jobsSnap, paymentsSnap] = await Promise.all([
      this.getArtisanProfile(uid),
      getDocs(query(collection(db, 'jobs'), where('artisanId', '==', uid))),
      getDocs(query(collection(db, 'payments'), where('artisanId', '==', uid))),
    ]);

    const jobs = jobsSnap.docs.map(mapJob);
    const completedJobs = jobs.filter((j) => j.status === 'completed').length;

    const payments = paymentsSnap.docs.map((d) => d.data());
    const heldTotal = payments
      .filter((p) => p.status === 'paid' && p.payoutStatus !== 'disbursed')
      .reduce((s, p) => s + Number(p.jobValue || 0), 0);
    const releasedTotal = payments
      .filter((p) => p.payoutStatus === 'disbursed' || p.payoutStatus === 'confirmed')
      .reduce((s, p) => s + Number(p.artisanNet || 0), 0);

    return {
      held_total: heldTotal,
      released_total: releasedTotal,
      completed_jobs: completedJobs,
      reputation_score: artisan?.reputation_score ?? 0,
      is_verified: artisan?.isVerified ?? false,
    };
  },
};
