import { fetchWithAuth } from './apiConfig';

export const JobService = {
  async postJob(jobData) {
    const { trade, location, urgency, timing, description, budget, photos } = jobData;
    const locObj = typeof location === 'object' ? location : {
      address: location || 'Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos'
    };

    const res = await fetchWithAuth('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify({
        trade,
        description,
        location: locObj,
        timing: timing || urgency || 'Today',
        budget: budget ? Number(budget) : 15000,
        photos: photos || []
      })
    });

    const jobResult = res.data || res.job || res;
    const jobId = jobResult.jobId || jobResult.id || jobResult.job_id || res.jobId;
    return { jobId, job: { ...jobResult, job_id: jobId, trade, description, location: locObj.address, urgency: timing || urgency || 'Today' } };
  },

  async getJobById(id) {
    const res = await fetchWithAuth(`/v1/jobs/${id}`);
    return res.data || res;
  },

  async triggerMatching(jobId) {
    try {
      return await fetchWithAuth(`/api/jobs/${jobId}/match`, { method: 'POST' });
    } catch {
      return await fetchWithAuth(`/v1/jobs/${jobId}/match`, { method: 'POST' });
    }
  },

  async getJobMatches(jobId) {
    try {
      const res = await fetchWithAuth(`/api/jobs/${jobId}/matches`);
      return res.data || (Array.isArray(res) ? res : []);
    } catch {
      const fallbackRes = await fetchWithAuth(`/v1/jobs/${jobId}/matches`);
      return fallbackRes.data || (Array.isArray(fallbackRes) ? fallbackRes : []);
    }
  },

  async selectArtisan(jobId, artisanId) {
    const res = await fetchWithAuth(`/v1/jobs/${jobId}/select-artisan`, {
      method: 'POST',
      body: JSON.stringify({ artisan_id: artisanId })
    });
    return res.data || res;
  },

  async startTracking(jobId) {
    return await fetchWithAuth(`/v1/jobs/${jobId}/tracking/start`, {
      method: 'POST'
    });
  },

  async arriveTracking(jobId) {
    return await fetchWithAuth(`/v1/jobs/${jobId}/tracking/arrive`, {
      method: 'POST'
    });
  },

  async completeJob(jobId, details = {}) {
    const payload = typeof details === 'object' ? details : { match_id: details, rating: 5, review: '' };
    const res = await fetchWithAuth(`/v1/jobs/${jobId}/complete`, {
      method: 'POST',
      body: JSON.stringify({
        match_id: payload.match_id || `match_${jobId}`,
        rating: payload.rating || 5,
        review: payload.review || 'Great job completed.'
      })
    });
    return res;
  },

  async rateJob(jobId, rating, review = '') {
    return await this.completeJob(jobId, { rating, review });
  }
};
