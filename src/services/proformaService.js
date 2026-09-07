/**
 * proformaService.js
 *
 * Used by:
 *   ArtisanProformaScreen → submitProformaInvoice({job_id, supplier_name, total_amount, invoice_document_url})
 *                           → { success, message, data, proforma }
 */

import { db, functions } from '../config/firebase';
import {
  collection, getDocs, query, where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { mapProforma, requireCurrentUser } from './firebaseData';

export const ProformaService = {
  /**
   * submitProformaInvoice(jobIdOrData, proformaData?)
   *
   * Accepts either:
   *   submitProformaInvoice({ job_id, supplier_name, total_amount, invoice_document_url })
   *   submitProformaInvoice(jobId, { supplier_name, total_amount, ... })
   *
   * Returns: { success, message, data: { id, job_id, supplier_name, total_amount, ... }, proforma }
   */
  async submitProformaInvoice(jobIdOrData, proformaData) {
    const raw =
      typeof jobIdOrData === 'object'
        ? jobIdOrData
        : { job_id: jobIdOrData, ...proformaData };

    const user = requireCurrentUser();

    const payload = {
      job_id: raw.job_id || raw.jobId || '',
      supplier_name: raw.supplier_name || 'Local Hardware Store',
      materials_cost: Number(raw.materials_cost) || 0,
      labor_cost: Number(raw.labor_cost) || 0,
      total_amount: Number(raw.total_amount) || 0,
      items: raw.items || [],
      receipt_url: raw.receipt_url || raw.invoice_document_url || '',
      description: raw.description || '',
    };

    if (!payload.job_id) throw new Error('job_id is required to submit a proforma invoice.');
    if (payload.total_amount <= 0) throw new Error('Total amount must be greater than 0.');
    if (!payload.receipt_url) throw new Error('Please upload a proforma invoice document.');

    const fn = httpsCallable(functions, 'submitProforma');
    const response = await fn({
      jobId: payload.job_id,
      supplierName: payload.supplier_name,
      totalAmount: payload.total_amount,
      receiptUrl: payload.receipt_url,
      items: payload.items,
      description: payload.description,
    });

    const result = { id: response.data.id, ...payload, artisanId: user.uid, status: 'pending' };
    return {
      success: true,
      message: 'Proforma invoice submitted for admin review.',
      data: result,
      proforma: result,
    };
  },

  /**
   * getJobProformas(jobId)
   */
  async getJobProformas(jobId) {
    const snaps = await getDocs(
      query(collection(db, 'proformas'), where('jobId', '==', jobId))
    );
    return snaps.docs.map(mapProforma);
  },

  /**
   * updateProformaStatus(proformaId, status, notes)
   */
  async updateProformaStatus(proformaId, status, notes = '') {
    throw new Error('Proforma review is restricted to the admin approval workflow.');
  },
};
