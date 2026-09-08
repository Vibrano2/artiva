import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

const STATUS_COPY = {
  awaiting_departure: ['Awaiting departure', 'The artisan has not marked the journey as started.'],
  en_route: ['On the way', 'The artisan has marked the journey as started.'],
  arrived: ['Arrived', 'The artisan has marked arrival at the job location.'],
};

export function LiveTrackingScreen() {
  const { currentUser, navigateTo, activeJob, activeArtisan, showToast } = useApp();
  const [status, setStatus] = useState(activeJob?.tracking_state || 'awaiting_departure');
  const [loading, setLoading] = useState(false);
  const isArtisan = currentUser?.role === 'artisan';

  useEffect(() => {
    if (!activeJob?.job_id) return undefined;
    return ApiService.subscribeToTracking(activeJob.job_id, ({ status: nextStatus }) => {
      setStatus(nextStatus);
    });
  }, [activeJob?.job_id]);

  const updateStatus = async (nextStatus) => {
    setLoading(true);
    try {
      if (!activeJob?.job_id) throw new Error('A valid job is required.');
      if (nextStatus === 'en_route') await ApiService.startTracking(activeJob.job_id);
      if (nextStatus === 'arrived') await ApiService.arriveTracking(activeJob.job_id);
      setStatus(nextStatus);
      showToast(nextStatus === 'arrived' ? 'Arrival recorded.' : 'Journey status updated.', 'success');
    } catch (error) {
      showToast(error.message || 'Status could not be updated.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [title, description] = STATUS_COPY[status] || STATUS_COPY.awaiting_departure;
  const StatusIcon = status === 'arrived' ? CheckCircle2 : status === 'en_route' ? Navigation : Clock3;

  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <Header title="Arrival status" backTo={isArtisan ? 'artisan_dash' : 'client_dash'} />
      <main className="max-w-md mx-auto px-4 py-10">
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#E8F5F6] text-[#16858F] flex items-center justify-center mx-auto">
            <StatusIcon className="w-8 h-8" />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Current status</p>
            <h1 className="text-2xl font-extrabold text-[#0E3B40] mt-1">{title}</h1>
            <p className="text-sm text-slate-500 mt-2">{description}</p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
            <MapPin className="w-5 h-5 text-[#16858F]" />
            <div>
              <p className="text-sm font-bold text-[#0E3B40]">{activeJob?.location || 'Job location'}</p>
              <p className="text-xs text-slate-500">Precise GPS sharing is not enabled.</p>
            </div>
          </div>

          {isArtisan && status === 'awaiting_departure' && (
            <button type="button" disabled={loading} onClick={() => updateStatus('en_route')} className="w-full py-3.5 rounded-2xl bg-[#16858F] text-white font-bold disabled:opacity-50">
              Mark journey started
            </button>
          )}
          {isArtisan && status === 'en_route' && (
            <button type="button" disabled={loading} onClick={() => updateStatus('arrived')} className="w-full py-3.5 rounded-2xl bg-emerald-700 text-white font-bold disabled:opacity-50">
              Mark arrived
            </button>
          )}

          <button type="button" onClick={() => navigateTo('chat_screen', { job: activeJob, artisan: activeArtisan })} className="w-full py-3.5 rounded-2xl bg-slate-100 text-[#0E3B40] font-bold flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Open chat
          </button>
        </section>
      </main>
    </div>
  );
}
