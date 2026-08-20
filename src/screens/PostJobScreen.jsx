import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService, ALL_TRADES, TARGET_LOCATIONS } from '../services';
import { OfflineBanner } from '../components/OfflineBanner';
import { Wrench, MapPin, Clock, DollarSign, Image, ArrowRight, ShieldCheck } from 'lucide-react';

export function PostJobScreen({ initialTrade = 'Plumbing' }) {
  const { navigateTo, currentUser, showToast } = useApp();

  const [trade, setTrade] = useState(initialTrade);
  const [location, setLocation] = useState(TARGET_LOCATIONS[0]);
  const [urgency, setUrgency] = useState('Today');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const trades = ALL_TRADES;

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 5) {
      setError('Please enter a short description of what needs repair.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await ApiService.postJob({
        trade,
        location,
        urgency,
        description,
        photos,
        client_uid: currentUser?.uid || 'user_demo_client'
      });

      setLoading(false);
      showToast('Job request posted successfully!', 'success');
      navigateTo('match_list', { job: res.job });
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Post a Job Request" backTo="client_dash" />
      <OfflineBanner onRetry={handleSubmitJob} />

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card animate-fade-in space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F5F6] text-[#16858F] flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-['Outfit'] text-[#0E3B40]">
                Describe What You Need Done
              </h1>
              <p className="text-xs text-slate-500">Takes less than 60 seconds • Matched instantly</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitJob} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                1. Select Trade
              </label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-[#0E3B40] focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 focus:outline-none"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                2. Location
              </label>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3.5 pl-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-[#0E3B40] focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 focus:outline-none"
                >
                  {TARGET_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-[#16858F] absolute left-3.5 top-4 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                3. Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Today', 'This Week', 'Flexible'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      urgency === u
                        ? 'bg-[#16858F] text-white border-[#16858F] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-2">
                4. Job Details / Issue Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Water leak under kitchen sink in Life Camp flat. Needs urgent pipe repair."
                rows={3}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-[#0E3B40] focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#16858F] hover:bg-[#0E5C63] text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press touch-target disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Find Matched Artisans</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
