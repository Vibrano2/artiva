import { fetchWithAuth } from './apiConfig';

export const AdminService = {
  async getAdminQueue() {
    const res = await fetchWithAuth('/admin/verification-queue');
    return res.data || [];
  },

  async verifyArtisan(uid) {
    const res = await fetchWithAuth(`/admin/verify/${uid}`, {
      method: 'POST'
    });
    return res;
  }
};
