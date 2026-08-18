import { fetchWithAuth } from './apiConfig';

export const JobService = {
  async postJob(jobData) {
    const { trade, location, urgency, description, budget, photos } = jobData;
    const res = await fetchWithAuth('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        trade,
        location,
        urgency,
        description,
        budget: budget ? Number(budget) : undefined,
        photos: photos || []
      })
    });
    return { jobId: res.jobId, job: res };
  },

  async getJobById(id) {
    const res = await fetchWithAuth(`/jobs/${id}`);
    return res.data;
  },

  async getJobMatches(jobId) {
    const res = await fetchWithAuth(`/jobs/${jobId}/matches`);
    return res.data || [];
  },

  async completeJob(jobId) {
    const res = await fetchWithAuth(`/jobs/${jobId}/complete`, {
      method: 'POST'
    });
    return res;
  },

  async rateJob(jobId, score, review = '') {
    const res = await fetchWithAuth(`/jobs/${jobId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ score, review })
    });
    return res;
  }
};
