import { fetchWithAuth } from './apiConfig';

export const PaymentService = {
  async initializePayment(jobId, artisanId) {
    try {
      const res = await fetchWithAuth(`/v1/payments/initialize`, {
        method: 'POST',
        body: JSON.stringify({ jobId, artisanId })
      });
      return res.data || res;
    } catch {
      const fallbackRes = await fetchWithAuth(`/payments/initialise`, {
        method: 'POST',
        body: JSON.stringify({ jobId, artisanId })
      });
      return fallbackRes.data || fallbackRes;
    }
  },

  async verifyPayment(reference) {
    const res = await fetchWithAuth(`/v1/payments/verify`, {
      method: 'POST',
      body: JSON.stringify({ reference })
    });
    return res.data || res;
  }
};
