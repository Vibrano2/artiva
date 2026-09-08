import React, { useState } from 'react';
import { AlertCircle, FileText, Send, Upload } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export function ArtisanProformaScreen({ job }) {
  const { activeJob, navigateTo, showToast } = useApp();
  const targetJob = job || activeJob;
  const [supplierName, setSupplierName] = useState('');
  const [amount, setAmount] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const chooseInvoice = (event) => {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return;
    if (!ALLOWED_TYPES.has(file.type) || file.size > 10 * 1024 * 1024) {
      event.target.value = '';
      setInvoice(null);
      setError('Upload one JPEG, PNG, or PDF file no larger than 10 MB.');
      return;
    }
    setInvoice(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (!targetJob?.job_id) throw new Error('A valid paid job is required.');
      if (!(invoice instanceof File)) throw new Error('Select a valid invoice document.');
      await ApiService.submitProformaInvoice({
        job_id: targetJob.job_id,
        supplier_name: supplierName,
        total_amount: Number(amount),
        invoice_document: invoice,
      });
      showToast('Proforma submitted for review.', 'success');
      navigateTo('artisan_dash');
    } catch (submitError) {
      setError(submitError.message || 'The proforma could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <Header title="Submit proforma" backTo="artisan_dash" />
      <main className="max-w-md mx-auto px-4 py-8">
        <form onSubmit={submit} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-5">
          <div>
            <h1 className="font-extrabold text-xl text-[#0E3B40]">Supplier invoice</h1>
            <p className="text-xs text-slate-500 mt-1">Job: {targetJob?.title || targetJob?.trade || 'No job selected'}</p>
          </div>
          <label className="block text-xs font-bold text-[#0E3B40]">
            Supplier name
            <input value={supplierName} onChange={(event) => setSupplierName(event.target.value.slice(0, 120))} required minLength={2} maxLength={120} className="mt-2 w-full p-3 border border-slate-200 rounded-xl font-normal" />
          </label>
          <label className="block text-xs font-bold text-[#0E3B40]">
            Total amount (NGN)
            <input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required className="mt-2 w-full p-3 border border-slate-200 rounded-xl font-normal" />
          </label>
          <label className="block p-5 border-2 border-dashed border-[#16858F] rounded-2xl text-center text-[#16858F] cursor-pointer">
            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={chooseInvoice} className="hidden" />
            {invoice ? <FileText className="w-6 h-6 mx-auto mb-1" /> : <Upload className="w-6 h-6 mx-auto mb-1" />}
            <span className="text-xs font-bold">{invoice?.name || 'Choose invoice (JPEG, PNG, or PDF)'}</span>
          </label>
          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> An administrator must verify the invoice and independently vetted Paystack recipient before payout.</p>
          {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">{error}</p>}
          <button type="submit" disabled={submitting || !targetJob?.job_id || !invoice} className="w-full py-4 bg-[#16858F] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit for review'}
          </button>
        </form>
      </main>
    </div>
  );
}
