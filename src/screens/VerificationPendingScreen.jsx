import React, { useEffect, useState } from 'react';
import { Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

export function VerificationPendingScreen() {
  const { currentUser, navigateTo, showToast } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const nextProfile = await ApiService.getArtisanProfile(currentUser.uid);
      setProfile(nextProfile);
      if (nextProfile.verification_status === 'approved' || nextProfile.is_verified) {
        navigateTo('artisan_dash');
      }
    } catch (error) {
      showToast(error.message || 'Verification status could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 15_000);
    return () => window.clearInterval(timer);
  }, [currentUser?.uid]);

  const rejected = profile?.verification_status === 'rejected';
  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <Header title="Identity verification" backTo="home" />
      <main className="max-w-md mx-auto px-4 py-12">
        <section className="bg-white p-7 rounded-3xl border border-slate-200 shadow-card text-center space-y-5">
          {rejected ? <ShieldCheck className="w-14 h-14 text-red-600 mx-auto" /> : <Clock3 className="w-14 h-14 text-amber-600 mx-auto" />}
          <div>
            <h1 className="text-xl font-extrabold text-[#0E3B40]">{rejected ? 'Verification needs attention' : 'Verification pending'}</h1>
            <p className="text-sm text-slate-500 mt-2">
              {rejected
                ? (profile?.rejection_reason || 'Your submission was not approved. Contact support before resubmitting.')
                : 'The operations team is reviewing your identity, payout account, and work samples.'}
            </p>
          </div>
          <button type="button" onClick={refresh} disabled={loading} className="w-full py-3.5 rounded-2xl bg-[#16858F] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh status
          </button>
        </section>
      </main>
    </div>
  );
}
