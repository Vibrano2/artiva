import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export function NoResponseTimer({ expiresAt, hasResponded = false }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (hasResponded || !expiresAt) return;

    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - new Date().getTime();
      if (diff <= 0) return 'Expired';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m left`;
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [expiresAt, hasResponded]);

  if (!expiresAt) return null;

  if (hasResponded) {
    return (
      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3" />
        Contact Established
      </div>
    );
  }

  if (timeLeft === 'Expired') {
    return (
      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3" />
        No Response - Refund Initiated
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
      <Clock className="w-3 h-3" />
      Waiting for response: {timeLeft}
    </div>
  );
}
