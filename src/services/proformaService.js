import { mockDb } from '../data/mockDatabase';

export const ProformaService = {
  /**
   * Artisan submits proforma invoice locally
   */
  submitProformaInvoice: async (jobIdOrData, proformaData) => {
    let data;
    if (typeof jobIdOrData === 'object') {
      data = jobIdOrData;
    } else {
      data = { job_id: jobIdOrData, ...proformaData };
    }

    const payload = {
      job_id: data.job_id || data.jobId || 'job_demo',
      supplier_name: data.supplier_name || 'Abuja Hardware Mart',
      materials_cost: Number(data.materials_cost) || Number(data.total_amount) || 20000,
      labor_cost: Number(data.labor_cost) || 10000,
      total_amount: Number(data.total_amount) || 30000,
      items: data.items || [
        { name: 'PPR High Pressure Pipes', quantity: 2, unit_price: 5000, total: 10000 },
        { name: 'Pressure Control Valves', quantity: 2, unit_price: 5000, total: 10000 }
      ],
      receipt_url: data.receipt_url || data.invoice_document_url || ''
    };

    const newProf = mockDb.createProforma(payload);
    return {
      success: true,
      message: 'Proforma submitted successfully',
      data: newProf,
      proforma: newProf
    };
  },

  /**
   * Fetch proformas for a specific job
   */
  getJobProformas: async (jobId) => {
    return mockDb.getProformas(jobId);
  },

  /**
   * Update proforma status (approve / reject)
   */
  updateProformaStatus: async (proformaId, status, notes = '') => {
    const updated = mockDb.updateProformaStatus(proformaId, status, notes);
    return {
      success: true,
      message: `Proforma status updated to ${status}`,
      data: updated
    };
  }
};
