import { fetchWithAuth } from './apiConfig';

export const ProformaService = {
  /**
   * Artisan submits proforma invoice for a job
   */
  submitProformaInvoice: async (jobIdOrData, proformaData) => {
    let jobId;
    let data;
    if (typeof jobIdOrData === 'object') {
      data = jobIdOrData;
      jobId = data.job_id || data.jobId;
    } else {
      jobId = jobIdOrData;
      data = proformaData;
    }

    const payload = {
      supplier_name: data.supplier_name || 'Abuja Hardware Mart',
      materials_cost: Number(data.materials_cost) || 0,
      labor_cost: Number(data.labor_cost) || 0,
      total_amount: Number(data.total_amount) || (Number(data.materials_cost || 0) + Number(data.labor_cost || 0)),
      items: data.items || [],
      receipt_url: data.receipt_url || ''
    };

    if (jobId) {
      try {
        return await fetchWithAuth(`/api/jobs/${jobId}/proforma`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch {
        return await fetchWithAuth('/api/proforma', {
          method: 'POST',
          body: JSON.stringify({ job_id: jobId, ...payload })
        });
      }
    } else {
      return await fetchWithAuth('/api/proforma', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  /**
   * Fetch proformas for a specific job
   */
  getJobProformas: async (jobId) => {
    try {
      const res = await fetchWithAuth(`/api/jobs/${jobId}/proforma`);
      return res.data || (Array.isArray(res) ? res : [res]);
    } catch {
      const res = await fetchWithAuth(`/api/proforma/job/${jobId}`);
      return res.data || (Array.isArray(res) ? res : [res]);
    }
  },

  /**
   * Update proforma status (approve / reject)
   */
  updateProformaStatus: async (proformaId, status, notes = '') => {
    try {
      return await fetchWithAuth(`/api/proformas/${proformaId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes })
      });
    } catch {
      const endpoint = status === 'approved' 
        ? `/api/admin/proforma/${proformaId}/approve` 
        : `/api/admin/proforma/${proformaId}/reject`;
      return await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: notes, notes })
      });
    }
  }
};
