import { encodePath, fetchWithAuth } from './apiConfig';

function assertPaystackCheckoutUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'checkout.paystack.com') {
    throw new Error('The payment provider returned an invalid checkout URL.');
  }
  return url.toString();
}

export const PaymentService = {
  async initializePayment(matchId) {
    if (!matchId) throw new Error('Select a valid artisan match before payment.');
    const response = await fetchWithAuth('/api/payments/initialize', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId }),
    });
    return {
      success: true,
      message: response.message || 'Payment initialized successfully',
      data: {
        authorization_url: assertPaystackCheckoutUrl(response.authorization_url),
        access_code: response.access_code,
        reference: response.reference,
        transaction_id: response.transaction_id,
      },
    };
  },

  async verifyPayment(reference) {
    const response = await fetchWithAuth(`/api/payments/verify/${encodePath(reference)}`);
    return { success: true, message: response.message, data: response.data || response };
  },
};
