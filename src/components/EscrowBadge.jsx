import React from 'react';
import { Lock, CheckCircle2, RefreshCcw, AlertTriangle } from 'lucide-react';

export function EscrowBadge({ status }) {
  // Supports: HELD, DISBURSED_PARTIAL, RELEASED, REFUNDED
  
  if (!status) return null;

  switch (status.toUpperCase()) {
    case 'HELD':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Held in Escrow</span>
        </div>
      );
    case 'RELEASED':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Funds Released</span>
        </div>
      );
    case 'REFUNDED':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded-full">
          <RefreshCcw className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Refunded to Client</span>
        </div>
      );
    case 'DISBURSED_PARTIAL':
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#E8F5F6] text-[#16858F] border border-[#16858F]/20 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Partial Supplier Payout</span>
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-full">
          <span className="text-[10px] font-extrabold uppercase tracking-wider">{status}</span>
        </div>
      );
  }
}
