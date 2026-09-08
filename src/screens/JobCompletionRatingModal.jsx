import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Star } from 'lucide-react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';

export function JobCompletionRatingModal({ job, artisan }) {
  const { navigateTo, activeJob, activeArtisan, activeMatchId, showToast } = useApp();
  const targetJob = job || activeJob;
  const targetArtisan = artisan || activeArtisan;
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');

  const submitCompletion = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!targetJob?.job_id) throw new Error('A valid job is required.');
      await ApiService.completeJob(targetJob.job_id, {
        match_id: activeMatchId || targetArtisan?.match_id,
        rating,
        review,
      });
      setFinished(true);
      showToast('Completion confirmed and payout submitted.', 'success');
      confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
    } catch (completionError) {
      setError(completionError.message || 'Completion could not be confirmed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8]">
      <Header title="Confirm job completion" backTo="client_dash" />
      <main className="max-w-md mx-auto px-4 py-10">
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
          {finished ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
              <h1 className="text-xl font-extrabold text-[#0E3B40]">Completion recorded</h1>
              <p className="text-sm text-slate-600">The payout request is processing. Its final status is confirmed by Paystack’s signed webhook.</p>
              <button type="button" onClick={() => navigateTo('client_dash')} className="w-full py-3.5 bg-[#16858F] text-white font-bold rounded-2xl">
                Return to dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={submitCompletion} className="space-y-5">
              <div className="text-center">
                <ShieldCheck className="w-12 h-12 text-[#16858F] mx-auto mb-2" />
                <h1 className="text-xl font-extrabold text-[#0E3B40]">Is the job complete?</h1>
                <p className="text-xs text-slate-500 mt-1">Confirm only after you have inspected and accepted the work.</p>
              </div>

              <fieldset>
                <legend className="text-xs font-bold text-[#0E3B40] mb-2">Rating</legend>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button key={score} type="button" onClick={() => setRating(score)} aria-label={`${score} stars`}>
                      <Star className={`w-9 h-9 ${score <= rating ? 'fill-[#FAB804] text-[#D59F0F]' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block text-xs font-bold text-[#0E3B40]">
                Review (optional)
                <textarea
                  value={review}
                  onChange={(event) => setReview(event.target.value.slice(0, 1000))}
                  rows={4}
                  maxLength={1000}
                  className="mt-2 w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-normal focus:outline-none focus:border-[#16858F]"
                />
              </label>

              {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold">{error}</p>}

              <button type="submit" disabled={loading || !targetJob?.job_id} className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl disabled:opacity-50">
                {loading ? 'Submitting…' : 'Confirm completion and submit rating'}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
