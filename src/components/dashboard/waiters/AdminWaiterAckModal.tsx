"use client";

import { useEffect, useRef, useCallback } from "react";
import { UserCheck, CheckCircle2, Sparkles, X, Footprints } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface WaiterAckData {
  id: string;
  waiterId: string;
  waiterName: string;
  message: string;
  timestamp: string;
}

interface AdminWaiterAckModalProps {
  readonly ackData: WaiterAckData | null;
  readonly onDismiss: () => void;
}

export function AdminWaiterAckModal({
  ackData,
  onDismiss,
}: Readonly<AdminWaiterAckModalProps>) {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play pleasant positive confirmation chime
  const playAckChime = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      audioContextRef.current ??= new AudioCtx();

      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;

      // Positive 3-tone arpeggio (C5 -> E5 -> G5 -> C6)
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.4, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playTone(523.25, now, 0.2); // C5
      playTone(659.25, now + 0.1, 0.2); // E5
      playTone(783.99, now + 0.2, 0.2); // G5
      playTone(1046.5, now + 0.3, 0.45); // C6
    } catch {
      // Ignore audio autoplay restrictions
    }
  }, []);

  useEffect(() => {
    if (!ackData) return;

    playAckChime();

    // Auto-dismiss after 12 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 12000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ackData, playAckChime, onDismiss]);

  if (!ackData) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Dialog Modal */}
      <dialog
        open
        aria-labelledby="waiter-ack-title"
        className="relative z-10 w-full max-w-md bg-stone-900/95 border-2 border-emerald-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/80 ring-4 ring-emerald-500/20 overflow-hidden text-center animate-in zoom-in-95 duration-200"
      >
        {/* Top ambient glow banner */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 animate-pulse" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close Alert"
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-xl hover:bg-stone-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Center Animated Icon with Pulsing Beacon */}
        <div className="mx-auto mb-4 relative w-16 h-16 flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
            <UserCheck size={32} className="animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        </div>

        {/* Category Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
          <Sparkles size={12} className="text-emerald-400" />
          <span>Waiter Responded</span>
        </div>

        {/* Title */}
        <h2
          id="waiter-ack-title"
          className="text-2xl sm:text-3xl font-bold font-cormorant text-white leading-tight mb-2"
        >
          {ackData.waiterName} Is On The Way! 🏃
        </h2>

        {/* Message Card */}
        <div className="my-4 p-4 bg-stone-800/90 rounded-2xl border border-stone-700/80 text-left shadow-inner">
          <p className="text-xs text-stone-300 flex items-center gap-1.5 font-medium mb-1">
            <Footprints size={14} className="text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-bold">{ackData.waiterName}</span> acknowledged your call:
          </p>
          <p className="text-xs sm:text-sm text-stone-100 italic pl-5">
            &ldquo;{ackData.message}&rdquo;
          </p>
        </div>

        {/* Timestamp */}
        <p className="text-[11px] text-stone-400 mb-5 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            {ackData.timestamp
              ? `Received ${formatDistanceToNow(new Date(ackData.timestamp), { addSuffix: true })}`
              : "Received just now"}
          </span>
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/60 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          <span>Got It, Thanks!</span>
        </button>
      </dialog>
    </div>
  );
}
