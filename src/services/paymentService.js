import { fetchWithAuth } from './apiConfig';

export const PaymentService = {
  async initializePayment(jobId, artisanId) {
    const res = await fetchWithAuth(`/payments/initialise`, {
      method: 'POST',
      body: JSON.stringify({
        jobId,
        artisanId
      })
    });
    return {
      authorizationUrl: res.authorizationUrl,
      reference: res.reference
    };
  }
};
