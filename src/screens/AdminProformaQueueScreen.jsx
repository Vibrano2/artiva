import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileText, RefreshCw, XCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

export function AdminProformaQueueScreen() {
  const { showToast } = useApp();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [recipientCodes, setRecipientCodes] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      setQueue(await ApiService.getAdminProformaQueue());
    } catch (error) {
      showToast(error.message || 'Proforma queue could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const approve = async (item) => {
    const code = String(recipientCodes[item.id] || '').trim();
    if (!/^RCP_[A-Za-z0-9]+$/.test(code)) {
      showToast('Enter a pre-vetted Paystack recipient code beginning with RCP_.', 'error');
      return;
    }
    setWorkingId(item.id);
    try {
      await ApiService.approveProforma(item.id, { supplier_recipient_code: code });
      showToast('Payout submitted. Await the signed Paystack webhook for final status.', 'success');
      await load();
    } catch (error) {
      showToast(error.message || 'Approval failed.', 'error');
    } finally {
      setWorkingId('');
    }
  };

  const reject = async (item) => {
    const reason = window.prompt('Reason for rejection (3 to 1000 characters):');
    if (!reason || reason.trim().length < 3) return;
    setWorkingId(item.id);
    try {
      await ApiService.rejectProforma(item.id, reason.trim());
      showToast('Proforma rejected.', 'success');
      await load();
    } catch (error) {
      showToast(error.message || 'Rejection failed.', 'error');
    } finally {
      setWorkingId('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Proforma approvals" backTo="admin_dash" />
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">{queue.length} item(s) awaiting review</p>
          <button type="button" onClick={load} disabled={loading} className="p-2 rounded-full bg-white border border-slate-200" aria-label="Refresh"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        {!loading && queue.length === 0 && <div className="bg-white p-8 rounded-3xl text-center text-sm text-slate-500">The queue is clear.</div>}
        {queue.map((item) => (
          <section key={item.id} className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex justify-between gap-3">
              <div><p className="font-bold text-[#0E3B40]">{item.supplier_name}</p><p className="text-xs text-slate-500">Job {item.job_id}</p></div>
              <p className="font-extrabold text-[#0E3B40]">₦{Number(item.amount || 0).toLocaleString()}</p>
            </div>
            {item.invoice_document_url ? (
              <a href={item.invoice_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 text-sm font-bold text-[#0E3B40]">
                <FileText className="w-4 h-4" /> Review signed invoice link <ExternalLink className="w-3 h-3" />
              </a>
            ) : <p className="text-xs text-red-700">Invoice preview is unavailable. Do not approve until the document is reviewed.</p>}
            <label className="block text-xs font-bold text-[#0E3B40]">
              Pre-vetted supplier recipient code
              <input value={recipientCodes[item.id] || ''} onChange={(event) => setRecipientCodes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="RCP_..." maxLength={128} className="mt-2 w-full p-3 border border-slate-200 rounded-xl font-mono font-normal" />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => approve(item)} disabled={workingId === item.id || !item.invoice_document_url} className="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold flex justify-center items-center gap-1 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Approve</button>
              <button type="button" onClick={() => reject(item)} disabled={workingId === item.id} className="flex-1 py-3 bg-red-50 text-red-700 rounded-xl font-bold flex justify-center items-center gap-1 disabled:opacity-50"><XCircle className="w-4 h-4" /> Reject</button>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
