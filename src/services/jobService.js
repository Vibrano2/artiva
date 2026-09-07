/**
 * jobService.js
 *
 * Used by:
 *   PostJobScreen          → postJob({trade,location,urgency,description,photos,client_uid}) → {jobId, id, job}
 *   ClientDashboardScreen  → getJobs({clientId}) → job[]
 *   MatchListScreen        → (via ArtisanService.matchArtisans) getJobMatches(jobId) → artisan[]
 *   PaystackCheckoutModal  → selectArtisan(jobId, artisanId)
 *   JobCompletionRating    → completeJob(jobId), rateJob(jobId, rating, review)
 *   ArtisanProformaScreen  → submitProformaInvoice({job_id,...})
 */

import { db, functions } from '../config/firebase';
import {
  addDoc, collection, doc, getDoc, getDocs,
  query, serverTimestamp, where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ArtisanService } from './artisanService';
import { mapJob, requireCurrentUser, withoutUndefined } from './firebaseData';

export const JobService = {
  /**
   * postJob(jobData)
   *
   * Creates a job document. Returns { jobId, id, job } where job is the
   * full mapped job object used to navigate to MatchListScreen.
   */
  async postJob(jobData) {
    const user = requireCurrentUser();
    const { title, trade, location, urgency, timing, description, budget, photos } = jobData;
    const locAddress =
      typeof location === 'object'
        ? location.address || location.city || 'Life Camp, Abuja'
        : location || 'Life Camp, Abuja';
    const locationDetails =
      typeof location === 'object'
        ? {
            address: location.address || locAddress,
            city: location.city || 'Abuja',
            state: location.state || 'FCT',
            lga: location.lga || 'Abuja Municipal',
          }
        : { address: locAddress, city: 'Abuja', state: 'FCT', lga: 'Abuja Municipal' };
    const jobBudget = budget ? Number(budget) : 15000;

    const ref = await addDoc(
      collection(db, 'jobs'),
      withoutUndefined({
        title: title || `${trade || 'General'} service request`,
        trade: trade || 'Plumbing',
        trade_needed: trade || 'Plumbing',
        description: description || 'Repairs required',
        location: locAddress,
        locationDetails,
        timing: timing || urgency || 'Today',
        urgency: urgency || timing || 'Today',
        budget: jobBudget,
        job_value: jobBudget,
        photos: (photos || []).filter((p) => typeof p === 'string'),
        clientId: user.uid,
        artisanId: null,
        status: 'open',
        escrowStatus: 'unfunded',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );

    const newJob = mapJob(await getDoc(ref));
    return { jobId: newJob.job_id, id: newJob.job_id, job: newJob };
  },

  /**
   * getJobs({ clientId?, artisanId?, status? })
   *
   * Used by ClientDashboardScreen: getJobs({ clientId: currentUser.uid })
   */
  async getJobs(filters = {}) {
    const user = requireCurrentUser();
    const field = filters.artisanId ? 'artisanId' : 'clientId';
    const value = filters.artisanId || filters.clientId || filters.client_uid || user.uid;
    const snaps = await getDocs(
      query(collection(db, 'jobs'), where(field, '==', value))
    );
    return snaps.docs
      .map(mapJob)
      .filter((j) => !filters.status || j.status === filters.status);
  },

  /**
   * getJobById(id)
   */
  async getJobById(id) {
    const snap = await getDoc(doc(db, 'jobs', id));
    return snap.exists() ? mapJob(snap) : null;
  },

  /**
   * triggerMatching(jobId) — alias for ArtisanService.matchArtisans
   */
  async triggerMatching(jobId) {
    return ArtisanService.matchArtisans(jobId);
  },

  /**
   * getJobMatches(jobId)
   *
   * Called by MatchListScreen: expects a flat artisan[] (not wrapped).
   */
  async getJobMatches(jobId) {
    const res = await ArtisanService.matchArtisans(jobId);
    return res.data?.matches?.map((m) => m.artisan) || [];
  },

  /**
   * selectArtisan(jobId, artisanId)
   *
   * Called by PaystackCheckoutModal before initializing payment.
   * Sets artisanId + status='matched' on the job.
   */
  async selectArtisan(jobId, artisanId) {
    const fn = httpsCallable(functions, 'selectArtisan');
    await fn({ jobId, artisanId });
    return this.getJobById(jobId);
  },

  /**
   * acceptJob(jobId) — assigned artisan accepts the funded offer.
   */
  async acceptJob(jobId) {
    const fn = httpsCallable(functions, 'acceptJob');
    const res = await fn({ jobId });
    return { success: true, data: res.data };
  },

  /**
   * updateJobStatus(jobId, status)
   */
  async updateJobStatus(jobId, status) {
    const fn = httpsCallable(functions, 'updateJobProgress');
    await fn({ jobId, status });
    return this.getJobById(jobId);
  },

  /**
   * completeJob(jobId)
   *
   * Called by JobCompletionRatingModal "Confirm Complete & Release Funds".
  * Marks job status='completed'. Supplier settlement is performed only after
  * the client submits a rating and every proforma has been approved.
   */
  async completeJob(jobId) {
    const fn = httpsCallable(functions, 'completeJob');
    await fn({ jobId });
    return { success: true, message: 'Job marked complete. Funds will be released to artisan.' };
  },

  /**
   * rateJob(jobId, rating, review)
   *
   * Called by JobCompletionRatingModal after job completion.
   * Updates the job with rating + review; the Firestore trigger persists
   * a rating document and recalculates priority_score.
   *
   * Returns 409-like error if already rated (checks existing rating doc).
   */
  async rateJob(jobId, rating, review = '') {
    const fn = httpsCallable(functions, 'submitRating');
    await fn({ jobId, rating: Number(rating), review: review || '' });

    return { success: true, message: 'Rating submitted successfully.' };
  },

  /**
   * submitReview(jobId, { rating, review })
   *
   * Alias that accepts the legacy object form.
   */
  async submitReview(jobId, { rating = 5, review = '' } = {}) {
    return this.rateJob(jobId, rating, review);
  },

  /**
   * startTracking(jobId)
   */
  async startTracking(jobId) {
    const fn = httpsCallable(functions, 'updateJobProgress');
    await fn({ jobId, status: 'in_progress', trackingStatus: 'en_route' });
    return { success: true, status: 'en_route' };
  },

  /**
   * arriveTracking(jobId)
   */
  async arriveTracking(jobId) {
    const fn = httpsCallable(functions, 'updateJobProgress');
    await fn({ jobId, trackingStatus: 'arrived' });
    return { success: true, status: 'arrived' };
  },
};
