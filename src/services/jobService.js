import { mockDb } from '../data/mockDatabase';
import { ArtisanService } from './artisanService';

export const JobService = {
  /**
   * Client posts a new job request locally
   */
  async postJob(jobData) {
    const { trade, location, urgency, timing, description, budget, photos, client_uid } = jobData;
    const locAddress = typeof location === 'object' ? (location.address || 'Life Camp, Abuja') : (location || 'Life Camp, Abuja');

    const newJob = mockDb.createJob({
      trade: trade || 'Plumbing',
      description: description || 'Repairs required',
      location: locAddress,
      timing: timing || urgency || 'Today',
      urgency: timing || urgency || 'Today',
      budget: budget ? Number(budget) : 15000,
      photos: photos || [],
      client_id: client_uid || 'client_demo_01'
    });

    return {
      jobId: newJob.job_id,
      id: newJob.job_id,
      job: newJob
    };
  },

  /**
   * Fetch all jobs (with optional filters)
   */
  async getJobs(filters = {}) {
    return mockDb.getJobs(filters);
  },

  /**
   * Fetch single job by ID
   */
  async getJobById(id) {
    return mockDb.getJobById(id);
  },

  /**
   * Auto-matches a client's job request with artisans
   */
  async triggerMatching(jobId) {
    return ArtisanService.matchArtisans(jobId);
  },

  /**
   * Get matched artisans for a job
   */
  async getJobMatches(jobId) {
    const matchRes = await ArtisanService.matchArtisans(jobId);
    return matchRes.data?.matches?.map(m => m.artisan) || mockDb.getArtisans();
  },

  /**
   * Client selects and accepts a matched artisan
   */
  async selectArtisan(jobId, artisanId) {
    const updated = mockDb.updateJob(jobId, {
      artisan_id: artisanId,
      status: 'matched',
      match_id: `match_${jobId}_${artisanId}`
    });
    return updated || { success: true };
  },

  /**
   * Update job lifecycle status
   */
  async updateJobStatus(jobId, status) {
    return mockDb.updateJob(jobId, { status });
  },

  /**
   * Artisan submits proforma invoice for a job
   */
  async submitProforma(jobId, proformaData) {
    const payload = {
      job_id: jobId,
      supplier_name: proformaData.supplier_name || 'Life Camp Hardware Store',
      materials_cost: Number(proformaData.materials_cost) || 0,
      labor_cost: Number(proformaData.labor_cost) || 0,
      total_amount: Number(proformaData.total_amount) || 25000,
      items: proformaData.items || [],
      receipt_url: proformaData.receipt_url || proformaData.invoice_document_url || ''
    };

    return mockDb.createProforma(payload);
  },

  /**
   * Start live GPS tracking (artisan en route)
   */
  async startTracking(jobId) {
    mockDb.updateJob(jobId, { status: 'in_progress', tracking_status: 'en_route' });
    return { success: true, status: 'en_route' };
  },

  /**
   * Artisan arrival notification
   */
  async arriveTracking(jobId) {
    mockDb.updateJob(jobId, { tracking_status: 'arrived' });
    return { success: true, status: 'arrived' };
  },

  /**
   * Submit star rating & review for completed job
   */
  async submitReview(jobId, { match_id, rating = 5, review = '' }) {
    mockDb.updateJob(jobId, {
      status: 'completed',
      rating: Number(rating),
      review: review || 'Job completed successfully.'
    });

    return {
      success: true,
      message: 'Job completed and rating submitted successfully.'
    };
  },

  /**
   * Complete job
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
