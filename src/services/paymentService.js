/**
 * paymentService.js
 *
 * Used by:
 *   PaystackCheckoutModal → initializePayment(jobId, email) → { success, data: { authorization_url, reference, breakdown } }
 *                         → (verifyPayment after redirect back)
 *   Client settlement     → releaseEscrowPayout(jobId)
 *                         → refundPayment(jobId, reason)
 *   Artisan dashboard     → registerBankAccount({ accountNumber, bankCode, accountName })
 */

import { functions } from '../config/firebase';
import { httpsCallable } from 'firebase/functions';

export const PaymentService = {
  /**
   * initializePayment(jobId, receiptEmail)
   *
   * Calls initializePayment Cloud Function.
   * Returns: { success, message, data: { authorization_url, access_code, reference, breakdown } }
   *
   * PaystackCheckoutModal reads:  payment.data.authorization_url
   */
  async initializePayment(jobId, receiptEmail) {
    const fn = httpsCallable(functions, 'initializePayment');
    const res = await fn({ jobId, email: receiptEmail });
    const txn = res.data;
    return {
      success: true,
      message: 'Payment initialized successfully',
      data: {
        authorization_url: txn.authorizationUrl,
        access_code: txn.accessCode,
        reference: txn.reference,
        breakdown: txn.breakdown, // { jobValue, platformFee, total }
      },
    };
  },

  /**
   * verifyPayment(reference)
   *
   * Returns: { success, message, data: { status, reference, amount, currency } }
   */
  async verifyPayment(reference) {
    const fn = httpsCallable(functions, 'verifyPayment');
    const res = await fn({ reference });
    const p = res.data;
    return {
      success: true,
      message: 'Transaction verified',
      data: { status: p.status, reference: p.reference, amount: p.amount, currency: p.currency },
    };
  },

  /**
  * releaseEscrowPayout(jobId)  — job owner only
   *
   * Returns: { success, message, data }
   */
  async releaseEscrowPayout(jobId) {
    const fn = httpsCallable(functions, 'releaseEscrowPayout');
    const res = await fn({ jobId });
    return { success: true, message: 'Approved supplier invoices have been settled', data: res.data };
  },

  /**
   * refundPayment(jobId, reason)  — admin only
   *
   * Returns: { success, message, data }
   */
  async refundPayment(jobId, reason = 'dispute') {
    const fn = httpsCallable(functions, 'refundPayment');
    const res = await fn({ jobId, reason });
    return { success: true, message: 'Payment refunded', data: res.data };
  },

  /**
   * registerBankAccount({ accountNumber, bankCode, accountName })
   *
   * Called from artisan "Add Bank Details" form.
   * Returns: { success, message, data: { recipientCode, accountName } }
   */
  async registerBankAccount({ accountNumber, bankCode, accountName }) {
    const fn = httpsCallable(functions, 'registerPaystackRecipient');
    const res = await fn({ accountNumber, bankCode, accountName });
    return { success: true, message: 'Bank account registered', data: res.data };
  },
};
