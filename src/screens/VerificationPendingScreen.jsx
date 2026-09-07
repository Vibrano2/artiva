import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export function VerificationPendingScreen({ artisanId }) {
  const { navigateTo, currentUser, showToast } = useApp();
  const targetId = artisanId || currentUser?.uid;

  const [isVerified, setIsVerified] = useState(false);
  const [autoRedirected, setAutoRedirected] = useState(false);

  // Real-time listener: when admin flips isVerified → true, auto-navigate
  useEffect(() => {
    if (!targetId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'artisanProfiles', targetId),
      (snap) => {
        if (!snap.exists()) return;
        const verified = snap.data().isVerified === true;
        setIsVerified(verified);

        if (verified && !autoRedirected) {
          setAutoRedirected(true);
          showToast('Your profile has been verified! Welcome to Artiva.', 'success');
          // Small delay so the success state flashes before navigating
          setTimeout(() => navigateTo('artisan_dash', { artisanId: targetId }), 1500);
        }
      },
      (err) => console.error('Verification listener error:', err)
    );

    return unsubscribe;
  }, [targetId]);

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col justify-between">
      <Header title="Verification Status" backTo="onboarding" />

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card animate-fade-in text-center space-y-6">

          {isVerified ? (
            /* ── Approved state ── */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-['Outfit'] text-[#0E3B40]">
                  Profile Approved!
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your verified badge is live. Redirecting to your dashboard…
                </p>
              </div>
              <div className="w-8 h-8 border-4 border-[#16858F] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            /* ── Pending state ── */
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-10 h-10" />
              </div>

              <div>
                <h1 className="text-2xl font-bold font-['Outfit'] text-[#0E3B40]">
                  Verification Under Review
                </h1>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your NIN details and trade credentials have been submitted to the Artiva Admin Queue for Life Camp Abuja. This page will update automatically.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">NIN Identity Database:</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md text-[10px] uppercase">Reviewing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Trade Skill Credentials:</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md text-[10px] uppercase">Submitted</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Coverage Area:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px] uppercase">Life Camp ✓</span>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {/* Demo shortcut — visible in dev/demo only */}
                <button
                  onClick={() => navigateTo('admin_queue')}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press touch-target"
                >
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span>Open Admin Queue to Approve (Demo)</span>
                </button>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In production, the admin reviews your profile and approves within 24 hours. This page updates automatically when approved.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
