import React, { useState } from 'react';
import { Header } from '../components/Header';
import { ArtivaLogo } from '../components/ArtivaLogo';
import { useApp } from '../context/AppContext';
import { ApiService, ALL_TRADES, TARGET_LOCATIONS, TradeServicesMap } from '../services';
import { OfflineBanner } from '../components/OfflineBanner';
import { Wrench, ShieldCheck, ArrowRight, Upload, Phone, FileText, RefreshCw, KeyRound } from 'lucide-react';
import { VideoOverlay } from '../components/VideoOverlay';
import { signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';
import { 
  formatNigerianPhoneNumber, 
  getOrCreateRecaptchaVerifier, 
  formatAuthError 
} from '../utils/authUtils';

export function ArtisanSignupScreen() {
  const { navigateTo, setCurrentUser, setUserRole, showToast, currentUser } = useApp();

  const [step, setStep] = useState(1);
  const [cardVisible, setCardVisible] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const [firstName, setFirstName] = useState(currentUser?.first_name || currentUser?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || currentUser?.displayName?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  
  const [experienceYears, setExperienceYears] = useState('');
  const [trade, setTrade] = useState(ALL_TRADES[0]);
  const [location, setLocation] = useState(TARGET_LOCATIONS[0]);
  const [tagline, setTagline] = useState('');
  const [workPhotos, setWorkPhotos] = useState([
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
  ]);
  const [idPhoto, setIdPhoto] = useState('');
  const [nin, setNin] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [ndprConsent, setNdprConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableServices = TradeServicesMap[trade] || ['General ' + trade, 'Emergency ' + trade, 'Maintenance'];

  const toggleService = (svc) => {
    if (selectedServices.includes(svc)) {
      setSelectedServices(selectedServices.filter(s => s !== svc));
    } else {
      setSelectedServices([...selectedServices, svc]);
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

  const handleNextStep = async () => {
    setError(null);
    if (step === 1) {
      if (!firstName.trim()) return setError('Please provide your first name.');
      if (!lastName.trim()) return setError('Please provide your last name.');
      if (!experienceYears) return setError('Please provide your years of experience.');
      
      const { formatted, isValid } = formatNigerianPhoneNumber(phone);
      if (!isValid) {
        return setError('Please provide a valid 10 or 11-digit Nigerian phone number (e.g. 0803 123 4567).');
      }
      
      setLoading(true);
      try {
        const appVerifier = getOrCreateRecaptchaVerifier('recaptcha-container', () => {
          setError('Security check expired. Please retry.');
        });
        
        const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
        setConfirmationResult(confirmation);
        
        setLoading(false);
        setStep(2);
        showToast(`OTP sent to ${formatted}`, 'success');
        startTimer();
      } catch (err) {
        console.warn('[Artisan Phone Auth] Primary attempt failed, falling back to backend OTP:', err);
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
      return;
    }
    if (step === 3 && !tagline) {
      setError('Please provide a short tagline or bio.');
      return;
    }
    setStep(step + 1);
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    const { formatted } = formatNigerianPhoneNumber(phone);

    try {
      let syncedUser;
      if (confirmationResult && typeof confirmationResult.confirm === 'function') {
        const result = await confirmationResult.confirm(otp);
        const user = result.user;
        const token = await user.getIdToken();
        const syncRes = await ApiService.verifyFirebaseToken(token, 'artisan');
        syncedUser = syncRes.user ? { ...user, ...syncRes.user } : user;
      } else {
        syncedUser = await ApiService.verifyPhoneOtp(formatted, otp, 'artisan');
      }

      setCurrentUser(syncedUser);
      setLoading(false);
      showToast('Phone verified successfully!', 'success');
      setStep(3); // Proceed to Trade & Bio
    } catch (err) {
      setLoading(false);
      const friendlyMsg = formatAuthError(err);
      setError(friendlyMsg);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError(null);
    setLoading(true);
    const { formatted } = formatNigerianPhoneNumber(phone);

    try {
      const appVerifier = getOrCreateRecaptchaVerifier('recaptcha-container');
      const confirmation = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmationResult(confirmation);
      
      setLoading(false);
      showToast(`New OTP sent to ${formatted}`, 'success');
      startTimer();
    } catch (err) {
      console.warn('[Artisan Phone Auth] Resend failed, falling back to backend OTP:', err);
      try {
        await ApiService.sendPhoneOtp(formatted);
        setConfirmationResult(null);
        setLoading(false);
        showToast(`New OTP sent to ${formatted}`, 'success');
        startTimer();
      } catch (backendErr) {
        setLoading(false);
        const friendlyMsg = formatAuthError(err || backendErr);
        setError(friendlyMsg);
      }
    }
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    if (!nin || nin.length !== 11) {
      setError('Please provide a valid 11-digit NIN.');
      return;
    }
    if (!ndprConsent) {
      setError('You must accept the NDPR Privacy Policy and Terms to proceed.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await ApiService.signupArtisan({
        first_name: firstName,
        last_name: lastName,
        email: '',
        password: '',
        phone: phone,
        experience_years: Number(experienceYears),
        trade,
        services: selectedServices,
        location,
        tagline,
        work_photos: workPhotos,
        id_photo: idPhoto,
        nin
      });

      setLoading(false);
      setUserRole('artisan');
      showToast('Signup submitted! Verification pending.', 'success');
      navigateTo('artisan_pending', { artisanId: res.artisanId });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E3B40] flex flex-col justify-between relative overflow-hidden pb-12">
      <VideoOverlay onCardShowTrigger={() => setCardVisible(true)} />
      <div className="relative z-30">
        <Header title="Artisan Registration" backTo="onboarding" />
        <OfflineBanner onRetry={handleSubmitSignup} />
      </div>

      <div id="recaptcha-container"></div>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 relative z-20">
        <div 
          className="bg-white/55 backdrop-blur-[6px] p-8 rounded-[18px] transition-all duration-800 ease-in-out space-y-6"
          style={{
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.18)',
            opacity: cardVisible ? 1 : 0,
            pointerEvents: cardVisible ? 'auto' : 'none',
            transform: cardVisible ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          <div className="flex flex-col items-center mb-2">
            <div className="mb-2">
              <ArtivaLogo size="md" showWordmark={false} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#1f1f1f] uppercase tracking-wider mb-2">
              <span>Step {step} of 4</span>
              <span className="text-[#16858F]">
                {step === 1 ? 'Contact Info' : step === 2 ? 'Verify Phone' : step === 3 ? 'Trade & Bio' : 'ID & Verification'}
              </span>
            </div>
            <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden border border-white/50">
              <div
                className="h-full bg-[#16858F] transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50/80 border border-red-200 text-red-800 text-xs font-semibold rounded-xl text-left">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in text-left">
              <h2 className="text-[22px] font-bold text-[#1f1f1f] mb-2">Contact Information</h2>
              
              <div className="flex gap-3 mb-2">
                <button 
                  type="button"
                  onClick={() => showToast('Apple login coming soon (MVP currently supports Phone Auth only)', 'info')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1f1f1f] hover:bg-black text-white text-[13px] font-bold rounded-xl transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V15.39h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 3.39h-2.33v6.488C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" display="none"/><path d="M16.636 12.008c0-3.033 2.47-4.49 2.584-4.568-1.423-2.083-3.626-2.368-4.407-2.4-1.879-.191-3.676 1.106-4.636 1.106-.962 0-2.441-1.077-3.987-1.047-2.016.03-3.882 1.171-4.918 2.975-2.093 3.625-.536 8.988 1.503 11.936 1.004 1.442 2.183 3.06 3.743 3.003 1.498-.059 2.062-.969 3.864-.969 1.796 0 2.308.97 3.867.94 1.603-.027 2.61-1.465 3.593-2.923 1.144-1.677 1.614-3.3 1.637-3.385-.035-.015-3.178-1.218-3.178-4.664M11.979 4.398c.816-1.004 1.365-2.404 1.215-3.805-1.205.048-2.673.811-3.518 1.815-.758.88-1.421 2.3-1.245 3.68 1.346.104 2.73-.708 3.548-1.69" /></svg>
                  Apple
                </button>
                <button 
                  type="button"
                  onClick={() => showToast('Google login coming soon (MVP currently supports Phone Auth only)', 'info')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-50 text-[#1f1f1f] text-[13px] font-bold rounded-xl transition-all shadow-sm border border-[#e0e0e0]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-[#e0e0e0] flex-1"></div>
                <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider">or sign up with phone</span>
                <div className="h-px bg-[#e0e0e0] flex-1"></div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  autoComplete="given-name"
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Phone Number</label>
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
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Primary Estate</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                >
                  {TARGET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className="w-full p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px mt-1.5 flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-[18px] animate-fade-in text-left">
              <div className="mb-4">
                <h2 className="text-[22px] font-bold text-[#1f1f1f] mb-1">Verify Phone</h2>
                <p className="text-[13px] text-[#6b6b6b]">We sent a 6-digit OTP code to your phone.</p>
              </div>

              <div>
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
                  className="hover:text-[#1f1f1f] transition-colors font-semibold"
                >
                  Change Number
                </button>
                {timer > 0 ? (
                  <span>Resend code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
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
                    <span>Verify Phone</span>
                    <KeyRound className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-left">
              <h2 className="text-[22px] font-bold text-[#1f1f1f] mb-2">Select Main Trade & Tagline</h2>
              
              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Trade Category</label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                >
                  {ALL_TRADES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Specific Services (Select Multiple)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableServices.map((svc) => (
                    <button
                      key={svc}
                      type="button"
                      onClick={() => toggleService(svc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        selectedServices.includes(svc)
                          ? 'bg-[#16858F] text-white border-[#16858F] shadow-sm'
                          : 'bg-white/40 text-[#444] border-white/50 hover:bg-white/60'
                      }`}
                    >
                      {svc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Professional Tagline / Bio</label>
                <textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Expert plumber with 5 years experience handling leaks and installations."
                  rows={3}
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 p-[14px] text-[15px] border border-[#e0e0e0] bg-[#fafafa] text-[#6b6b6b] hover:text-[#1f1f1f] font-bold rounded-[10px] transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-2/3 p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)]"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmitSignup} className="space-y-5 animate-fade-in text-left">
              <div>
                <h2 className="text-[22px] font-bold text-[#1f1f1f] mb-1">Verification</h2>
                <p className="text-xs text-[#6b6b6b]">Upload an ID and work samples to become a verified artisan.</p>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-2 uppercase">Upload Valid ID</label>
                <label className="h-28 rounded-2xl border-2 border-dashed border-[#16858F] flex flex-col items-center justify-center p-2 text-center text-[#16858F] bg-white/40 cursor-pointer hover:bg-white/60 transition-colors">
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setIdPhoto(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {idPhoto ? (
                    <img src={idPhoto} alt="ID Preview" className="h-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Tap to Upload ID</span>
                    </>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">NIN Number</label>
                <input
                  type="text"
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                  placeholder="11-digit NIN"
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25 tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-2 uppercase">Work Photos</label>
                <div className="grid grid-cols-2 gap-3">
                  {workPhotos.map((url, i) => (
                    <img key={i} src={url} alt="Work sample" className="w-full h-28 object-cover rounded-[10px] border border-[#e0e0e0]" />
                  ))}
                  <label className="h-28 rounded-[10px] border-2 border-dashed border-white flex flex-col items-center justify-center p-2 text-center text-[#6b6b6b] bg-white/40 cursor-pointer hover:bg-white/60">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                      const files = Array.from(e.target.files);
                      files.forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => setWorkPhotos(prev => [...prev, reader.result]);
                        reader.readAsDataURL(file);
                      });
                    }} />
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Add Photo</span>
                  </label>
                </div>
              </div>

              <div 
                onClick={() => setNdprConsent(!ndprConsent)}
                className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-white/30 transition-colors text-left border border-transparent hover:border-[#e0e0e0]"
              >
                <div className="flex items-center justify-center h-5 mt-0.5">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${ndprConsent ? 'bg-[#16858F] border-[#16858F]' : 'bg-[#fafafa] border-[#e0e0e0]'}`}>
                    {ndprConsent && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#444] leading-tight">
                    NDPR Consent & Terms
                  </p>
                  <p className="text-[12px] text-[#6b6b6b] leading-tight mt-1">
                    I agree to Artiva's Terms and Privacy Policy. I consent to the processing of my NIN and ID for verification.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/3 p-[14px] text-[15px] border border-[#e0e0e0] bg-[#fafafa] text-[#6b6b6b] hover:text-[#1f1f1f] font-bold rounded-[10px] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Submit</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

    </div>
  );
}
