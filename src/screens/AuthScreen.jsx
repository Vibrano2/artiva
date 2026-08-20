import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { OfflineBanner } from '../components/OfflineBanner';
import { Mail, ShieldCheck, ArrowRight, Check, RefreshCw, KeyRound, Phone } from 'lucide-react';
import { VideoOverlay } from '../components/VideoOverlay';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

export function AuthScreen({ role = 'client', initialMode = 'signup' }) {
  const { navigateTo, setCurrentUser, setUserRole, showToast } = useApp();

  const [authMode, setAuthMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [ndprConsent, setNdprConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(30);
  const [cardVisible, setCardVisible] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    if (!ndprConsent) {
      setError('You must accept the Terms and Privacy Policy to proceed.');
      return;
    }
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;
      await ApiService.sendPhoneOtp(formattedPhone);
      
      setLoading(false);
      setStep(2);
      showToast(`OTP sent to ${formattedPhone}`, 'success');
      startTimer();
    } catch (err) {
      console.error('API OTP Error:', err);
      setLoading(false);
      setError(`${err.code || 'Error'}: ${err.message}`);
    }
  };

  const startTimer = () => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+234${phone.replace(/^0/, '')}`;
      const syncRes = await ApiService.verifyPhoneOtp(formattedPhone, otp, role);
      
      if (syncRes.token) {
        await signInWithCustomToken(auth, syncRes.token);
      }

      const syncedUser = syncRes.user ? { ...auth.currentUser, ...syncRes.user } : auth.currentUser;

      setLoading(false);
      setCurrentUser(syncedUser);
      setUserRole(role);
      showToast('Authentication successful!', 'success');

      if (role === 'artisan') {
        navigateTo('artisan_dash');
      } else {
        navigateTo('client_dash');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Invalid OTP');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E3B40] flex flex-col justify-between relative overflow-hidden">
      <VideoOverlay onCardShowTrigger={() => setCardVisible(true)} />

      <div className="relative z-30">
        <Header backTo="onboarding" />
      </div>

      <div className="relative z-30">
        <OfflineBanner onRetry={step === 1 ? handleSendOtp : handleVerifyOtp} />
      </div>

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center relative z-20">
        <div 
          className="bg-white/55 backdrop-blur-[6px] p-11 pb-9 rounded-[18px] text-center transition-all duration-800 ease-in-out"
          style={{
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
            opacity: cardVisible ? 1 : 0,
            pointerEvents: cardVisible ? 'auto' : 'none',
            transform: cardVisible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className="mb-6">
            <h1 className="text-[26px] text-[#1f1f1f] mb-1.5 tracking-[0.5px] font-semibold">
              {step === 1 
                ? (authMode === 'signup' ? 'Create Account' : 'Welcome back') 
                : 'Verify Security Code'}
            </h1>
            <p className="text-[14px] text-[#8a8a8a] mb-[30px]">
              {step === 1 
                ? (authMode === 'signup' ? 'Sign up to continue' : 'Sign in to continue')
                : `We sent a 6-digit OTP code to your phone`}
            </p>
          </div>

          {step === 1 && (
            <div className="flex bg-white/40 p-1 rounded-xl mb-6 shadow-sm border border-white/50">
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  authMode === 'signup' ? 'bg-[#16858F] text-white shadow-sm' : 'text-[#6b6b6b] hover:text-[#1f1f1f]'
                }`}
                type="button"
              >
                Sign Up
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  authMode === 'login' ? 'bg-[#16858F] text-white shadow-sm' : 'text-[#6b6b6b] hover:text-[#1f1f1f]'
                }`}
                type="button"
              >
                Log In
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50/80 border border-red-200 text-red-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-pulse text-left">
              <span>{error}</span>
            </div>
          )}



          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-[18px]">
              <div className="text-left">
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5">
                  Nigerian Phone Number
                </label>
                <div className="flex items-center rounded-[10px] border-[1.5px] border-[#e0e0e0] bg-[#fafafa] focus-within:border-[#16858F] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#16858F]/25 overflow-hidden transition-all">
                  <span className="px-3 py-[13px] text-[#444] font-semibold text-[15px] border-r border-[#e0e0e0] flex items-center gap-1.5 bg-gray-50/50">
                    <span className="text-base">🇳🇬</span> +234
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="803 123 4567"
                    className="w-full p-[13px_14px] text-[15px] text-[#222] outline-none bg-transparent"
                    maxLength={10}
                    autoFocus
                  />
                </div>
              </div>

              <div 
                onClick={() => setNdprConsent(!ndprConsent)}
                className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-xl hover:bg-white/30 transition-colors text-left"
              >
                <div className="flex items-center justify-center h-5">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${ndprConsent ? 'bg-[#16858F] border-[#16858F]' : 'bg-[#fafafa] border-[#e0e0e0]'}`}>
                    {ndprConsent && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                </div>
                <p className="text-[13px] text-[#444] leading-5">
                  I agree to <span className="font-bold hover:underline">Artiva's Terms</span> and <span className="font-bold hover:underline">Privacy Policy</span>.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px disabled:opacity-50 mt-1.5 flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Send Verification Code' : 'Log In With OTP'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-[18px]">
              <div className="text-left">
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 text-center">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full p-[13px_14px] text-center text-2xl tracking-[0.4em] font-bold text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-[13px] text-[#6b6b6b] mt-[18px]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-[#1f1f1f] transition-colors"
                >
                  Change Phone Number
                </button>
                {timer > 0 ? (
                  <span>Resend code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="font-bold hover:text-[#1f1f1f] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px disabled:opacity-50 mt-1.5 flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>



      <footer className="p-4 text-center text-xs text-[#8a8a8a] flex items-center justify-center gap-1.5 relative z-20 mix-blend-multiply">
        <ShieldCheck className="w-4 h-4" />
        <span>End-to-End Escrow Protection • Life Camp, Abuja</span>
      </footer>
    </div>
  );
}
