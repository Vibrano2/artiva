import { fetchWithAuth } from './apiConfig';

export const AdminService = {
  async getAdminQueue() {
    const res = await fetchWithAuth('/v1/admin/verification-queue');
    return res.data || (Array.isArray(res) ? res : []);
  },

  async verifyArtisan(uid, verified = true, reason = '') {
    if (verified) {
      const res = await fetchWithAuth(`/v1/admin/verify/${uid}`, {
        method: 'POST'
      });
      return res.data || res;
    } else {
      const res = await fetchWithAuth(`/v1/admin/reject/${uid}`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      return res.data || res;
    }
  },

  async resolveDispute(disputeId, action = 'refund_client') {
    const res = await fetchWithAuth(`/v1/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    return res.data || res;
  },

  async addArtisan(data) {
    const res = await fetchWithAuth('/v1/admin/artisans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data || res;
  },

  async getAdminProformaQueue() {
    const res = await fetchWithAuth('/v1/admin/proforma-queue');
    return res.data || (Array.isArray(res) ? res : []);
  },

  async approveProforma(id) {
    const res = await fetchWithAuth(`/v1/admin/proforma/${id}/approve`, {
      method: 'POST'
    });
    return res.data || res;
  },
  
  async rejectProforma(id, reason) {
    const res = await fetchWithAuth(`/v1/admin/proforma/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
    return res.data || res;
  },

  async getAdminFlags() {
    const res = await fetchWithAuth('/v1/admin/flags');
    return res.data || (Array.isArray(res) ? res : []);
  }
};
