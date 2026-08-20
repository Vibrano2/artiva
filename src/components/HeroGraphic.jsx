import React from 'react';
import { Hammer, Paintbrush, Zap, Wrench, Bath, Droplets } from 'lucide-react';
import { ArtivaLogo } from './ArtivaLogo';

export function HeroGraphic() {
  const icons = [
    { Icon: Droplets, top: '19%', left: '19%', floatDelay: '0s', popDelay: '0s' },
    { Icon: Hammer, top: '19%', left: '81%', floatDelay: '1.2s', popDelay: '0.15s' },
    { Icon: Paintbrush, top: '50%', left: '93.75%', floatDelay: '2.4s', popDelay: '0.3s' },
    { Icon: Bath, top: '81%', left: '81%', floatDelay: '3.6s', popDelay: '0.45s' },
    { Icon: Wrench, top: '81%', left: '19%', floatDelay: '4.8s', popDelay: '0.6s' },
    { Icon: Zap, top: '50%', left: '6.25%', floatDelay: '6s', popDelay: '0.75s' },
  ];

  return (
    <div className="relative w-full h-[360px] flex items-center justify-center my-4 select-none">
      <div className="absolute w-[320px] h-[320px] flex items-center justify-center">
        <div className="hero-brand-atmosphere opacity-0 animate-[fadeIn_1s_ease-out_forwards]" />
        
        <div className="absolute w-[280px] h-[280px] rounded-full border-[1.5px] border-dashed border-[#16D4C6]/30 animate-spin-slow opacity-0 animate-[fadeIn_1s_ease-out_0.2s_forwards]" />
        
        <div className="absolute w-[180px] h-[180px] rounded-full border border-[#16858F]/30 animate-spin-reverse-slow opacity-0 animate-[fadeIn_1s_ease-out_0.4s_forwards]" />

        <div className="relative z-10 w-28 h-28 rounded-full bg-gradient-to-tr from-[#06151F] to-[#0E3B40] flex items-center justify-center shadow-[0_0_60px_rgba(22,133,143,0.35)] border border-[#16858F]/50 opacity-0 animate-[fadeIn_0.5s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards] scale-[0.9] hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 rounded-full bg-[#16D4C6]/10 blur-md -z-10" />
          <ArtivaLogo size="xl" showWordmark={false} lightMode={true} />
        </div>

        {icons.map((item, index) => {
          const { Icon, top, left, floatDelay, popDelay } = item;
          return (
            <div 
              key={index}
              className="absolute z-20 w-11 h-11 -ml-[22px] -mt-[22px] opacity-0"
              style={{ 
                top, 
                left, 
                animation: `fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) calc(0.8s + ${popDelay}) forwards`
              }}
            >
              <div 
                className="w-full h-full bg-[#091D21] border border-[#16858F]/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(22,133,143,0.4)] transition-all hover:scale-110 hover:shadow-[#16D4C6]/40 hover:bg-[#16858F]/20 cursor-pointer"
                style={{ animation: `float 5s ease-in-out ${floatDelay} infinite` }}
              >
                <Icon className="w-5 h-5 text-white/90 drop-shadow-md" strokeWidth={1.5} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
