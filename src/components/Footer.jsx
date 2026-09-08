import React from 'react';
import { ArtivaLogo } from './ArtivaLogo';
import { useApp } from '../context/AppContext';
import { Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { navigateTo, setUserRole } = useApp();

  return (
    <footer className="bg-dark-footer text-muted border-t border-[#161f2d] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="cursor-pointer" onClick={() => navigateTo('home')}>
              <ArtivaLogo size="md" showWordmark={true} lightMode={true} />
            </div>
            <p className="text-[13px] text-muted max-w-sm leading-relaxed">
              Connecting you with reviewed artisan profiles for local service jobs in Abuja.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-sans">
              Quick Links
            </h4>
            <ul className="space-y-3 text-[13px] text-muted">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('find_artisans'); }} className="hover:text-white transition-colors">Find Artisans</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('how_it_works'); }} className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('become_artisan'); }} className="hover:text-white transition-colors">Become an Artisan</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('jobs_board'); }} className="hover:text-white transition-colors">Jobs</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('about_us'); }} className="hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-sans">
              For Artisans
            </h4>
            <ul className="space-y-3 text-[13px] text-muted">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('how_it_works'); }} className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('become_artisan'); }} className="hover:text-white transition-colors">Become an Artisan</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('help_center'); }} className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white font-sans">
              For Clients
            </h4>
            <ul className="space-y-3 text-[13px] text-muted">
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('how_it_works'); }} className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('safety'); }} className="hover:text-white transition-colors">Safety & Security</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo('help_center'); }} className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-semibold text-white font-sans">
              Contact Us
            </h4>
            <ul className="space-y-3 text-[13px] text-muted">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#16858F] flex-shrink-0" />
                <a href="mailto:support@artiva.ng" className="hover:text-white transition-colors">
                  support@artiva.ng
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#16858F] flex-shrink-0" />
                <span>Life Camp, Abuja, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#161f2d] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted">
          <p>© {new Date().getFullYear()} Artiva. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('terms'); }} className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('privacy'); }} className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setUserRole('client'); navigateTo('login'); }} className="hover:text-white transition-colors">Admin Login</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
