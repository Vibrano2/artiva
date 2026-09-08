import { encodePath, fetchWithAuth } from './apiConfig';
import { normalizeProforma } from './normalizers';

export const ProformaService = {
  async uploadProformaDocument(jobId, file) {
    if (!(file instanceof File)) throw new Error('Select an invoice file to upload.');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithAuth(`/api/proforma/upload/${encodePath(jobId)}`, {
      method: 'POST',
      body: formData,
    });
    return response.data || response;
  },

  async submitProformaInvoice(jobIdOrData, proformaData) {
    const data = typeof jobIdOrData === 'object'
      ? jobIdOrData
      : { job_id: jobIdOrData, ...proformaData };
    const jobId = data.job_id || data.jobId;
    if (!jobId) throw new Error('A valid job is required.');

    let invoicePath = data.invoice_document_path;
    if (!invoicePath && data.invoice_document instanceof File) {
      const upload = await this.uploadProformaDocument(jobId, data.invoice_document);
      invoicePath = upload.path;
    }
    if (!invoicePath) throw new Error('Upload a valid proforma document.');

    const payload = {
      job_id: jobId,
      supplier_name: String(data.supplier_name || '').trim(),
      total_amount: Number(data.total_amount),
      invoice_document_path: invoicePath,
      ...(data.materials_cost !== undefined ? { materials_cost: Number(data.materials_cost) } : {}),
      ...(Array.isArray(data.items) && data.items.length ? { items: data.items } : {}),
    };
    const response = await fetchWithAuth('/api/proforma/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const invoice = normalizeProforma(response.data?.invoice || response.invoice || response.data || response);
    return { success: true, message: response.message, data: invoice, proforma: invoice };
  },

  async getJobProformas(jobId) {
    const response = await fetchWithAuth(`/api/proforma/job/${encodePath(jobId)}`);
    const invoices = response.data?.invoices || response.invoices || response.data || [];
    return Array.isArray(invoices) ? invoices.map(normalizeProforma) : [];
  },
};
