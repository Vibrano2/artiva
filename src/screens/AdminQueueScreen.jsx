import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { CheckCircle2, UserCheck, RefreshCw, XCircle, Flag, Image, FileText } from 'lucide-react';

export function AdminQueueScreen() {
  const { showToast } = useApp();
  const [queue, setQueue] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedPhotos, setExpandedPhotos] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [list, flagged] = await Promise.all([
        ApiService.getAdminQueue(),
        ApiService.getAdminFlags().catch(() => []),
      ]);
      setQueue(list);
      setFlags(flagged);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast('Failed to fetch verification queue: ' + err.message, 'error');
    }
  };

  const handleApprove = async (uid) => {
    try {
      await ApiService.verifyArtisan(uid, true);
      showToast('Artisan verified successfully!', 'success');
      fetchQueue();
    } catch (err) {
      showToast('Error verifying artisan: ' + err.message, 'error');
    }
  };

  const handleReject = async (uid) => {
    if (!rejectReason.trim()) {
      showToast('Please enter a rejection reason.', 'error');
      return;
    }
    try {
      await ApiService.verifyArtisan(uid, false, rejectReason.trim());
      showToast('Profile rejected and reason sent.', 'info');
      setRejectId(null);
      setRejectReason('');
      fetchQueue();
    } catch (err) {
      showToast('Error rejecting artisan: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Admin Verification Queue" backTo="admin_dash" />

      <main className="max-w-md mx-auto px-4 py-4 space-y-4 animate-fade-in">

        <div className="bg-purple-900 text-white p-5 rounded-3xl shadow-card space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
              Internal Verification Console
            </span>
            <span className="px-2 py-0.5 bg-purple-700 text-purple-100 text-[10px] font-bold rounded-full">
              {queue.length} Pending
            </span>
          </div>
          <h1 className="text-xl font-bold font-['Outfit']">NIN & Credentials Review</h1>
          <p className="text-xs text-purple-200">
            Review and approve pending artisan profiles before they go live in Life Camp Abuja.
          </p>
          <div className="pt-2 flex justify-end">
            <button
              onClick={fetchQueue}
              className="p-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* No-Response Flags (PRD AD-004) */}
        {flags.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-3xl shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-red-700">
              <Flag className="w-5 h-5" />
              <h2 className="font-bold font-['Outfit'] text-sm">Non-Response Flags ({flags.length})</h2>
            </div>
            <p className="text-xs text-red-600 leading-relaxed">
              Artisans below accumulated non-response flags. Investigate through the operations process before taking account action.
            </p>
            <div className="space-y-2 pt-1">
              {flags.map((a) => (
                <div key={a.uid} className="bg-white p-3 rounded-xl border border-red-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#0E3B40]">{a.first_name} {a.last_name}</p>
                    <p className="text-[11px] text-slate-500">{a.trade} • {a.no_response_flags} flag{a.no_response_flags !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-700">Manual review required</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonLoader type="card" count={2} />
        ) : queue.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-[#0E3B40]">Queue Clear!</h3>
            <p className="text-xs text-slate-500">All submitted artisan profiles have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {queue.map((artisan) => (
              <div key={artisan.uid} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Header row */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0E3B40] text-sm">
                      {artisan.first_name} {artisan.last_name}
                    </h3>
                    <p className="text-xs text-[#16858F] font-semibold">{artisan.trade} • {artisan.location}</p>
                  </div>
                  <span className="px-2 py-1 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-lg uppercase">
                    Pending
                  </span>
                </div>

                {/* Credential details */}
                <div className="px-4 pb-3 bg-slate-50 mx-4 rounded-xl border border-slate-200 text-xs space-y-1.5 mb-3">
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-500">NIN:</span>
                    <span className="font-mono font-bold text-[#0E3B40]">
                      {artisan.nin ? `${artisan.nin.slice(0,4)}••••${artisan.nin.slice(-3)}` : 'Not provided'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Experience:</span>
                    <span className="font-medium text-slate-800">{artisan.experience_years || '—'} years</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-slate-500">Services:</span>
                    <span className="font-medium text-slate-800 text-right max-w-[55%]">
                      {artisan.services?.join(', ') || 'General'}
                    </span>
                  </div>
                </div>

                {/* Work photos */}
                {artisan.id_document_url && (
                  <div className="px-4 mb-3">
                    <a href={artisan.id_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-2.5 bg-slate-100 rounded-xl text-xs font-bold text-[#0E3B40]">
                      <FileText className="w-4 h-4" /> Review identity document
                    </a>
                  </div>
                )}
                {artisan.work_photos?.length > 0 && (
                  <div className="px-4 mb-3">
                    <button
                      onClick={() => setExpandedPhotos(expandedPhotos === artisan.uid ? null : artisan.uid)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#16858F] mb-2 hover:underline"
                    >
                      <Image className="w-3.5 h-3.5" />
                      {expandedPhotos === artisan.uid ? 'Hide' : 'View'} Work Photos ({artisan.work_photos.length})
                    </button>
                    {expandedPhotos === artisan.uid && (
                      <div className="grid grid-cols-2 gap-2 animate-fade-in">
                        {artisan.work_photos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Work sample ${i + 1}`}
                            className="w-full h-28 object-cover rounded-xl border border-slate-100"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Reject reason input */}
                {rejectId === artisan.uid && (
                  <div className="px-4 mb-3 animate-fade-in">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (required)"
                      autoFocus
                      className="w-full bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-[#0E3B40] focus:outline-none focus:border-red-400"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 px-4 pb-4">
                  {rejectId === artisan.uid ? (
                    <>
                      <button
                        onClick={() => handleReject(artisan.uid)}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setRejectId(null); setRejectReason(''); }}
                        className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setRejectId(artisan.uid)}
                        className="flex-1 py-2.5 border border-red-200 text-red-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(artisan.uid)}
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Approve
                      </button>
                    </>
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
