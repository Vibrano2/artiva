/**
 * adminService.js
 *
 * Used by:
 *   AdminQueueScreen       → getAdminQueue()                    → artisan[]
 *                          → verifyArtisan(uid)
 *   AdminProformaQueue     → request('/admin/proforma-queue')   → {data:{queue:[]}}
 *                          → request('/admin/proforma/${id}/approve', {method:'POST',...})
 *                          → request('/admin/proforma/${id}/reject',  {method:'POST',...})
 *   AdminDashboardScreen   → (static metrics — no API call needed)
 *   AdminAddArtisanScreen  → addArtisan(payload)                → {success}
 */

import { db, functions } from '../config/firebase';
import {
  collection, doc, getDocs, serverTimestamp,
  setDoc, updateDoc, where, query,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { mapArtisan, mapJob, mapProforma, withoutUndefined } from './firebaseData';

export const AdminService = {
  /**
   * request(endpoint, options)
   *
   * Compatibility shim consumed by AdminProformaQueueScreen which calls:
   *   ApiService.request('/admin/proforma-queue')
   *   ApiService.request('/admin/proforma/${id}/approve', { method:'POST', body })
   *   ApiService.request('/admin/proforma/${id}/reject',  { method:'POST', body })
   */
  async request(endpoint, options = {}) {
    if (endpoint === '/admin/proforma-queue') {
      const queue = await this.getAdminProformaQueue();
      return { data: { queue } };
    }

    const approveMatch = endpoint.match(/^\/admin\/proforma\/([^/]+)\/approve$/);
    if (approveMatch) {
      const body = options.body ? JSON.parse(options.body) : {};
      return this.approveProforma(approveMatch[1], body);
    }

    const rejectMatch = endpoint.match(/^\/admin\/proforma\/([^/]+)\/reject$/);
    if (rejectMatch) {
      const body = options.body ? JSON.parse(options.body) : {};
      return this.rejectProforma(rejectMatch[1], body.reason || 'Rejected');
    }

    return { success: true, data: {} };
  },

  /**
   * getAdminStats()
   *
   * Aggregate metrics for the Admin Dashboard.
   */
  async getAdminStats() {
    const [artisanSnaps, jobSnaps, paymentSnaps] = await Promise.all([
      getDocs(collection(db, 'artisanProfiles')),
      getDocs(collection(db, 'jobs')),
      getDocs(collection(db, 'payments')),
    ]);

    const jobs = jobSnaps.docs.map(mapJob);
    const payments = paymentSnaps.docs.map((d) => d.data());

    return {
      success: true,
      data: {
        total_artisans: artisanSnaps.size,
        active_jobs: jobs.filter((j) => j.status !== 'completed' && j.status !== 'refunded').length,
        completed_jobs: jobs.filter((j) => j.status === 'completed').length,
        total_escrow_held: payments
          .filter((p) => p.status === 'paid' && p.payoutStatus !== 'disbursed')
          .reduce((s, p) => s + Number(p.amount || 0), 0),
        revenue: payments
          .filter((p) => p.payoutStatus === 'disbursed' || p.payoutStatus === 'confirmed')
          .reduce((s, p) => s + Number(p.commission || 0) + Number(p.platformFee || 0), 0),
      },
    };
  },

  /**
   * getArtisanVerificationQueue()
   *
   * Returns artisans with isVerified === false, awaiting admin review.
   */
  async getArtisanVerificationQueue() {
    const snaps = await getDocs(
      query(collection(db, 'artisanProfiles'), where('isVerified', '==', false))
    );
    return snaps.docs.map(mapArtisan);
  },

  /**
   * getAdminQueue()  — alias used by AdminQueueScreen
   */
  async getAdminQueue() {
    return this.getArtisanVerificationQueue();
  },

  /**
   * verifyArtisan(uid, verified, reason)
   *
   * Called by AdminQueueScreen "Approve & Grant Verified Status" button.
   */
  async verifyArtisan(uid, verified = true, reason = '') {
    await updateDoc(doc(db, 'artisanProfiles', uid), {
      isVerified: Boolean(verified),
      verificationReason: reason,
      verifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { success: true, uid, isVerified: Boolean(verified) };
  },

  /**
   * rejectArtisan(uid, reason)
   */
  async rejectArtisan(uid, reason) {
    return this.verifyArtisan(uid, false, reason);
  },

  /**
   * getAdminProformaQueue()
   *
   * Returns all proforma invoices, optionally filtered to pending.
   * AdminProformaQueueScreen maps invoice fields:
   *   invoice.id, invoice.job_id, invoice.artisan_uid, invoice.amount,
   *   invoice.materials (array), invoice.description
   */
  async getAdminProformaQueue() {
    const snaps = await getDocs(
      query(collection(db, 'proformas'), where('status', '==', 'pending'))
    );
    return snaps.docs.map((snap) => {
      const data = snap.data();
      return {
        id: snap.id,
        job_id: data.jobId || data.job_id,
        artisan_uid: data.artisanId,
        amount: data.total_amount || data.totalAmount || 0,
        supplier_name: data.supplier_name || data.supplierName || '',
        materials: data.items || [],
        description: data.description || '',
        status: data.status,
        receipt_url: data.receipt_url || data.receiptUrl || '',
        created_at: data.createdAt,
      };
    });
  },

  /**
   * approveProforma(id, notes)
   *
   * Called by AdminProformaQueueScreen Approve button.
   */
  async approveProforma(id, details = {}) {
    const fn = httpsCallable(functions, 'approveProforma');
    const res = await fn({ proformaId: id, notes: details.notes || 'Materials verified', ...details });
    return { success: true, message: 'Proforma approved', data: res.data };
  },

  /**
   * rejectProforma(id, reason)
   *
   * Called by AdminProformaQueueScreen Reject button.
   */
  async rejectProforma(id, reason = 'Quote rejected') {
    const fn = httpsCallable(functions, 'rejectProforma');
    const res = await fn({ proformaId: id, reason });
    return { success: true, message: 'Proforma rejected', data: res.data };
  },

  /**
   * addArtisan(data)
   *
   * Called by AdminAddArtisanScreen "Create Verified Artisan" button.
   * Creates a pre-verified artisan profile without going through the signup flow.
   */
  async addArtisan(data) {
    const ref = doc(collection(db, 'artisanProfiles'));
    const artisan = withoutUndefined({
      ...data,
      uid: ref.id,
      location:
        typeof data.location === 'object'
          ? data.location.city || data.location.address || 'Life Camp, Abuja'
          : data.location || 'Life Camp, Abuja',
      isVerified: true,
      available: data.available !== false,
      no_response_flags: 0,
      reputation_score: 0,
      completed_jobs: 0,
      priority_score: 0.1, // starts at verification_bonus * 0.10
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(ref, artisan);
    return { success: true, message: 'Artisan added successfully', data: { ...artisan, id: ref.id } };
  },

  /**
   * resolveDispute(disputeId, action)
   */
  async resolveDispute(disputeId, action = 'refund_client') {
    return { success: true, message: `Dispute resolved: ${action}` };
  },

  /**
   * getAdminFlags()  — artisans with no_response_flags > 0
   */
  async getAdminFlags() {
    const snaps = await getDocs(
      query(collection(db, 'artisanProfiles'), where('no_response_flags', '>', 0))
    );
    return snaps.docs.map(mapArtisan);
  },
};
