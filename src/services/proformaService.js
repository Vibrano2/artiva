import { fetchWithAuth } from './apiConfig';

export const ProformaService = {
  /**
   * Artisan submits a supplier proforma invoice (PRD A-009 / §7.6)
   */
  submitProformaInvoice: async (jobIdOrData, proformaData) => {
    let data;
    if (typeof jobIdOrData === 'object') {
      data = jobIdOrData;
    } else {
      data = { job_id: jobIdOrData, ...proformaData };
    }

    const payload = {
      job_id: data.job_id || data.jobId,
      supplier_name: data.supplier_name,
      total_amount: Number(data.total_amount) || 0,
      materials_cost: Number(data.materials_cost) || 0,
      labor_cost: Number(data.labor_cost) || 0,
      items: data.items || [],
      receipt_url: data.receipt_url || data.invoice_document_url || '',
      invoice_document_url: data.invoice_document_url || data.receipt_url || '',
      supplier_recipient_code: data.supplier_recipient_code || ''
    };

    const res = await fetchWithAuth(`/api/proforma/submit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: res.message || 'Proforma submitted successfully',
      data: res.data || res,
      proforma: res.data || res
    };
  },

  /**
   * Fetch proformas for a specific job
   */
  getJobProformas: async (jobId) => {
    const res = await fetchWithAuth(`/api/proforma/job/${jobId}`);
    return res.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Update proforma status — admin only (PRD AD-005)
   */
  updateProformaStatus: async (proformaId, status, notes = '') => {
    const endpoint = status === 'approved'
      ? `/api/admin/proforma/${proformaId}/approve`
      : `/api/admin/proforma/${proformaId}/reject`;

    const res = await fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify({ notes, reason: notes })
    });

    return {
      success: true,
      message: res.message || `Proforma ${status}`,
      data: res.data || res
    };
  }
};
