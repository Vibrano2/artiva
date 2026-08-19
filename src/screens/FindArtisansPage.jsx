import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApp } from '../context/AppContext';
import { ApiService, TradeServicesMap, LifeCampLocations } from '../services';
import { ArtisanCard } from '../components/ArtisanCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { Search, MapPin, Filter, Wrench, ShieldCheck, RefreshCw } from 'lucide-react';

export function FindArtisansPage() {
  const { navigateTo } = useApp();

  const [selectedTrade, setSelectedTrade] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  const trades = ['All', ...Object.keys(TradeServicesMap)];
  const locations = ['All', ...LifeCampLocations];

  useEffect(() => {
    handleSearch();
  }, [selectedTrade, selectedLocation, availableOnly]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filter = {};
      if (selectedTrade !== 'All') filter.trade = selectedTrade;
      if (availableOnly) filter.available = true;

      let list = await ApiService.getArtisans(filter);
      
      if (selectedLocation !== 'All') {
        list = list.filter(a => a.location.toLowerCase().includes(selectedLocation.toLowerCase()));
      }

      setArtisans(list);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
    }
  };

  const handleSelectArtisan = (artisan) => {
    navigateTo('post_job', { initialTrade: artisan.trade });
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col justify-between">
      <Navbar activeTab="find" />

      <main className="flex-1">
        <section className="bg-splash-radial text-white py-12 px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="max-w-4xl mx-auto space-y-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold font-['Outfit']">
              Find a trusted artisan for your job.
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto">
              Search verified local plumbers, electricians, and technicians in Life Camp by trade and area.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
          <div className="bg-white/90 backdrop-blur-2xl p-4 sm:p-5 rounded-[2rem] border border-white shadow-[0_20px_40px_-15px_rgba(22,133,143,0.15)] flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-2">
                  Trade Category
                </label>
                <div className="relative">
                  <select
                    value={selectedTrade}
                    onChange={(e) => setSelectedTrade(e.target.value)}
                    className="w-full p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0E3B40] focus:border-[#16858F] focus:ring-4 focus:ring-[#16858F]/10 transition-all appearance-none cursor-pointer outline-none"
                  >
                    {trades.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <Wrench className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="w-full sm:flex-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-2">
                  Location Area
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0E3B40] focus:border-[#16858F] focus:ring-4 focus:ring-[#16858F]/10 transition-all appearance-none cursor-pointer outline-none"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="w-full sm:w-[160px]">
                <button
                  type="button"
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`w-full h-[50px] rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                    availableOnly
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-inner'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span>{availableOnly ? 'Available Now' : 'Show All'}</span>
                </button>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  onClick={handleSearch}
                  className="w-full h-[50px] px-6 bg-gradient-to-r from-[#16858F] to-[#0E5C63] hover:from-[#0E5C63] hover:to-[#093e43] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-[#16858F]/30"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                  <span>Search</span>
                </button>
              </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0E3B40] font-['Outfit']">
              Verified Artisans ({artisans.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">NIN Identity Checked</span>
          </div>

          {loading ? (
            <SkeletonLoader type="card" count={6} />
          ) : artisans.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm max-w-md mx-auto">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0E3B40]">No matching artisans found</h3>
                <p className="text-xs text-slate-500">Try selecting "All" categories or expanding your location search.</p>
              </div>
              <button
                onClick={() => { setSelectedTrade('All'); setSelectedLocation('All'); setAvailableOnly(false); }}
                className="px-4 py-2.5 bg-[#16858F] text-white text-xs font-bold rounded-xl btn-press"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artisans.map((artisan) => (
                <ArtisanCard
                  key={artisan.uid}
                  artisan={artisan}
                  onSelect={handleSelectArtisan}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
