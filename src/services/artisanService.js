import { fetchWithAuth } from './apiConfig';

export const ArtisanService = {
  async signupArtisan(data) {
    const { 
      first_name, last_name, email, password, phone, 
      trade, services, location, tagline, 
      work_photos, id_photo, nin 
    } = data;
    
    if (!trade || !location || !email || !password || !phone) {
      throw new Error('Please fill in all required contact and trade fields.');
    }

    const res = await fetchWithAuth('/artisans', {
      method: 'POST',
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        phone,
        trade,
        services: services || [],
        location,
        tagline: tagline || `${trade} specialist`,
        work_photos: work_photos || [],
        id_photo,
        nin
      })
    });
    return { artisanId: res.data.uid, artisan: res.data };
  },

  async updateAvailability(uid, available) {
    const res = await fetchWithAuth(`/artisans/${uid}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ is_available: available })
    });
    return res;
  },

  async getArtisans(filter = {}) {
    const query = new URLSearchParams();
    if (filter.trade) query.append('trade', filter.trade);
    if (filter.location) query.append('location', filter.location);
    if (filter.available !== undefined) query.append('available', filter.available);
    
    const res = await fetchWithAuth(`/artisans?${query.toString()}`);
    return res.data || [];
  },

  async getArtisanDashboard(uid) {
    const res = await fetchWithAuth(`/artisans/${uid}/dashboard`);
    const dashboardData = res.data || {};
    
    return {
      held_total: dashboardData.held_total || 0,
      released_total: dashboardData.released_total || 0,
      completed_jobs: dashboardData.completed_jobs || 0,
      reputation_score: dashboardData.reputation_score || 0,
      is_verified: dashboardData.is_verified || false
    };
  },
  
  async getArtisanProfile(uid) {
    const res = await fetchWithAuth(`/artisans/${uid}`);
    return res.data;
  }
};
