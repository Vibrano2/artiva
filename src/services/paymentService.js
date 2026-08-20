import { fetchWithAuth } from './apiConfig';

export const PaymentService = {
  async initializePayment(matchId, jobValue) {
    try {
      const res = await fetchWithAuth(`/api/payments/initialise`, {
        method: 'POST',
        body: JSON.stringify({ match_id: matchId, job_value: jobValue })
      });
      return res.data || res;
    } catch (err) {
      console.error("Escrow Init Error:", err);
      throw err;
    }
  },

  async verifyPayment(reference) {
    const res = await fetchWithAuth(`/api/payments/verify`, {
      method: 'POST',
      body: JSON.stringify({ reference })
    });
    return res.data || res;
  }
};
