import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ArtivaLogo } from '../components/ArtivaLogo';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { OfflineBanner } from '../components/OfflineBanner';
import { ShieldCheck, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { VideoOverlay } from '../components/VideoOverlay';
import { 
  signInWithPhoneNumber, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { 
  formatNigerianPhoneNumber, 
  getOrCreateRecaptchaVerifier, 
  formatAuthError 
} from '../utils/authUtils';

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
  const [activeFormattedPhone, setActiveFormattedPhone] = useState('');

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

  /**
   * Handle Google Sign-In with popup
   */
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      const syncRes = await ApiService.verifyFirebaseToken(token, role);
      const syncedUser = syncRes.user ? { ...user, ...syncRes.user } : user;

      setLoading(false);
      setCurrentUser(syncedUser);
      setUserRole(role);
      showToast('Signed in with Google successfully!', 'success');

      if (role === 'artisan') {
        navigateTo('artisan_dash');
      } else {
        navigateTo('client_dash');
      }
    } catch (err) {
      setLoading(false);
      const friendlyMsg = formatAuthError(err);
      setError(friendlyMsg);
    }
  };

  /**
   * Handle Apple Sign-In with popup
   */
  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const token = await user.getIdToken();

      const syncRes = await ApiService.verifyFirebaseToken(token, role);
      const syncedUser = syncRes.user ? { ...user, ...syncRes.user } : user;

      setLoading(false);
      setCurrentUser(syncedUser);
      setUserRole(role);
      showToast('Signed in with Apple successfully!', 'success');

      if (role === 'artisan') {
        navigateTo('artisan_dash');
      } else {
        navigateTo('client_dash');
      }
    } catch (err) {
      setLoading(false);
      const friendlyMsg = formatAuthError(err);
      setError(friendlyMsg);
    }
  };

  /**
   * Handle Send OTP for Nigerian phone number
   */
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    const { formatted, isValid } = formatNigerianPhoneNumber(phone);
    if (!isValid) {
      setError('Please enter a valid 10 or 11-digit Nigerian phone number (e.g. 0803 123 4567).');
      return;
    }
    if (!ndprConsent) {
      setError('You must accept the Terms and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    setActiveFormattedPhone(formatted);

    try {
      const appVerifier = getOrCreateRecaptchaVerifier('recaptcha-container', () => {
        setError('Security check expired. Please try sending OTP again.');
      });

      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmationResult(confirmation);

      setLoading(false);
      setStep(2);
      showToast(`OTP sent to ${formatted}`, 'success');
      startTimer();
    } catch (err) {
      console.warn('[FirebaseAuth] Primary phone auth failed, attempting fallback:', err);

      try {
        await ApiService.sendPhoneOtp(formatted);
        setConfirmationResult(null);
        setLoading(false);
        setStep(2);
        showToast(`OTP sent to ${formatted}`, 'success');
        startTimer();
      } catch (backendErr) {
        setLoading(false);
        const friendlyMsg = formatAuthError(err || backendErr);
        setError(friendlyMsg);
      }
    }
  };

  /**
   * Handle Verify OTP
   */
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      let syncedUser;
      if (confirmationResult && typeof confirmationResult.confirm === 'function') {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        const token = await user.getIdToken();
        const syncRes = await ApiService.verifyFirebaseToken(token, role);
        syncedUser = syncRes.user ? { ...user, ...syncRes.user } : user;
      } else {
        syncedUser = await ApiService.verifyPhoneOtp(activeFormattedPhone, otp, role);
      }

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
      const friendlyMsg = formatAuthError(err);
      setError(friendlyMsg);
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

      {/* Persistent Invisible reCAPTCHA Container */}
      <div id="recaptcha-container" className="fixed bottom-0 left-0 z-50"></div>

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
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4">
              <ArtivaLogo size="md" showWordmark={false} />
            </div>
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

          {step === 1 && (
            <div className="flex gap-3 mb-6">
              <button 
                type="button"
                onClick={handleAppleSignIn}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1f1f1f] hover:bg-black text-white text-[13px] font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M16.636 12.008c0-3.033 2.47-4.49 2.584-4.568-1.423-2.083-3.626-2.368-4.407-2.4-1.879-.191-3.676 1.106-4.636 1.106-.962 0-2.441-1.077-3.987-1.047-2.016.03-3.882 1.171-4.918 2.975-2.093 3.625-.536 8.988 1.503 11.936 1.004 1.442 2.183 3.06 3.743 3.003 1.498-.059 2.062-.969 3.864-.969 1.796 0 2.308.97 3.867.94 1.603-.027 2.61-1.465 3.593-2.923 1.144-1.677 1.614-3.3 1.637-3.385-.035-.015-3.178-1.218-3.178-4.664M11.979 4.398c.816-1.004 1.365-2.404 1.215-3.805-1.205.048-2.673.811-3.518 1.815-.758.88-1.421 2.3-1.245 3.68 1.346.104 2.73-.708 3.548-1.69" /></svg>
                Apple
              </button>
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 text-[#1f1f1f] text-[13px] font-bold rounded-xl transition-all shadow-sm border border-[#e0e0e0] disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-red-50/90 border border-red-200 text-red-800 text-xs font-semibold rounded-xl text-left shadow-sm">
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
                    maxLength={11}
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
