import { fetchWithAuth } from './apiConfig';

export const JobService = {
  /**
   * Client posts a new job request
   */
  async postJob(jobData) {
    const { trade, location, urgency, timing, description, budget, photos } = jobData;
    const locObj = typeof location === 'object' ? location : {
      address: location || 'Life Camp, Abuja',
      city: 'Abuja',
      state: 'FCT'
    };

    const payload = {
      trade,
      description,
      location: locObj,
      timing: timing || urgency || 'Today',
      budget: budget ? Number(budget) : 15000,
      photos: photos || []
    };

    const res = await fetchWithAuth('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const jobResult = res.data || res.job || res;
    const jobId = jobResult.id || jobResult.jobId || jobResult.job_id || res.jobId;
    return {
      jobId,
      job: {
        ...jobResult,
        id: jobId,
        job_id: jobId,
        trade,
        description,
        location: locObj.address,
        urgency: timing || urgency || 'Today'
      }
    };
  },

  /**
   * Fetch all jobs (with optional filters)
   */
  async getJobs(filters = {}) {
    const query = new URLSearchParams();
    if (filters.status) query.append('status', filters.status);
    if (filters.trade) query.append('trade', filters.trade);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    
    const res = await fetchWithAuth(`/api/jobs${queryString}`);
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Fetch single job by ID
   */
  async getJobById(id) {
    const res = await fetchWithAuth(`/api/jobs/${id}`);
    return res.data || res;
  },

  /**
   * Auto-matches a client's job request with artisans
   */
  async triggerMatching(jobId) {
    try {
      return await fetchWithAuth('/api/artisans/match', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      });
    } catch {
      return await fetchWithAuth(`/api/jobs/${jobId}/match`, { method: 'POST' });
    }
  },

  /**
   * Get matched artisans for a job
   */
  async getJobMatches(jobId) {
    try {
      const res = await fetchWithAuth(`/api/jobs/${jobId}/matches`);
      return res.data?.matches || res.data || (Array.isArray(res) ? res : []);
    } catch {
      const res = await fetchWithAuth('/api/artisans/match', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      });
      return res.data?.matches || res.data || (Array.isArray(res) ? res : []);
    }
  },

  /**
   * Client selects and accepts a matched artisan
   */
  async selectArtisan(jobId, artisanId) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/select-artisan`, {
      method: 'POST',
      body: JSON.stringify({ artisan_id: artisanId })
    });
    return res.data || res;
  },

  /**
   * Update job lifecycle status
   */
  async updateJobStatus(jobId, status) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    return res.data || res;
  },

  /**
   * Artisan submits proforma invoice for a job
   */
  async submitProforma(jobId, proformaData) {
    const payload = {
      supplier_name: proformaData.supplier_name || 'Direct Materials',
      materials_cost: Number(proformaData.materials_cost) || 0,
      labor_cost: Number(proformaData.labor_cost) || 0,
      total_amount: Number(proformaData.total_amount) || (Number(proformaData.materials_cost || 0) + Number(proformaData.labor_cost || 0)),
      items: proformaData.items || [],
      receipt_url: proformaData.receipt_url || ''
    };

    let res;
    try {
      res = await fetchWithAuth(`/api/jobs/${jobId}/proforma`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      res = await fetchWithAuth('/api/proforma', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, ...payload })
      });
    }
    return res.data || res;
  },

  /**
   * Start live GPS tracking (artisan en route)
   */
  async startTracking(jobId) {
    return await fetchWithAuth(`/api/jobs/${jobId}/tracking/start`, {
      method: 'POST'
    });
  },

  /**
   * Artisan arrival notification
   */
  async arriveTracking(jobId) {
    return await fetchWithAuth(`/api/jobs/${jobId}/tracking/arrive`, {
      method: 'POST'
    });
  },

  /**
   * Submit star rating & review for completed job
   */
  async submitReview(jobId, { match_id, rating = 5, review = '' }) {
    const payload = {
      match_id: match_id || `match_${jobId}`,
      rating: Number(rating),
      review: review || 'Job completed successfully.'
    };

    let res;
    try {
      res = await fetchWithAuth(`/api/jobs/${jobId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      res = await fetchWithAuth(`/api/jobs/${jobId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return res.data || res;
  },

  /**
   * Complete job (alias for submitReview)
   */
  async completeJob(jobId, details = {}) {
    const payload = typeof details === 'object' 
      ? details 
      : { match_id: details, rating: 5, review: '' };
    return this.submitReview(jobId, payload);
  },

  async rateJob(jobId, rating, review = '') {
    return this.submitReview(jobId, { rating, review });
  }
};
