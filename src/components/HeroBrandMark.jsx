import React from 'react';
import { Star, ShieldCheck, LockKeyhole, Hammer } from 'lucide-react';

export function HeroBrandMark() {
  return (
    <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center animate-fade-in-slow">
      <div className="absolute inset-0 bg-[#16858F]/10 blur-[60px] rounded-full" aria-hidden="true" />
      <div className="absolute inset-[15%] bg-[#16D4C6]/10 blur-[40px] rounded-full" aria-hidden="true" />
      
      <div className="absolute inset-[10%] rounded-full border border-white/5 animate-spin-slow" style={{ animationDuration: '40s' }} />
      <div className="absolute inset-[25%] rounded-full border border-white/10 animate-spin-reverse-slow" style={{ animationDuration: '30s' }} />

      <div className="absolute top-[12%] left-[5%] z-20 animate-float-delayed bg-[#06151F]/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-[#FAB804]/20 flex items-center justify-center">
          <Star className="w-5 h-5 text-[#FAB804] fill-[#FAB804]" />
        </div>
        <div>
          <p className="text-white text-sm font-bold font-sans">5.0 Rating</p>
          <p className="text-muted text-[10px] uppercase tracking-wider font-semibold">Top Artisan</p>
        </div>
      </div>

      <div className="absolute bottom-[20%] right-[2%] z-20 animate-float bg-[#06151F]/60 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-[#16858F]/20 flex items-center justify-center">
          <LockKeyhole className="w-5 h-5 text-[#16D4C6]" />
        </div>
        <div>
          <p className="text-white text-sm font-bold font-sans">Escrow Locked</p>
          <p className="text-muted text-[10px] uppercase tracking-wider font-semibold">100% Secured</p>
        </div>
      </div>

      <div className="absolute bottom-[5%] left-[8%] z-20 animate-float-more-delayed bg-[#06151F]/60 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?auto=format&fit=crop&w=150&q=80" 
          alt="Artisan" 
          className="w-11 h-11 rounded-full object-cover border-2 border-[#16858F]"
        />
        <div className="pr-2">
          <p className="text-white text-sm font-bold font-sans">Sunday O.</p>
          <p className="text-[#16D4C6] text-[11px] font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Verified Plumber
          </p>
        </div>
      </div>

      <div className="relative z-10 w-[55%] h-[55%] bg-gradient-to-tr from-[#16858F]/20 to-[#16D4C6]/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-[0_0_80px_rgba(22,212,198,0.2)]">
        <div className="w-[65%] h-[65%] bg-gradient-to-tr from-[#0E3B40] to-[#16858F] rounded-full flex items-center justify-center shadow-inner relative overflow-hidden">
          <Hammer className="w-16 h-16 text-white drop-shadow-md z-10" strokeWidth={1.5} />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
