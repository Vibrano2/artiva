import { fetchWithAuth } from './apiConfig';

export const AdminService = {
  /**
   * Fetch aggregate dashboard metrics (total users, active jobs, revenue)
   */
  async getAdminStats() {
    let res;
    try {
      res = await fetchWithAuth('/api/admin/stats');
    } catch {
      res = await fetchWithAuth('/api/admin/analytics');
    }
    return res.data || res;
  },

  /**
   * List newly registered artisans awaiting background check / verification
   */
  async getArtisanVerificationQueue() {
    let res;
    try {
      res = await fetchWithAuth('/api/admin/queue/artisans');
    } catch {
      res = await fetchWithAuth('/api/admin/verification-queue');
    }
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Alias for backward compatibility
   */
  async getAdminQueue() {
    return this.getArtisanVerificationQueue();
  },

  /**
   * Approve an artisan's application and grant verification badge
   */
  async verifyArtisan(uid, verified = true, reason = '') {
    if (verified) {
      let res;
      try {
        res = await fetchWithAuth(`/api/admin/verify/artisan/${uid}`, {
          method: 'PUT'
        });
      } catch {
        res = await fetchWithAuth(`/api/admin/verify/${uid}`, {
          method: 'POST'
        });
      }
      return res.data || res;
    } else {
      let res;
      try {
        res = await fetchWithAuth(`/api/admin/reject/${uid}`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
      } catch {
        res = await fetchWithAuth(`/api/admin/reject/artisan/${uid}`, {
          method: 'POST',
          body: JSON.stringify({ reason })
        });
      }
      return res.data || res;
    }
  },

  /**
   * Reject an artisan's application with a reason
   */
  async rejectArtisan(uid, reason) {
    return this.verifyArtisan(uid, false, reason);
  },

  /**
   * Proforma quotes awaiting price / materials approval
   */
  async getAdminProformaQueue() {
    let res;
    try {
      res = await fetchWithAuth('/api/admin/queue/proformas');
    } catch {
      res = await fetchWithAuth('/api/admin/proforma-queue');
    }
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Admin approves quote and disburses material funds from escrow
   */
  async approveProforma(id, notes = 'Materials verified') {
    const res = await fetchWithAuth(`/api/admin/proforma/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes, status: 'approved' })
    });
    return res.data || res;
  },
  
  /**
   * Admin rejects quote with a reason
   */
  async rejectProforma(id, reason = 'Quote rejected') {
    const res = await fetchWithAuth(`/api/admin/proforma/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, status: 'rejected' })
    });
    return res.data || res;
  },

  /**
   * Manually add an artisan from the admin panel
   */
  async addArtisan(data) {
    const res = await fetchWithAuth('/api/admin/artisans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data || res;
  },

  /**
   * Resolve an escalated job dispute
   */
  async resolveDispute(disputeId, action = 'refund_client') {
    const res = await fetchWithAuth(`/api/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    return res.data || res;
  },

  /**
   * Get flagged items / risk alerts
   */
  async getAdminFlags() {
    try {
      const res = await fetchWithAuth('/api/admin/flags');
      return res.data || (Array.isArray(res) ? res : []);
    } catch {
      return [];
    }
  }
};
