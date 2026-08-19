import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useApp } from '../context/AppContext';
import { ApiService } from '../services';
import { Calculator, FileText, Send, AlertCircle } from 'lucide-react';

export function ArtisanProformaScreen({ job, matchId }) {
  const { navigateTo, showToast } = useApp();
  
  const [materialsCost, setMaterialsCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const materials = parseFloat(materialsCost) || 0;
  const labor = parseFloat(laborCost) || 0;
  const totalCost = materials + labor;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalCost <= 0) {
      showToast('Total cost must be greater than 0', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await ApiService.submitProforma(matchId || 'demo_match_id', {
        materialsCost: materials,
        laborCost: labor,
        notes: notes.trim()
      });
      showToast('Proforma invoice sent to client for approval', 'success');
      navigateTo('artisan_dash');
    } catch (err) {
      setSubmitting(false);
      showToast('Failed to submit proforma: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F8] pb-12">
      <Header title="Generate Proforma" backTo="artisan_dash" />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-[#E8F5F6] text-[#16858F] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calculator className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-[#0E3B40] font-['Outfit']">
            Job Estimate
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide a detailed breakdown of costs for the client. The client must approve and fund escrow before work begins.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0E3B40] mb-1.5 uppercase tracking-wider">
                Materials Cost (₦)
              </label>
              <input
                type="number"
                min="0"
                required
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-[#0E3B40] focus:border-[#16858F] focus:ring-1 focus:ring-[#16858F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] mb-1.5 uppercase tracking-wider">
                Labor Cost (₦)
              </label>
              <input
                type="number"
                min="0"
                required
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-[#0E3B40] focus:border-[#16858F] focus:ring-1 focus:ring-[#16858F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E3B40] mb-1.5 uppercase tracking-wider">
                Additional Notes
              </label>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details on materials or scope of work..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-[#0E3B40] focus:border-[#16858F] focus:ring-1 focus:ring-[#16858F] focus:outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Materials</span>
              <span>₦{materials.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-slate-600">
              <span>Labor</span>
              <span>₦{labor.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-[#0E3B40] text-lg">
              <span>Total Estimate</span>
              <span>₦{totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
              Submitting this proforma commits you to completing the job for this price if accepted. The client will be asked to fund this amount into escrow.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || totalCost <= 0}
            className="w-full py-4 bg-[#16858F] hover:bg-[#0E5C63] text-white font-extrabold text-base rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all btn-press touch-target disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Send to Client</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
