import { fetchWithAuth, encodePath } from './apiConfig';
import { AuthService } from './authService';
import { normalizeArtisan } from './normalizers';

function arrayFrom(response, keys) {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], response);
    if (Array.isArray(value)) return value;
  }
  return [];
}

export const ArtisanService = {
  signupArtisan(data) {
    return AuthService.registerArtisan(data);
  },

  async getArtisans(filter = {}) {
    const query = new URLSearchParams();
    if (filter.trade && filter.trade !== 'All') query.set('trade', filter.trade);
    if (filter.location && filter.location !== 'All') query.set('location', filter.location);
    if (filter.available !== undefined) query.set('available', String(Boolean(filter.available)));
    query.set('limit', String(Math.min(Math.max(Number(filter.limit) || 50, 1), 100)));
    const response = await fetchWithAuth(`/api/artisans?${query}`);
    return arrayFrom(response, ['data.data', 'data.artisans', 'artisans', 'data']).map(normalizeArtisan);
  },

  async getArtisanProfile(uid) {
    const response = await fetchWithAuth(`/api/artisans/${encodePath(uid)}`);
    return normalizeArtisan(response.data?.profile || response.profile || response.data || response);
  },

  async getArtisanReviews(uid) {
    const response = await fetchWithAuth(`/api/artisans/${encodePath(uid)}/reviews`);
    return arrayFrom(response, ['data.ratings', 'data.reviews', 'ratings', 'reviews', 'data']);
  },

  async matchArtisans(jobId) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/match`, { method: 'POST' });
    return response.data || response;
  },

  async updateMyProfile(updateData) {
    const response = await fetchWithAuth('/api/artisans/me', {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return normalizeArtisan(response.data?.profile || response.data || response);
  },

  async updateAvailability(_uid, available) {
    return this.updateMyProfile({ is_available: Boolean(available) });
  },

  async uploadProfilePhoto(uid, file) {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuth(`/api/artisans/${encodePath(uid)}/photo`, { method: 'POST', body: formData });
  },

  async uploadIdDocument(uid, _nin, file) {
    const formData = new FormData();
    formData.append('file', file);
    return fetchWithAuth(`/api/artisans/${encodePath(uid)}/id-document`, { method: 'POST', body: formData });
  },

  async getArtisanDashboard(uid) {
    const response = await fetchWithAuth(`/api/artisans/${encodePath(uid)}/dashboard`);
    const dashboard = response.data || {};
    return {
      held_total: Number(dashboard.finances?.held || 0),
      released_total: Number(dashboard.finances?.released || 0),
      completed_jobs: Number(dashboard.matches?.completed || 0),
      reputation_score: dashboard.profile?.reputation_score ?? null,
      is_verified: Boolean(dashboard.profile?.is_verified),
      is_available: Boolean(dashboard.profile?.is_available),
      profile: normalizeArtisan(dashboard.profile || {}),
      finances: dashboard.finances || {},
      matches: dashboard.matches || {},
    };
  },

  async getBanks() {
    const response = await fetchWithAuth('/api/payments/banks');
    return arrayFrom(response, ['data.banks', 'banks', 'data']);
  },

  async resolveBankAccount(accountNumber, bankCode) {
    const response = await fetchWithAuth('/api/payments/resolve-account', {
      method: 'POST',
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    });
    return response.data || response;
  },
};
