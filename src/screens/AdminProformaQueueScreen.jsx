import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function AdminProformaQueueScreen() {
  const { user } = useApp();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.request('/admin/proforma-queue');
      setQueue(response.data.queue || []);
    } catch (err) {
      console.error('Failed to fetch proforma queue:', err);
      setError('Could not load proforma invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      await ApiService.request(`/admin/proforma/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Approved by admin' })
      });
      fetchQueue();
    } catch (err) {
      console.error('Failed to approve invoice:', err);
      alert('Failed to approve invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(id);
      await ApiService.request(`/admin/proforma/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason })
      });
      setRejectionReason('');
      setSelectedInvoice(null);
      fetchQueue();
    } catch (err) {
      console.error('Failed to reject invoice:', err);
      alert('Failed to reject invoice');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Proforma Approvals" backTo="admin_dashboard" />

      <main className="max-w-md mx-auto px-4 py-6 space-y-4 animate-fade-in">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-8 h-8 border-4 border-[#0E3B40]/20 border-t-[#0E3B40] rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Loading queue...</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-[#0E3B40] text-lg">All Caught Up!</h3>
              <p className="text-slate-500 text-sm mt-1">There are no pending proforma invoices to review.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-500 px-1">
              {queue.length} Pending {queue.length === 1 ? 'Invoice' : 'Invoices'}
            </p>
            
            {queue.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0E3B40] text-sm font-['Outfit']">
                        Invoice #{invoice.id.substring(0, 6).toUpperCase()}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Job: {invoice.job_id}</p>
                      <p className="text-xs text-slate-500">Artisan: {invoice.artisan_uid}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0E3B40]">
                      ₦{(invoice.amount || 0).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      PENDING
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Materials Needed</p>
                    <ul className="space-y-2">
                      {invoice.materials?.map((mat, i) => (
                        <li key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">{mat.name} (x{mat.quantity})</span>
                          <span className="font-medium text-[#0E3B40]">₦{(mat.cost || 0).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {invoice.description && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-700 italic">"{invoice.description}"</p>
                    </div>
                  )}

                  {selectedInvoice === invoice.id ? (
                    <div className="space-y-3 animate-fade-in bg-red-50 p-3 rounded-xl border border-red-100">
                      <label className="text-xs font-bold text-red-800">Reason for Rejection</label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="E.g., Missing material details..."
                        className="w-full bg-white border border-red-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(invoice.id)}
                          disabled={actionLoading === invoice.id || !rejectionReason.trim()}
                          className="flex-1 bg-red-600 text-white font-bold text-sm py-2 rounded-xl disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvoice(null);
                            setRejectionReason('');
                          }}
                          className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold text-sm py-2 rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice.id)}
                        disabled={actionLoading === invoice.id}
                        className="flex-1 py-2.5 rounded-xl border-2 border-red-100 text-red-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleApprove(invoice.id)}
                        disabled={actionLoading === invoice.id}
                        className="flex-1 py-2.5 rounded-xl bg-[#0E3B40] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#0E3B40]/90 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === invoice.id ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <><CheckCircle className="w-4 h-4" /> Approve</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
