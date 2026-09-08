import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileText, KeyRound, RefreshCw, ShieldCheck, Upload } from 'lucide-react';
import { signInWithPhoneNumber } from 'firebase/auth';
import { Header } from '../components/Header';
import { OfflineBanner } from '../components/OfflineBanner';
import { useApp } from '../context/AppContext';
import { auth } from '../config/firebase';
import { ApiService, ALL_TRADES, TARGET_LOCATIONS, TradeServicesMap } from '../services';
import { formatAuthError, formatNigerianPhoneNumber, getOrCreateRecaptchaVerifier } from '../utils/authUtils';

const WORK_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ID_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function Field({ label, children }) {
  return <label className="block text-xs font-bold text-[#0E3B40]">{label}{children}</label>;
}

const inputClass = 'mt-2 w-full p-3 border border-slate-200 rounded-xl bg-white font-normal focus:outline-none focus:border-[#16858F]';

export function ArtisanSignupScreen() {
  const { currentUser, navigateTo, setCurrentUser, setUserRole, showToast } = useApp();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(currentUser?.first_name || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [experienceYears, setExperienceYears] = useState('');
  const [location, setLocation] = useState(TARGET_LOCATIONS[0]);
  const [trade, setTrade] = useState(ALL_TRADES[0]);
  const [services, setServices] = useState([]);
  const [tagline, setTagline] = useState('');
  const [nin, setNin] = useState('');
  const [idDocument, setIdDocument] = useState(null);
  const [workPhotos, setWorkPhotos] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const availableServices = TradeServicesMap[trade] || [];

  useEffect(() => () => window.clearInterval(timerRef.current), []);

  useEffect(() => {
    setServices((current) => current.filter((service) => availableServices.includes(service)));
  }, [trade]);

  useEffect(() => {
    if (step !== 4 || banks.length) return;
    ApiService.getBanks()
      .then(setBanks)
      .catch((loadError) => setError(loadError.message || 'Supported banks could not be loaded.'));
  }, [step, banks.length]);

  const startTimer = () => {
    window.clearInterval(timerRef.current);
    setTimer(30);
    timerRef.current = window.setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          window.clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setError('');
    const { formatted, isValid } = formatNigerianPhoneNumber(phone);
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Enter first and last names with at least two characters each.');
      return;
    }
    if (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 100) {
      setError('Enter valid years of experience from 0 to 100.');
      return;
    }
    if (!isValid) {
      setError('Enter a valid Nigerian phone number.');
      return;
    }

    setLoading(true);
    try {
      const verifier = getOrCreateRecaptchaVerifier('recaptcha-container', () => setError('Security check expired. Request a new code.'));
      const confirmation = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmationResult(confirmation);
      setPhone(formatted);
      setStep(2);
      startTimer();
      showToast('Firebase sent a verification code.', 'success');
    } catch (sendError) {
      setError(formatAuthError(sendError));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
        throw new Error('Request a new Firebase verification code before continuing.');
      }
      const credential = await confirmationResult.confirm(otp);
      const response = await ApiService.verifyFirebaseToken(await credential.user.getIdToken(), 'artisan');
      if (response.user?.role !== 'artisan') throw new Error('This account is not registered as an artisan.');
      setCurrentUser(response.user);
      setUserRole('artisan');
      setStep(3);
      showToast('Phone number verified.', 'success');
    } catch (verifyError) {
      setError(formatAuthError(verifyError));
    } finally {
      setLoading(false);
    }
  };

  const continueProfile = () => {
    setError('');
    if (!services.length) return setError('Select at least one service.');
    if (tagline.trim().length < 5) return setError('Write a professional tagline of at least five characters.');
    setStep(4);
  };

  const selectId = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ID_TYPES.has(file.type) || file.size > 10 * 1024 * 1024) {
      event.target.value = '';
      setIdDocument(null);
      setError('Identity document must be one JPEG, PNG, or PDF no larger than 10 MB.');
      return;
    }
    setError('');
    setIdDocument(file);
  };

  const selectWorkPhotos = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length < 3 || files.length > 5 || files.some((file) => !WORK_TYPES.has(file.type) || file.size > 5 * 1024 * 1024)) {
      event.target.value = '';
      setWorkPhotos([]);
      setError('Choose 3 to 5 JPEG, PNG, or WebP work photos, each no larger than 5 MB.');
      return;
    }
    setError('');
    setWorkPhotos(files);
  };

  const resolveAccount = async () => {
    setError('');
    setAccountName('');
    if (!/^\d{10}$/.test(accountNumber) || !/^\d{3,6}$/.test(bankCode)) {
      setError('Choose a bank and enter a 10-digit account number.');
      return;
    }
    setLoading(true);
    try {
      const account = await ApiService.resolveBankAccount(accountNumber, bankCode);
      if (!account.account_name) throw new Error('The provider did not return an account name.');
      setAccountName(account.account_name);
      showToast('Bank account verified.', 'success');
    } catch (resolveError) {
      setError(resolveError.message || 'Bank account could not be verified.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^\d{11}$/.test(nin)) return setError('Enter a valid 11-digit NIN.');
    if (!(idDocument instanceof File)) return setError('Upload a valid identity document.');
    if (workPhotos.length < 3 || workPhotos.length > 5) return setError('Upload 3 to 5 work photos.');
    if (!accountName) return setError('Verify the payout account before submitting.');
    if (!consent) return setError('Accept the Terms and Privacy Policy before submitting.');

    setLoading(true);
    try {
      await ApiService.signupArtisan({
        first_name: firstName,
        last_name: lastName,
        phone,
        experience_years: Number(experienceYears),
        trade,
        services,
        location,
        tagline,
        nin,
        id_document: idDocument,
        work_photos: workPhotos,
        bank_details: {
          account_name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });
      showToast('Profile submitted for verification.', 'success');
      navigateTo('artisan_pending');
    } catch (submitError) {
      setError(submitError.message || 'Registration could not be submitted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E3B40] pb-12">
      <Header title="Artisan registration" backTo="onboarding" />
      <OfflineBanner onRetry={step === 1 ? sendOtp : undefined} />
      <div id="recaptcha-container" />
      <main className="max-w-md mx-auto px-4 py-8">
        <section className="bg-white p-6 rounded-3xl shadow-card space-y-5">
          <div>
            <div className="flex justify-between text-xs font-bold uppercase"><span>Step {step} of 4</span><span className="text-[#16858F]">Secure onboarding</span></div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#16858F]" style={{ width: `${step * 25}%` }} /></div>
          </div>
          {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">{error}</p>}

          {step === 1 && <div className="space-y-4">
            <h1 className="text-xl font-extrabold text-[#0E3B40]">Contact details</h1>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name"><input value={firstName} onChange={(event) => setFirstName(event.target.value.slice(0, 80))} autoComplete="given-name" className={inputClass} /></Field>
              <Field label="Last name"><input value={lastName} onChange={(event) => setLastName(event.target.value.slice(0, 80))} autoComplete="family-name" className={inputClass} /></Field>
            </div>
            <Field label="Nigerian phone number"><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, '').slice(0, 14))} autoComplete="tel" className={inputClass} /></Field>
            <Field label="Years of experience"><input type="number" min="0" max="100" step="1" value={experienceYears} onChange={(event) => setExperienceYears(event.target.value)} className={inputClass} /></Field>
            <Field label="Primary location"><select value={location} onChange={(event) => setLocation(event.target.value)} className={inputClass}>{TARGET_LOCATIONS.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <button type="button" onClick={sendOtp} disabled={loading} className="w-full py-3.5 bg-[#16858F] text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">Send Firebase code <ArrowRight className="w-4 h-4" /></button>
          </div>}

          {step === 2 && <form onSubmit={verifyOtp} className="space-y-4">
            <h1 className="text-xl font-extrabold text-[#0E3B40]">Verify phone</h1>
            <p className="text-xs text-slate-500">Enter the six-digit SMS code sent by Firebase.</p>
            <input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" className={`${inputClass} text-center text-2xl tracking-[0.35em]`} />
            <div className="flex justify-between text-xs">
              <button type="button" onClick={() => setStep(1)} className="font-bold text-slate-600">Change number</button>
              {timer ? <span className="text-slate-500">Resend in {timer}s</span> : <button type="button" onClick={sendOtp} disabled={loading} className="font-bold text-[#16858F] flex gap-1"><RefreshCw className="w-3 h-3" /> Resend</button>}
            </div>
            <button type="submit" disabled={loading || otp.length !== 6} className="w-full py-3.5 bg-[#16858F] text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"><KeyRound className="w-4 h-4" /> Verify phone</button>
          </form>}

          {step === 3 && <div className="space-y-4">
            <h1 className="text-xl font-extrabold text-[#0E3B40]">Trade profile</h1>
            <Field label="Primary trade"><select value={trade} onChange={(event) => setTrade(event.target.value)} className={inputClass}>{ALL_TRADES.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <fieldset><legend className="text-xs font-bold text-[#0E3B40]">Services</legend><div className="flex flex-wrap gap-2 mt-2">{availableServices.map((service) => <button type="button" key={service} onClick={() => setServices((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service])} className={`px-3 py-2 rounded-full text-xs font-bold border ${services.includes(service) ? 'bg-[#16858F] text-white border-[#16858F]' : 'bg-white text-slate-600 border-slate-200'}`}>{service}</button>)}</div></fieldset>
            <Field label="Professional tagline"><textarea value={tagline} onChange={(event) => setTagline(event.target.value.slice(0, 100))} minLength={5} maxLength={100} rows={3} className={inputClass} /></Field>
            <div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="w-1/3 py-3.5 bg-slate-100 rounded-2xl font-bold">Back</button><button type="button" onClick={continueProfile} className="w-2/3 py-3.5 bg-[#16858F] text-white rounded-2xl font-bold">Continue</button></div>
          </div>}

          {step === 4 && <form onSubmit={submit} className="space-y-4">
            <h1 className="text-xl font-extrabold text-[#0E3B40]">Identity and payout</h1>
            <Field label="11-digit NIN"><input value={nin} onChange={(event) => setNin(event.target.value.replace(/\D/g, '').slice(0, 11))} inputMode="numeric" className={inputClass} /></Field>
            <label className="block p-4 border-2 border-dashed border-[#16858F] rounded-2xl text-center text-[#16858F] cursor-pointer"><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={selectId} className="hidden" />{idDocument ? <FileText className="w-5 h-5 mx-auto" /> : <Upload className="w-5 h-5 mx-auto" />}<span className="block text-xs font-bold mt-1">{idDocument?.name || 'Choose ID document'}</span></label>
            <label className="block p-4 border-2 border-dashed border-[#16858F] rounded-2xl text-center text-[#16858F] cursor-pointer"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectWorkPhotos} className="hidden" /><Upload className="w-5 h-5 mx-auto" /><span className="block text-xs font-bold mt-1">{workPhotos.length ? `${workPhotos.length} work photos selected` : 'Choose 3 to 5 work photos'}</span></label>
            <Field label="Bank"><select value={bankCode} onChange={(event) => { setBankCode(event.target.value); setAccountName(''); }} className={inputClass}><option value="">Choose a bank</option>{banks.map((bank) => <option key={bank.code} value={bank.code}>{bank.name}</option>)}</select></Field>
            <Field label="10-digit account number"><input value={accountNumber} onChange={(event) => { setAccountNumber(event.target.value.replace(/\D/g, '').slice(0, 10)); setAccountName(''); }} inputMode="numeric" className={inputClass} /></Field>
            <button type="button" onClick={resolveAccount} disabled={loading || !bankCode || accountNumber.length !== 10} className="w-full py-3 bg-slate-100 text-[#0E3B40] rounded-xl font-bold disabled:opacity-50">Verify payout account</button>
            {accountName && <p className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold"><ShieldCheck className="inline w-4 h-4 mr-1" /> {accountName}</p>}
            <label className="flex gap-3 text-xs text-slate-600"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" /><span>I accept the Terms and Privacy Policy and consent to identity and payout-account verification.</span></label>
            <div className="flex gap-2"><button type="button" onClick={() => setStep(3)} className="w-1/3 py-3.5 bg-slate-100 rounded-2xl font-bold">Back</button><button type="submit" disabled={loading} className="w-2/3 py-3.5 bg-[#16858F] text-white rounded-2xl font-bold disabled:opacity-50">{loading ? 'Submitting…' : 'Submit for review'}</button></div>
          </form>}
        </section>
      </main>
    </div>
  );
}
