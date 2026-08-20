import { fetchWithAuth } from './apiConfig';

export const ProformaService = {
  submitProformaInvoice: async (data) => {
    return fetchWithAuth(`/api/proforma`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getJobProformas: async (jobId) => {
    return fetchWithAuth(`/api/proforma/job/${jobId}`);
  }
};
