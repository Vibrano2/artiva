import React, { useEffect, useState } from 'react';
import { Activity, Briefcase, DollarSign, FileText, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

export function AdminDashboardScreen() {
  const { navigateTo, showToast } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getAdminStats();
      setStats(response.data);
    } catch (error) {
      showToast(error.message || 'Admin metrics could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const metrics = [
    ['Total artisans', stats?.total_artisans, Users],
    ['Active jobs', stats?.active_jobs, Briefcase],
    ['Escrow held', stats ? `₦${Number(stats.total_escrow_held).toLocaleString()}` : null, DollarSign],
    ['Revenue', stats ? `₦${Number(stats.revenue).toLocaleString()}` : null, Activity],
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Admin dashboard" backTo="home" />
      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        <div className="bg-slate-900 text-white p-6 rounded-3xl flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <div><h1 className="text-xl font-bold">Operations</h1><p className="text-xs text-slate-300">Server-authorized administrative access</p></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(([label, value, Icon]) => (
            <div key={label} className="bg-white p-4 rounded-2xl border border-slate-200 min-h-24">
              <Icon className="w-5 h-5 text-[#16858F]" />
              <p className="text-xs text-slate-500 mt-2">{label}</p>
              <p className="font-extrabold text-[#0E3B40]">{loading || value == null ? 'Loading…' : value}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => navigateTo('admin_queue')} className="w-full bg-white p-5 rounded-2xl border border-slate-200 text-left flex gap-3">
          <UserCheck className="w-6 h-6 text-purple-600" /><span><strong className="block text-[#0E3B40]">Verification queue</strong><small className="text-slate-500">Review submitted identity evidence.</small></span>
        </button>
        <button type="button" onClick={() => navigateTo('admin_proforma')} className="w-full bg-white p-5 rounded-2xl border border-slate-200 text-left flex gap-3">
          <FileText className="w-6 h-6 text-amber-600" /><span><strong className="block text-[#0E3B40]">Proforma queue</strong><small className="text-slate-500">Review supplier invoices and payout recipients.</small></span>
        </button>
      </main>
    </div>
  );
}
