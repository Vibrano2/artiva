import { fetchWithAuth } from './apiConfig';

export const JobService = {
  /**
   * Client posts a new job request (PRD C-001)
   */
  async postJob(jobData) {
    const { trade, location, urgency, timing, description, budget, job_value, photos, client_uid, title } = jobData;
    const locAddress = typeof location === 'object' ? (location.address || location.city || 'Life Camp, Abuja') : (location || 'Life Camp, Abuja');
    const selectedTrade = trade || jobData.trade_needed || 'Plumbing';
    const payload = {
      title: title || `${selectedTrade} Service - ${locAddress}`.slice(0, 80),
      trade_needed: selectedTrade,
      trade: selectedTrade,
      location: typeof location === 'object' ? {
        address: location.address || locAddress,
        city: location.city || 'Abuja',
        state: location.state || 'FCT',
        lga: location.lga || 'Abuja Municipal'
      } : {
        address: locAddress,
        city: 'Abuja',
        state: 'FCT',
        lga: 'Abuja Municipal'
      },
      urgency: timing || urgency || 'Today',
      timing: timing || urgency || 'Today',
      description: description && description.length >= 5 ? description : `${selectedTrade} repair needed urgently at ${locAddress}.`,
      budget: Number(budget || job_value) || 0,
      job_value: Number(job_value || budget) || 0,
      photos: photos || [],
      client_uid
    };

    const res = await fetchWithAuth('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const job = res.data || res.job || res;
    return { jobId: job.job_id || job.id, id: job.job_id || job.id, job };
  },

  /**
   * Fetch all jobs (with optional filters)
   */
  async getJobs(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) query.append(k, v); });
    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetchWithAuth(`/api/jobs${qs}`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.jobs)) return res.jobs;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.jobs)) return res.data.jobs;
    return [];
  },

  /**
   * Fetch single job by ID
   */
  async getJobById(id) {
    const res = await fetchWithAuth(`/api/jobs/${id}`);
    return res.job || res.data || res;
  },

  /**
   * Trigger matching for a job (PRD §7.2)
   */
  async triggerMatching(jobId) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/matches`, { method: 'GET' });
    return res.data || res;
  },

  /**
   * Get matched artisans for a job
   */
  async getJobMatches(jobId) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/matches`);
    const matches = res.matches || res.data?.matches || res.data || [];
    return Array.isArray(matches) ? matches.map(m => m.artisan || m) : [];
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
   * Artisan submits proforma invoice for a job (PRD A-009)
   */
  async submitProforma(jobId, proformaData) {
    const payload = {
      job_id: jobId,
      supplier_name: proformaData.supplier_name,
      total_amount: Number(proformaData.total_amount) || 0,
      materials_cost: Number(proformaData.materials_cost) || 0,
      labor_cost: Number(proformaData.labor_cost) || 0,
      items: proformaData.items || [],
      receipt_url: proformaData.receipt_url || proformaData.invoice_document_url || '',
      invoice_document_url: proformaData.invoice_document_url || proformaData.receipt_url || '',
      supplier_recipient_code: proformaData.supplier_recipient_code || ''
    };

    const res = await fetchWithAuth(`/api/jobs/${jobId}/proforma`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.data || res;
  },

  /**
   * Start live tracking (artisan en route)
   */
  async startTracking(jobId) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/tracking/start`, { method: 'POST' });
    return res.data || res;
  },

  /**
   * Artisan arrival notification
   */
  async arriveTracking(jobId) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/tracking/arrive`, { method: 'POST' });
    return res.data || res;
  },

  /**
   * Mark job complete + submit rating (PRD C-006)
   */
  async submitReview(jobId, { match_id, rating = 5, review = '' }) {
    const res = await fetchWithAuth(`/api/jobs/${jobId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ match_id, rating: Number(rating), review })
    });
    return res.data || res;
  },

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
