import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService, ALL_TRADES, TARGET_LOCATIONS } from '../services';

export function AdminAddArtisanScreen() {
  const { navigateTo, showToast } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    trade: ALL_TRADES[0],
    location: TARGET_LOCATIONS[0],
    tagline: '',
    hourly_rate: '2000'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const locationParts = formData.location.split('(');
      const city = locationParts[0].trim();
      const state = locationParts[1] ? locationParts[1].replace(')', '').trim() : city;
      
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        trade: formData.trade,
        location: {
          city,
          state,
          lga: city
        },
        tagline: formData.tagline || `${formData.trade} Expert`,
        hourly_rate: parseInt(formData.hourly_rate, 10) || 2000
      };

      await ApiService.addArtisan(payload);
      showToast('Artisan created and verified successfully!', 'success');
      navigateTo('admin_dash');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to add artisan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Inter',sans-serif]">
      <Header title="Add Artisan Manually" backTo="admin_dash" />

      <main className="flex-1 p-5 pb-24 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6">
          <p className="text-sm text-gray-500 mb-6">
            Use this form to instantly create a pre-verified Artisan account. The artisan will use this phone number to log in later.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5">First Name</label>
                <input
                  required
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Last Name</label>
                <input
                  required
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Phone Number</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
                placeholder="0803 123 4567"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Trade</label>
              <select
                value={formData.trade}
                onChange={(e) => setFormData({ ...formData, trade: e.target.value })}
                className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
              >
                {ALL_TRADES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
              >
                {TARGET_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Tagline</label>
              <input
                required
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
                placeholder="e.g. Expert Plumber with 10 years experience"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#444] mb-1.5">Hourly Rate (₦)</label>
              <input
                required
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                className="w-full p-3 text-[14px] rounded-xl border border-gray-200 outline-none focus:border-[#16858F] focus:ring-2 focus:ring-[#16858F]/20 bg-gray-50 focus:bg-white"
                placeholder="2000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-[15px] rounded-[14px] font-bold text-[15px] text-white transition-all ${
                loading ? 'bg-[#16858F]/70 cursor-not-allowed' : 'bg-[#16858F] hover:bg-[#116d76] shadow-[0_4px_12px_rgba(22,133,143,0.25)]'
              }`}
            >
              {loading ? 'Creating Artisan...' : 'Create Verified Artisan'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
