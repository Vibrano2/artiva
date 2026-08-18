import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useApp } from '../context/AppContext';
import { AlertCircle, ArrowLeft, Home, Search } from 'lucide-react';

export function NotFoundPage() {
  const { navigateTo } = useApp();

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-[#E8F5F6] border border-[#16858F]/20 text-[#16858F] flex items-center justify-center mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 stroke-[2]" />
        </div>

        <span className="text-xs font-bold text-[#16858F] uppercase tracking-widest bg-[#E8F5F6] px-3 py-1 rounded-full mb-3">
          Error 404
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0E3B40] font-['Outfit'] mb-3">
          Page Not Found
        </h1>

        <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
          <button
            onClick={() => navigateTo('home')}
            className="w-full py-3.5 bg-[#16858F] hover:bg-[#0E5C63] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <button
            onClick={() => navigateTo('find_artisans')}
            className="w-full py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all btn-press"
          >
            <Search className="w-4 h-4 text-[#16858F]" />
            <span>Find Artisans</span>
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
