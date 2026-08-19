import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService, ALL_TRADES, TARGET_LOCATIONS, TradeServicesMap } from '../services';
import { OfflineBanner } from '../components/OfflineBanner';
import { Wrench, ShieldCheck, ArrowRight, Upload, Phone, FileText } from 'lucide-react';
import { VideoOverlay } from '../components/VideoOverlay';

export function ArtisanSignupScreen() {
  const { navigateTo, setCurrentUser, setUserRole, showToast, currentUser } = useApp();

  const [step, setStep] = useState(1);
  const [cardVisible, setCardVisible] = useState(false);
  
  const [firstName, setFirstName] = useState(currentUser?.first_name || currentUser?.displayName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || currentUser?.displayName?.split(' ').slice(1).join(' ') || '');
  const [phone, setPhone] = useState(currentUser?.phoneNumber || '');
  const [trade, setTrade] = useState(ALL_TRADES[0]);
  const [location, setLocation] = useState(TARGET_LOCATIONS[0]);
  const [tagline, setTagline] = useState('');
  const [workPhotos, setWorkPhotos] = useState([
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&q=80'
  ]);
  const [idPhoto, setIdPhoto] = useState('');
  const [nin, setNin] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
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

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!firstName.trim()) return setError('Please provide your first name.');
      if (!lastName.trim()) return setError('Please provide your last name.');
      if (!phone.trim()) return setError('Please provide your phone number.');
    }
    if (step === 2 && !tagline) {
      setError('Please provide a short tagline or bio.');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    if (!nin || nin.length !== 11) {
      setError('Please provide a valid 11-digit NIN.');
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
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#1f1f1f] uppercase tracking-wider mb-2">
              <span>Step {step} of 3</span>
              <span className="text-[#16858F]">
                {step === 1 ? 'Contact Info' : step === 2 ? 'Trade & Bio' : 'Verification'}
              </span>
            </div>
            <div className="w-full h-2 bg-white/40 rounded-full overflow-hidden border border-white/50">
              <div
                className="h-full bg-[#16858F] transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
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
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5 uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 803 000 0000"
                  className="w-full p-[13px_14px] text-[15px] text-[#222] border-[1.5px] border-[#e0e0e0] rounded-[10px] outline-none bg-[#fafafa] transition-all focus:border-[#16858F] focus:bg-white focus:ring-4 focus:ring-[#16858F]/25"
                />
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
                className="w-full p-[14px] text-[15px] font-bold text-white bg-[#16858F] border-none rounded-[10px] cursor-pointer transition-all hover:bg-[#0E5C63] active:translate-y-px mt-1.5 flex justify-center items-center gap-2 shadow-[0_4px_10px_rgba(22,133,143,0.3)]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
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

          {step === 3 && (
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

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
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
