import { fetchWithAuth } from './apiConfig';

export const PaymentService = {
  /**
   * Initialize a consolidated Paystack escrow payment (job_value + ₦500 fee).
   * PRD §7.3 / §9.4 — single checkout, amounts locked server-side.
   */
  async initializePayment(matchId, jobValue) {
    const res = await fetchWithAuth('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, job_value: Number(jobValue) })
    });

    return {
      success: true,
      message: res.message || 'Payment initialized successfully',
      data: {
        authorization_url: res.authorization_url,
        access_code: res.access_code,
        reference: res.reference,
        transaction_id: res.transaction_id
      }
    };
  },

  /**
   * Verify a Paystack transaction by reference
   */
  async verifyPayment(reference) {
    let res;
    try {
      res = await fetchWithAuth(`/api/payments/verify/${reference}`);
    } catch {
      res = await fetchWithAuth('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ reference })
      });
    }
    return {
      success: true,
      message: res.message || 'Transaction verified',
      data: res.data || res
    };
  },

  /**
   * Release escrow payout to artisan after Mark Complete
   */
  async releaseEscrowPayout(jobId, amount) {
    const res = await fetchWithAuth(`/api/payments/release/${jobId}`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
    return {
      success: true,
      message: res.message || 'Escrow funds disbursed',
      data: res.data || res
    };
  }
};
