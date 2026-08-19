import { fetchWithAuth } from './apiConfig';

export const ArtisanService = {
  async signupArtisan(data) {
    const { 
      first_name, last_name, email, password, phone, 
      trade, services, skills, location, tagline, bio,
      hourly_rate, experience_years,
      work_photos, work_photos_base64, id_photo, id_document_base64, nin, bank_details 
    } = data;

    const locObj = typeof location === 'object' ? location : {
      city: 'Lagos',
      state: 'Lagos',
      address: location || 'Lekki Phase 1'
    };

    const res = await fetchWithAuth('/v1/artisans', {
      method: 'POST',
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        phone,
        trade,
        skills: skills || services || [],
        location: locObj,
        tagline: tagline || `${trade} specialist`,
        bio: bio || tagline || '',
        hourly_rate: hourly_rate || 5000,
        experience_years: experience_years || 5,
        nin,
        bank_details: bank_details || { account_number: '', bank_code: '' },
        id_document_base64: id_document_base64 || id_photo || '',
        work_photos_base64: work_photos_base64 || work_photos || []
      })
    });

    const artisanData = res.data || res.artisan || res;
    return { artisanId: artisanData.uid || artisanData.id, artisan: artisanData };
  },

  async updateAvailability(uid, available) {
    const res = await fetchWithAuth(`/v1/artisans/${uid}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: available })
    });
    return res;
  },

  async getArtisans(filter = {}) {
    const query = new URLSearchParams();
    if (filter.trade && filter.trade !== 'All') query.append('trade', filter.trade);
    if (filter.location && filter.location !== 'All') query.append('location', filter.location);
    if (filter.available !== undefined) query.append('available', filter.available);
    
    const res = await fetchWithAuth(`/v1/artisans?${query.toString()}`);
    return res.data || (Array.isArray(res) ? res : []);
  },

  async getArtisanDashboard(uid) {
    const res = await fetchWithAuth(`/v1/artisans/${uid}/dashboard`);
    const dashboardData = res.data || res || {};
    
    return {
      held_total: dashboardData.held_total || 0,
      released_total: dashboardData.released_total || 0,
      completed_jobs: dashboardData.completed_jobs || 0,
      reputation_score: dashboardData.reputation_score || 0,
      is_verified: dashboardData.is_verified || false
    };
  },
  
  async getArtisanProfile(uid) {
    const res = await fetchWithAuth(`/v1/artisans/${uid}`);
    return res.data || res;
  }
};
