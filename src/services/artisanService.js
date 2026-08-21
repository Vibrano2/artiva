import { fetchWithAuth } from './apiConfig';
import { AuthService } from './authService';

export const ArtisanService = {
  /**
   * Register a new artisan
   */
  async signupArtisan(data) {
    return AuthService.registerArtisan(data);
  },

  /**
   * Search and filter artisans
   * @param {Object} filter - { trade, location, available }
   */
  async getArtisans(filter = {}) {
    const query = new URLSearchParams();
    if (filter.trade && filter.trade !== 'All') query.append('trade', filter.trade);
    if (filter.location && filter.location !== 'All') query.append('location', filter.location);
    if (filter.available !== undefined) query.append('available', filter.available);
    
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithAuth(`/api/artisans${queryString}`);
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Fetch specific artisan profile details
   */
  async getArtisanProfile(uid) {
    const res = await fetchWithAuth(`/api/artisans/${uid}`);
    return res.data || res;
  },

  /**
   * Get reviews for a specific artisan
   */
  async getArtisanReviews(uid) {
    const res = await fetchWithAuth(`/api/artisans/${uid}/reviews`);
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Auto-match artisans for a job
   */
  async matchArtisans(jobId) {
    let res;
    try {
      res = await fetchWithAuth('/api/artisans/match', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      });
    } catch {
      res = await fetchWithAuth(`/api/jobs/${jobId}/matches`);
    }
    return res.data || res;
  },

  /**
   * Update current artisan profile without passing UID in URL
   */
  async updateMyProfile(updateData) {
    let res;
    try {
      res = await fetchWithAuth('/api/artisans/me', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
    } catch {
      res = await fetchWithAuth('/api/artisans/me', {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });
    }
    return res.data || res;
  },

  /**
   * Update artisan availability status
   */
  async updateAvailability(uid, available) {
    try {
      return await this.updateMyProfile({ is_available: available });
    } catch {
      return await fetchWithAuth(`/api/artisans/${uid}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ is_available: available })
      });
    }
  },

  /**
   * Upload artisan profile photo
   */
  async uploadProfilePhoto(uid, file) {
    const formData = new FormData();
    formData.append('file', file);
    return await fetchWithAuth(`/api/artisans/${uid}/photo`, {
      method: 'POST',
      body: formData
    });
  },

  /**
   * Upload artisan ID document & NIN
   */
  async uploadIdDocument(uid, nin, file) {
    const formData = new FormData();
    formData.append('nin', nin);
    formData.append('file', file);
    return await fetchWithAuth(`/api/artisans/${uid}/id-document`, {
      method: 'POST',
      body: formData
    });
  },

  /**
   * Fetch artisan dashboard metrics
   */
  async getArtisanDashboard(uid) {
    try {
      const res = await fetchWithAuth(`/api/artisans/${uid}/dashboard`);
      const dashboardData = res.data || res || {};
      return {
        held_total: dashboardData.held_total || 0,
        released_total: dashboardData.released_total || 0,
        completed_jobs: dashboardData.completed_jobs || 0,
        reputation_score: dashboardData.reputation_score || 0,
        is_verified: dashboardData.is_verified || false
      };
    } catch {
      const profile = await this.getArtisanProfile(uid);
      return {
        held_total: profile.held_total || 0,
        released_total: profile.released_total || 0,
        completed_jobs: profile.completed_jobs || 0,
        reputation_score: profile.reputation_score || 4.8,
        is_verified: profile.is_verified || false
      };
    }
  }
};
