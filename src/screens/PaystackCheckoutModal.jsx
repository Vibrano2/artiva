import React, { useState } from 'react';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

export function PaystackCheckoutModal({ job, artisan }) {
  const {
    activeJob,
    activeArtisan,
    activeMatchId,
    setActiveMatchId,
  } = useApp();
  const targetJob = job || activeJob;
  const targetArtisan = artisan || activeArtisan;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = Number(targetJob?.budget || 0) + 500;

  const startPayment = async () => {
    setLoading(true);
    setError('');
    try {
      if (!targetJob?.job_id || !targetArtisan?.uid) {
        throw new Error('Choose a valid job and artisan before payment.');
      }

      let matchId = activeMatchId || targetArtisan.match_id;
      if (!matchId || targetArtisan.match_status !== 'accepted') {
        const selection = await ApiService.selectArtisan(targetJob.job_id, targetArtisan.uid);
        matchId = selection.match_id;
      }
      if (!matchId) throw new Error('The server did not return a valid match.');

      setActiveMatchId(matchId);
      const payment = await ApiService.initializePayment(matchId);
      window.location.assign(payment.data.authorization_url);
    } catch (paymentError) {
      setError(paymentError.message || 'Payment could not be initialized.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <Header title="Secure payment" backTo="match_list" />
      <OfflineBanner onRetry={startPayment} />
      <main className="max-w-md mx-auto px-4 py-10">
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-5">
          <div className="flex items-center gap-2 text-[#0E3B40]">
            <ShieldCheck className="w-5 h-5 text-[#16858F]" />
            <h1 className="font-extrabold">Paystack escrow checkout</h1>
          </div>

          <div className="bg-[#F4F8F8] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              {targetArtisan?.work_photos?.[0] ? (
                <img src={targetArtisan.work_photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-200" aria-hidden="true" />
              )}
              <div>
                <p className="font-bold text-sm text-[#0E3B40]">
                  {targetArtisan?.first_name} {targetArtisan?.last_name}
                </p>
                <p className="text-xs text-slate-500">{targetArtisan?.trade || 'Approved artisan'}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3 text-sm space-y-2">
              <div className="flex justify-between"><span>Job value</span><span>₦{Number(targetJob?.budget || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Platform fee</span><span>₦500</span></div>
              <div className="flex justify-between font-extrabold"><span>Expected total</span><span>₦{total.toLocaleString()}</span></div>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            The server calculates the final amount from the stored job and selected match. Paystack will display the authoritative charge before you approve it.
          </p>

          {error && (
            <div role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={startPayment}
            disabled={loading || !targetJob?.job_id || !targetArtisan?.uid}
            className="w-full py-4 bg-[#16858F] hover:bg-[#0E5C63] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{loading ? 'Opening Paystack…' : 'Continue to Paystack'}</span>
          </button>
        </section>
      </main>
    </div>
  );
}
