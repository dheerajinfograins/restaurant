"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function OrderCountdown({ createdAt }: { readonly createdAt: Date }) {
  const [timeLeft, setTimeLeft] = useState<string>("15:00");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // 30 minutes in ms
    const duration = 30 * 60 * 1000;
    const endTime = new Date(createdAt).getTime() + duration;

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft("00:00");
        setIsExpired(true);
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  if (isExpired) {
    return (
      <div className="mt-2 text-sm font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
        Almost ready!
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2 bg-culinary-primary/10 text-culinary-primary px-3 py-1.5 rounded-lg w-fit shadow-inner">
      <Clock size={16} className="animate-spin-slow" style={{ animationDuration: '3s' }} />
      <span className="font-bold text-sm tracking-widest font-mono">{timeLeft}</span>
    </div>
  );
}
