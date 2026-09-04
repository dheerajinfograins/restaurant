"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { BellRing, CheckCircle, X, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export interface AdminCallData {
  id: string;
  waiterId: string;
  waiterName?: string;
  callerName?: string;
  message?: string;
  timestamp: string;
}

interface AdminCallAlertModalProps {
  readonly callData: AdminCallData | null;
  readonly onDismiss: () => void;
  readonly onAcknowledgeSuccess?: () => void;
}

export function AdminCallAlertModal({
  callData,
  onDismiss,
  onAcknowledgeSuccess,
}: Readonly<AdminCallAlertModalProps>) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const chimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSendingAck, setIsSendingAck] = useState(false);

  // Play loud urgent alert chord sequence for Admin Call
  const playAlertChime = useCallback(() => {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 600]);
      }

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

      // 3-tone urgency chord sequence (G5 -> C6 -> E6)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      playTone(784.0, now, 0.25); // G5
      playTone(1046.5, now + 0.12, 0.25); // C6
      playTone(1318.5, now + 0.24, 0.5); // E6

      // Second burst
      playTone(1046.5, now + 0.5, 0.2);
      playTone(1318.5, now + 0.62, 0.4);
    } catch {
      // Ignore audio autoplay restrictions
    }
  }, []);

  // Repeating chime while alert is visible
  useEffect(() => {
    if (!callData) {
      if (chimeIntervalRef.current) {
        clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
      return;
    }

    // Play immediately
    playAlertChime();

    // Repeat every 2.5 seconds
    chimeIntervalRef.current = setInterval(() => {
      playAlertChime();
    }, 2500);

    return () => {
      if (chimeIntervalRef.current) {
        clearInterval(chimeIntervalRef.current);
        chimeIntervalRef.current = null;
      }
    };
  }, [callData, playAlertChime]);

  const handleAcknowledge = async () => {
    if (!callData) return;
    setIsSendingAck(true);
    try {
      await fetch("/api/waiter/call/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: callData.id,
          waiterId: callData.waiterId,
          waiterName: callData.waiterName,
          message: `${callData.waiterName || "Waiter"} acknowledged: I'm on my way to the counter! 🏃`,
        }),
      });
      toast.success("Admin notified: You're on the way! 🏃", { id: "ack-call" });
      onAcknowledgeSuccess?.();
    } catch (err) {
      console.error("Failed to send ack:", err);
    } finally {
      setIsSendingAck(false);
      onDismiss();
    }
  };

  if (!callData) return null;

  const caller = callData.callerName || "Restaurant Admin / Owner";
  const messageText =
    callData.message || "Admin is calling you! Please report to the counter or service desk immediately.";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onDismiss}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Admin Calling Notification"
        className="relative z-10 w-full max-w-md bg-stone-900/95 backdrop-blur-2xl rounded-3xl border-2 border-amber-500/80 p-5 sm:p-6 shadow-2xl shadow-amber-950/80 ring-4 ring-amber-500/30 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 animate-pulse" />

        {/* Header with Pulsing Bell */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md">
                <BellRing size={24} className="animate-bounce" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-amber-400">
                <Sparkles size={11} />
                <span>Urgent Waiter Call</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-cormorant text-white leading-tight">
                Admin Is Calling You!
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss Call Alert"
            className="text-stone-400 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Content Body */}
        <div className="mt-4 space-y-2.5">
          <div className="bg-stone-800/90 rounded-2xl p-4 border border-stone-700/80 shadow-inner text-left">
            <p className="text-[11px] font-semibold text-amber-300/90 flex items-center gap-1.5 mb-1.5">
              <ShieldAlert size={14} className="text-amber-400 shrink-0" />
              <span>From: <strong>{caller}</strong></span>
            </p>
            <p className="text-xs sm:text-sm text-stone-100 font-medium leading-relaxed italic">
              &ldquo;{messageText}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 pt-1">
            <span>
              {callData.timestamp
                ? formatDistanceToNow(new Date(callData.timestamp), { addSuffix: true })
                : "Just now"}
            </span>
            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Live Calling Alert</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-3 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-bold text-xs rounded-xl border border-stone-700 transition-colors text-center"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={() => void handleAcknowledge()}
            disabled={isSendingAck}
            className="w-full py-3 px-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-stone-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-900/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-center"
          >
            {isSendingAck ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Notifying Admin...</span>
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                <span>I&apos;m On My Way</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
