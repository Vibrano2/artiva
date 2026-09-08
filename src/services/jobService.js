import { ApiError, encodePath, fetchWithAuth } from './apiConfig';
import { normalizeArtisan, normalizeJob, normalizeLocation } from './normalizers';

function matchesFrom(response) {
  const matches = response?.data?.matches || response?.matches || [];
  return Array.isArray(matches) ? matches : [];
}

function normalizeMatch(match) {
  if (!match?.artisan) return null;
  return normalizeArtisan({
    ...match.artisan,
    match_id: match.match_id,
    match_status: match.status,
    match_score: match.score,
  });
}

export const JobService = {
  async postJob(jobData) {
    const selectedTrade = jobData.trade || jobData.trade_needed;
    const budget = Number(jobData.budget ?? jobData.job_value);
    const payload = {
      trade_needed: selectedTrade,
      title: String(jobData.title || `${selectedTrade} service request`).trim().slice(0, 100),
      description: String(jobData.description || '').trim(),
      location: normalizeLocation(jobData.location),
      urgency: jobData.timing === 'ASAP' ? 'Today' : (jobData.timing || jobData.urgency),
      budget,
      job_value: budget,
      photos: (jobData.photos || []).filter((photo) => typeof photo === 'string' && photo.startsWith('https://')),
    };
    const response = await fetchWithAuth('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const job = normalizeJob(response.data?.data || response.data?.job || response.data || response.job || response);
    return { jobId: job.job_id, id: job.job_id, job };
  },

  async getJobs(filters = {}) {
    const query = new URLSearchParams();
    for (const key of ['trade', 'location', 'status', 'urgency', 'limit', 'offset']) {
      if (filters[key] !== undefined && filters[key] !== '') query.set(key, String(filters[key]));
    }
    const response = await fetchWithAuth(`/api/jobs${query.size ? `?${query}` : ''}`);
    const jobs = response.data?.jobs || response.jobs || response.data || [];
    return Array.isArray(jobs) ? jobs.map(normalizeJob) : [];
  },

  async getJobById(id) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(id)}`);
    return normalizeJob(response.data?.job || response.job || response.data || response);
  },

  async triggerMatching(jobId) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/match`, { method: 'POST' });
    return response.data || response;
  },

  async getJobMatches(jobId) {
    let response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/matches`);
    if (matchesFrom(response).length === 0) {
      try {
        response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/match`, { method: 'POST' });
      } catch (error) {
        if (!(error instanceof ApiError) || ![400, 409].includes(error.status)) throw error;
        response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/matches`);
      }
    }
    return matchesFrom(response).map(normalizeMatch).filter(Boolean);
  },

  async selectArtisan(jobId, artisanId) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/select-artisan`, {
      method: 'POST',
      body: JSON.stringify({ artisan_id: artisanId }),
    });
    return response.data || response;
  },

  async updateJobStatus() {
    throw new Error('Job state changes must use the dedicated workflow actions.');
  },

  async startTracking(jobId) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/tracking/start`, { method: 'POST' });
    return response.data || response;
  },

  async arriveTracking(jobId) {
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/tracking/arrive`, { method: 'POST' });
    return response.data || response;
  },

  async submitReview(jobId, { match_id, rating = 5, review = '' } = {}) {
    const body = { rating: Number(rating), review: String(review || '').trim() };
    if (match_id) body.match_id = match_id;
    const response = await fetchWithAuth(`/api/jobs/${encodePath(jobId)}/complete`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response.data || response;
  },

  async completeJob(jobId, details = {}) {
    return this.submitReview(jobId, details);
  },

};
