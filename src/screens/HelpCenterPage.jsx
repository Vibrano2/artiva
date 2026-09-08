import React, { useState } from 'react';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { ArrowRight, ChevronDown, CircleHelp, Mail, ShieldCheck } from 'lucide-react';

const helpTopics = [
  {
    id: 'finding',
    title: 'Finding and hiring an artisan',
    description: 'How to browse profiles, compare quotes, and submit a job request.',
    details: 'You can explore artisans by trade (Plumbing, Electrical, Carpentry, AC Repair, Painting, Masonry) and location in Life Camp Abuja. Once you submit a job post with your requirements, Artiva matches you with proximity-ranked verified craftspeople ready to accept your request.'
  },
  {
    id: 'escrow',
    title: 'How pay-per-job escrow protection works',
    description: 'Learn when payments are held and how they are released after completion.',
    details: 'When you confirm a match, the payment is associated with that job. After the job is completed on-site and you confirm completion, Artiva submits the payout and records its final status from Paystack.'
  },
  {
    id: 'verification',
    title: 'Artisan identity and profile review',
    description: 'Understand the identity and profile checks required to join Artiva.',
    details: 'Before an artisan profile is made available, an administrator reviews the submitted identity document, NIN details, payout-account setup, and work samples. This is an identity and profile review, not a criminal background check.'
  },
  {
    id: 'tracking',
    title: 'Artisan arrival status',
    description: 'How journey and arrival updates work when an artisan is on the way.',
    details: 'The artisan can mark the journey as started and then mark arrival. Artiva displays these status updates but does not collect or show precise GPS location in this release.'
  },
  {
    id: 'issues',
    title: 'Disputes, cancellations & refunds',
    description: 'What happens if a job cannot be completed or needs resolution.',
    details: 'If an artisan cannot complete the job or there is a disagreement over scope, contact support before confirming completion. An eligible refund can be submitted after investigation, and its final status is confirmed by Paystack.'
  }
];

export function HelpCenterPage() {
  const { navigateTo } = useApp();
  const [expandedId, setExpandedId] = useState('finding');

  const toggleTopic = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <section className="bg-splash-radial text-white py-14 px-4 sm:px-6 lg:px-8 text-center">
          <CircleHelp className="w-8 h-8 text-[#16D4C6] mx-auto mb-3" strokeWidth={1.6} />
          <h1 className="text-2xl sm:text-4xl font-extrabold font-['Outfit']">Help Center & FAQs</h1>
          <p className="text-xs sm:text-sm text-slate-200 max-w-xl mx-auto mt-2">Helpful answers for clients and artisans using Artiva.</p>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <div className="space-y-3">
            {helpTopics.map((topic) => {
              const isExpanded = expandedId === topic.id;
              return (
                <div
                  key={topic.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <div>
                      <span className="block font-bold text-[#0E3B40] text-sm sm:text-base font-['Outfit']">{topic.title}</span>
                      <span className="block text-xs text-slate-500 mt-0.5">{topic.description}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#16858F] flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                      {topic.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-[#E8F5F6] border border-[#16858F]/20 rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#16858F] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#0E3B40] uppercase tracking-wider mb-1">Instant Account Access</h4>
              <p className="text-xs text-[#0E3B40] leading-relaxed">
                Need to access your active jobs? Sign in with your registered phone number to receive your secure SMS verification code.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-[#0E3B40] text-sm">Still have questions?</h4>
              <p className="text-xs text-slate-500">Contact the support team by email for assistance.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href="mailto:support@artiva.ng"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0E3B40] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Mail className="w-4 h-4 text-[#16858F]" />
                <span>Email Us</span>
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('find_artisans')}
            className="w-full py-3.5 bg-[#16858F] hover:bg-[#0E5C63] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press"
          >
            <span>Find an Artisan Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
