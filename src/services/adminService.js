import { fetchWithAuth } from './apiConfig';

export const AdminService = {
  /**
   * Generic request helper (backward compatibility)
   */
  async request(endpoint, options = {}) {
    return fetchWithAuth(endpoint, options);
  },

  /**
   * Admin dashboard metrics (PRD AD-003)
   */
  async getAdminStats() {
    const res = await fetchWithAuth('/api/admin/analytics');
    return {
      success: true,
      data: res.data || res
    };
  },

  /**
   * Artisan verification queue (PRD AD-001)
   */
  async getArtisanVerificationQueue() {
    const res = await fetchWithAuth('/api/admin/verification-queue');
    return res.data || (Array.isArray(res) ? res : []);
  },

  async getAdminQueue() {
    return this.getArtisanVerificationQueue();
  },

  /**
   * Approve an artisan's verification (PRD AD-001)
   */
  async verifyArtisan(uid, verified = true, reason = '') {
    const endpoint = verified
      ? `/api/admin/verify/${uid}`
      : `/api/admin/reject/${uid}`;

    const res = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.data || res;
  },

  /**
   * Reject an artisan with a reason
   */
  async rejectArtisan(uid, reason) {
    return this.verifyArtisan(uid, false, reason);
  },

  /**
   * Proforma invoice queue (PRD AD-005)
   */
  async getAdminProformaQueue() {
    const res = await fetchWithAuth('/api/admin/proforma-queue');
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Approve a proforma — triggers direct supplier payout (PRD AD-005 / §7.6)
   */
  async approveProforma(id, notes = '') {
    const res = await fetchWithAuth(`/api/admin/proforma/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
    return {
      success: true,
      message: res.message || 'Proforma approved successfully',
      data: res.data || res
    };
  },

  /**
   * Reject a proforma with a reason
   */
  async rejectProforma(id, reason = '') {
    const res = await fetchWithAuth(`/api/admin/proforma/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return {
      success: true,
      message: res.message || 'Proforma rejected',
      data: res.data || res
    };
  },

  /**
   * Artisan profiles flagged for no-response (PRD AD-004)
   */
  async getAdminFlags() {
    const res = await fetchWithAuth('/api/admin/flags');
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Resolve a job dispute (PRD §5.2 — manual review)
   */
  async resolveDispute(disputeId, action = 'refund_client') {
    const res = await fetchWithAuth(`/api/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    return res.data || res;
  }
};
