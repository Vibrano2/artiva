import React from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Star, MapPin, CheckCircle, Award, ArrowRight, Clock } from 'lucide-react';

export function ClientArtisanProfileScreen({ artisan, job }) {
  const { navigateTo, setActiveArtisan, setActiveJob } = useApp();

  if (!artisan) {
    return (
      <div className="min-h-screen bg-[#F4F8F8] pb-12 flex flex-col">
        <Header title="Artisan Profile" backTo="match_list" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Artisan details not found.</p>
        </div>
      </div>
    );
  }

  const handleMatchNow = () => {
    setActiveArtisan(artisan);
    if (job) setActiveJob(job);
    navigateTo('checkout');
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-24">
      <Header title="Artisan Profile" backTo="match_list" />

      <main className="max-w-md mx-auto">
        {/* Hero Profile Section */}
        <div className="bg-white px-4 pt-6 pb-6 border-b border-slate-100 space-y-4">
          <div className="flex gap-4">
            <div className="relative">
              <img
                src={artisan.work_photos?.[0] || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=200&q=80'}
                alt={`${artisan.first_name} ${artisan.last_name}`}
                className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-100 shadow-sm"
              />
              {artisan.verified && (
                <span className="absolute -bottom-2 -right-2 bg-[#16858F] text-white p-1 rounded-full ring-4 ring-white" title="Verified Artisan">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              )}
            </div>

            <div className="flex-1 pt-2">
              <h1 className="font-extrabold text-[#0E3B40] text-2xl font-['Outfit'] leading-tight">
                {artisan.first_name} {artisan.last_name}
              </h1>
              <p className="text-sm text-[#16858F] font-bold mt-0.5">{artisan.trade}</p>
              
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{artisan.location}</span>
              </div>
            </div>
          </div>

          {artisan.tagline && (
            <p className="text-sm text-slate-600 italic border-l-2 border-[#16858F] pl-3 py-1">
              "{artisan.tagline}"
            </p>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="font-bold text-[#0E3B40] text-sm">{artisan.reputation_score || 'New'}</p>
              <p className="text-[10px] text-slate-500 font-medium">Rating</p>
            </div>
            
            <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-[#16858F] mb-1">
                <Award className="w-4 h-4" />
              </div>
              <p className="font-bold text-[#0E3B40] text-sm">{artisan.completed_jobs || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium">Jobs Done</p>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <p className="font-bold text-[#0E3B40] text-sm">&lt; 15m</p>
              <p className="text-[10px] text-slate-500 font-medium">Response</p>
            </div>
          </div>
        </div>

        {/* Services & Skills */}
        <div className="p-4 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-[#0E3B40] text-base font-['Outfit']">Specialized Services</h3>
            <div className="flex flex-wrap gap-2">
              {(artisan.services || []).map((service, index) => (
                <span key={index} className="px-3 py-1.5 bg-[#E8F5F6] text-[#16858F] text-xs font-bold rounded-xl flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {service}
                </span>
              ))}
              {(!artisan.services || artisan.services.length === 0) && (
                <p className="text-sm text-slate-500">General {artisan.trade} services.</p>
              )}
            </div>
          </div>

          {/* Work Gallery */}
          {(artisan.work_photos && artisan.work_photos.length > 0) && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-bold text-[#0E3B40] text-base font-['Outfit']">Work Gallery</h3>
              <div className="grid grid-cols-2 gap-2">
                {artisan.work_photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Work sample ${index + 1}`}
                    className="w-full h-32 object-cover rounded-2xl border border-slate-100"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Match Fee</p>
            <p className="font-extrabold text-[#0E3B40] text-xl font-['Outfit']">₦500</p>
          </div>
          
          <button
            onClick={handleMatchNow}
            className="flex-1 py-4 bg-[#16858F] hover:bg-[#0E5C63] text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press touch-target"
          >
            <span>Match Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
