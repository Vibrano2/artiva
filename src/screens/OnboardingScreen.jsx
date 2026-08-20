import React, { useState } from 'react';

import { useApp } from '../context/AppContext';
import { HeroGraphic } from '../components/HeroGraphic';
import { ShieldCheck, Lock, MessageSquare, ArrowRight, UserCheck, Wrench, ShieldAlert } from 'lucide-react';

export function OnboardingScreen() {
  const { navigateTo, setUserRole } = useApp();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-[#FAB804]" />,
      title: "Verified Life Camp Artisans",
      desc: "Every artisan undergoes NIN identity verification and skill checks before entering your home."
    },
    {
      icon: <Lock className="w-12 h-12 text-[#FAB804]" />,
      title: "Protected Escrow Payments",
      desc: "Your match fee and job funds are held securely until you confirm the job is 100% completed."
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-[#FAB804]" />,
      title: "Direct In-App Communication",
      desc: "Chat instantly with your matched artisan inside Artiva. No external phone numbers needed."
    }
  ];

  const handleStartClient = () => {
    setUserRole('client');
    navigateTo('signup');
  };

  const handleStartArtisan = () => {
    setUserRole('artisan');
    navigateTo('artisan_signup');
  };

  const handleStartAdmin = () => {
    setUserRole('admin');
    navigateTo('admin_queue');
  };

  return (
    <div className="min-h-screen bg-[#06151F] text-white flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#16858F]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#16D4C6]/10 blur-[100px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-20 py-12 md:py-20 z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <div className="flex flex-col items-start text-left animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-[64px] font-extrabold font-sans leading-[1.1] mb-6 tracking-tight">
              Get quality work<br />
              done by <span className="text-[#16D4C6]">trusted<br className="hidden lg:block"/> artisans.</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-300 mb-10 max-w-lg leading-relaxed font-sans">
              Artiva connects you with verified, skilled, and reliable artisans for any job — fast, secure, and hassle-free.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
              <button
                onClick={handleStartClient}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#16858F] to-[#2DA5B0] hover:to-[#16D4C6] text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(22,133,143,0.4)] transition-all btn-press touch-target"
              >
                Find an Artisan <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleStartArtisan}
                className="w-full sm:w-auto px-8 py-3.5 bg-transparent border border-slate-600 hover:border-slate-400 hover:bg-white/5 text-white font-semibold rounded-lg flex items-center justify-center gap-3 transition-all btn-press touch-target"
              >
                <div className="w-5 h-5 text-[#FAB804] flex items-center justify-center">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                     <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"></path>
                     <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"></path>
                     <path d="M4 15v-3a6 6 0 0 1 6-6h0"></path>
                     <path d="M14 6h0a6 6 0 0 1 6 6v3"></path>
                   </svg>
                </div>
                I'm an Artisan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800 w-full max-w-2xl font-sans">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#16858F] mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Verified Artisans</span>
                  <span className="text-xs text-slate-400">Background checked</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#16858F] mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Secure Payments</span>
                  <span className="text-xs text-slate-400">Escrow protected</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#16858F] mt-0.5 shrink-0">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Fair Pricing</span>
                  <span className="text-xs text-slate-400">No hidden fees</span>
                </div>
              </div>
            </div>


          </div>

          <div className="w-full flex justify-center items-center lg:min-h-[500px] animate-fade-in-slow">
            <div className="transform scale-[1.1] sm:scale-[1.3] lg:scale-[1.6] origin-center">
              <HeroGraphic />
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-full text-center pb-8 opacity-80 animate-slide-up">
        <h3 className="text-lg font-semibold font-sans">How Artiva Works</h3>
      </div>
    </div>
  );
}
