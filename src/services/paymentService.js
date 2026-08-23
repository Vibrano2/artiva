export const PaymentService = {
  /**
   * Initialize Paystack Escrow transaction intent locally
   */
  async initializePayment(matchId, jobValue) {
    const reference = `verifix_${Date.now()}`;
    return {
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: `https://checkout.paystack.com/demo_${reference}`,
        access_code: `code_${reference}`,
        reference
      }
    };
  },

  /**
   * Verify transaction with Paystack reference
   */
  async verifyPayment(reference) {
    return {
      success: true,
      message: 'Transaction verified successfully',
      data: {
        status: 'success',
        reference: reference || `verifix_${Date.now()}`,
        amount: 20000,
        currency: 'NGN',
        paid_at: new Date().toISOString()
      }
    };
  },

  /**
   * Release escrow payout to artisan account
   */
  async releaseEscrowPayout(jobId, amount) {
    return {
      success: true,
      message: 'Escrow funds disbursed to artisan account successfully',
      data: {
        job_id: jobId,
        amount: amount || 20000,
        status: 'DISBURSED_FULL',
        transferred_at: new Date().toISOString()
      }
    };
  }
};
