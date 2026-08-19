import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { ShieldCheck, UserCheck, Users, Briefcase, DollarSign, Activity } from 'lucide-react';

export function AdminDashboardScreen() {
  const { navigateTo } = useApp();

  // Placeholder metrics, could be fetched from an Admin API later
  const metrics = [
    { title: 'Total Artisans', value: '45', icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
    { title: 'Active Jobs', value: '12', icon: <Briefcase className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-100' },
    { title: 'Total Escrow', value: '₦125,000', icon: <DollarSign className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100' },
    { title: 'System Health', value: '99.9%', icon: <Activity className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Admin Dashboard" backTo="home" />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-slate-900 to-[#0E3B40] text-white p-6 rounded-3xl shadow-card space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-['Outfit']">System Overview</h1>
              <p className="text-xs text-slate-300">Life Camp, Abuja — Operations Center</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-24">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{metric.title}</span>
                <div className={`w-8 h-8 rounded-full ${metric.bg} flex items-center justify-center`}>
                  {metric.icon}
                </div>
              </div>
              <span className="text-xl font-bold text-[#0E3B40] font-['Outfit']">{metric.value}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-[#0E3B40] px-1">Quick Actions</h2>
          
          <button
            onClick={() => navigateTo('admin_queue')}
            className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-500 transition-colors btn-press text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-[#0E3B40] text-sm">Verification Queue</h3>
              <p className="text-xs text-slate-500 mt-0.5">Review and approve pending artisan profiles (NIN & IDs).</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('admin_add_artisan')}
            className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-500 transition-colors btn-press text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-[#0E3B40] text-sm">Add Artisan Manually</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bypass OTP and directly register a verified artisan.</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
