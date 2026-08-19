import { apiCall } from './apiConfig';

export const ProformaService = {
  submitProformaInvoice: async (data) => {
    return apiCall(`/proforma/submit`, 'POST', data);
  }
};
