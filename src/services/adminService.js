import { fetchWithAuth } from './apiConfig';

export const AdminService = {
  async getAdminQueue() {
    try {
      const res = await fetchWithAuth('/v1/admin/artisans/pending');
      return res.data || (Array.isArray(res) ? res : []);
    } catch {
      const fallbackRes = await fetchWithAuth('/admin/verification-queue');
      return fallbackRes.data || (Array.isArray(fallbackRes) ? fallbackRes : []);
    }
  },

  async verifyArtisan(uid, verified = true, reason = '') {
    try {
      const res = await fetchWithAuth(`/v1/admin/artisans/${uid}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ verified, reason })
      });
      return res.data || res;
    } catch {
      const fallbackRes = await fetchWithAuth(`/admin/verify/${uid}`, {
        method: 'POST',
        body: JSON.stringify({ verified, reason })
      });
      return fallbackRes.data || fallbackRes;
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
    const res = await fetchWithAuth('/admin/proforma-queue');
    return res.data || (Array.isArray(res) ? res : []);
  },

  async approveProforma(id) {
    const res = await fetchWithAuth(`/admin/proforma/${id}/approve`, {
      method: 'POST'
    });
    return res.data || res;
  },

  async getAdminFlags() {
    const res = await fetchWithAuth('/admin/flags');
    return res.data || (Array.isArray(res) ? res : []);
  }
};
