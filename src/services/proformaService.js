import { fetchWithAuth } from './apiConfig';

export const ProformaService = {
  submitProformaInvoice: async (data) => {
    return fetchWithAuth(`/v1/proforma`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  getJobProformas: async (jobId) => {
    return fetchWithAuth(`/v1/proforma/job/${jobId}`);
  }
};
