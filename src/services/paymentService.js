import { fetchWithAuth } from './apiConfig';

export const PaymentService = {
  /**
   * Initialize Paystack Escrow transaction intent
   * @param {string} matchId - The match ID or Job ID
   * @param {number} jobValue - Total amount in NGN
   */
  async initializePayment(matchId, jobValue) {
    const payload = {
      match_id: matchId,
      job_value: Number(jobValue)
    };

    let res;
    try {
      res = await fetchWithAuth('/api/payments/initialize', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch {
      res = await fetchWithAuth('/api/payments/initialise', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    return res.data || res;
  },

  /**
   * Verify transaction with Paystack reference
   * @param {string} reference - Paystack reference string
   */
  async verifyPayment(reference) {
    const res = await fetchWithAuth('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference })
    });
    return res.data || res;
  },

  /**
   * Release escrow payout to artisan account
   * @param {string} jobId
   * @param {number} amount
   */
  async releaseEscrowPayout(jobId, amount) {
    let res;
    try {
      res = await fetchWithAuth('/api/payments/payout', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, amount })
      });
    } catch {
      res = await fetchWithAuth(`/api/payments/release/${jobId}`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
    }
    return res.data || res;
  }
};
