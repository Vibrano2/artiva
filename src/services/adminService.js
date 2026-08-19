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
  }
};
