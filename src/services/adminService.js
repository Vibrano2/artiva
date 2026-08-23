import { mockDb } from '../data/mockDatabase';

export const AdminService = {
  /**
   * Generic request helper for backward compatibility
   */
  async request(endpoint, options = {}) {
    if (endpoint.includes('proforma-queue')) {
      return { data: { queue: this.getAdminProformaQueue() } };
    }
    if (endpoint.includes('/approve')) {
      const match = endpoint.match(/proforma\/([^/]+)\/approve/);
      if (match) return this.approveProforma(match[1]);
    }
    if (endpoint.includes('/reject')) {
      const match = endpoint.match(/proforma\/([^/]+)\/reject/);
      if (match) return this.rejectProforma(match[1]);
    }
    return { success: true, data: {} };
  },

  /**
   * Fetch aggregate dashboard metrics
   */
  async getAdminStats() {
    const artisans = mockDb.getArtisans();
    const jobs = mockDb.getJobs();
    return {
      success: true,
      data: {
        total_artisans: artisans.length,
        active_jobs: jobs.filter(j => j.status !== 'completed').length,
        completed_jobs: jobs.filter(j => j.status === 'completed').length,
        total_escrow_held: 125000,
        revenue: 45000
      }
    };
  },

  /**
   * List newly registered artisans awaiting background check / verification
   */
  async getArtisanVerificationQueue() {
    return mockDb.getAdminQueue();
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
    return mockDb.verifyArtisanInQueue(uid, verified, reason);
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
    return mockDb.getProformas();
  },

  /**
   * Admin approves quote
   */
  async approveProforma(id, notes = 'Materials verified') {
    const updated = mockDb.updateProformaStatus(id, 'approved', notes);
    return {
      success: true,
      message: 'Proforma approved successfully',
      data: updated
    };
  },
  
  /**
   * Admin rejects quote with a reason
   */
  async rejectProforma(id, reason = 'Quote rejected') {
    const updated = mockDb.updateProformaStatus(id, 'rejected', reason);
    return {
      success: true,
      message: 'Proforma rejected',
      data: updated
    };
  },

  /**
   * Manually add an artisan from the admin panel
   */
  async addArtisan(data) {
    const newArtisan = mockDb.saveArtisan({
      ...data,
      is_verified: true,
      verified: true
    });
    return {
      success: true,
      message: 'Artisan added successfully',
      data: newArtisan
    };
  },

  /**
   * Resolve an escalated job dispute
   */
  async resolveDispute(disputeId, action = 'refund_client') {
    return {
      success: true,
      message: `Dispute resolved with action: ${action}`
    };
  },

  /**
   * Get flagged items / risk alerts
   */
  async getAdminFlags() {
    return [];
  }
};
