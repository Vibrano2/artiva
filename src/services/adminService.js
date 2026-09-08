import { encodePath, fetchWithAuth } from './apiConfig';
import { normalizeArtisan, normalizeProforma } from './normalizers';

export const AdminService = {
  request(endpoint, options = {}) {
    const path = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint}`;
    return fetchWithAuth(path, options);
  },

  async getAdminStats() {
    const response = await fetchWithAuth('/api/admin/analytics');
    const value = response.data || response;
    return {
      success: true,
      data: {
        total_artisans: Number(value.users?.artisans || 0),
        active_jobs: Number(value.jobs?.open || 0) + Number(value.jobs?.matched || 0),
        completed_jobs: Number(value.jobs?.completed || 0),
        total_escrow_held: Number(value.revenue?.total_held || 0),
        revenue: Number(value.revenue?.total_commission || 0) + Number(value.total_match_fees || 0),
      },
    };
  },

  async getArtisanVerificationQueue() {
    const response = await fetchWithAuth('/api/admin/verification-queue?limit=100');
    const artisans = response.data?.artisans || response.artisans || [];
    return Array.isArray(artisans)
      ? artisans.map((artisan) => normalizeArtisan({
          ...artisan,
          nin: artisan.verification?.nin || '',
          id_document_url: artisan.verification?.id_document_url || '',
        }))
      : [];
  },

  getAdminQueue() {
    return this.getArtisanVerificationQueue();
  },

  async verifyArtisan(uid, verified = true, reason = '') {
    const path = verified
      ? `/api/admin/verify/${encodePath(uid)}`
      : `/api/admin/reject/${encodePath(uid)}`;
    const response = await fetchWithAuth(path, {
      method: 'POST',
      body: JSON.stringify(verified ? {} : { reason: String(reason || '').trim() }),
    });
    return response.data || response;
  },

  rejectArtisan(uid, reason) {
    return this.verifyArtisan(uid, false, reason);
  },

  async getAdminProformaQueue() {
    const response = await fetchWithAuth('/api/admin/proforma-queue');
    const queue = response.data?.queue || response.queue || [];
    return Array.isArray(queue) ? queue.map(normalizeProforma) : [];
  },

  async approveProforma(id, details = {}) {
    const response = await fetchWithAuth(`/api/admin/proforma/${encodePath(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({
        supplier_recipient_code: String(details.supplier_recipient_code || '').trim(),
        ...(details.notes ? { notes: String(details.notes).trim() } : {}),
      }),
    });
    return { success: true, message: response.message, data: response.data || response };
  },

  async rejectProforma(id, reason) {
    const response = await fetchWithAuth(`/api/admin/proforma/${encodePath(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: String(reason || '').trim() }),
    });
    return { success: true, message: response.message, data: response.data || response };
  },

  async getAdminFlags() {
    const response = await fetchWithAuth('/api/admin/flags');
    const flags = Array.isArray(response.data) ? response.data : (response.data?.artisans || []);
    return flags.map(normalizeArtisan);
  },

  async addArtisan() {
    throw new Error('Artisans must create and verify their own authenticated accounts.');
  },

  async resolveDispute() {
    throw new Error('Disputes require manual operations review.');
  },
};
