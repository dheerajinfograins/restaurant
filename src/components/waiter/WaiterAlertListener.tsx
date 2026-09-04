"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "@/components/providers/socket-provider";
import { useWaiterUser } from "@/components/providers/waiter-user-provider";
import { AdminCallAlertModal, AdminCallData } from "./AdminCallAlertModal";
import toast from "react-hot-toast";

export function WaiterAlertListener() {
  const { socket } = useSocket();
  const { currentUser } = useWaiterUser();
  const [adminCall, setAdminCall] = useState<AdminCallData | null>(null);
  const lastCallIdRef = useRef<string | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const dismissedCallIdsRef = useRef<Set<string>>(new Set());

  // 1. Live real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleAdminCall = (data: AdminCallData) => {
      if (!data.waiterId || data.waiterId === currentUser.id) {
        if (data.id && dismissedCallIdsRef.current.has(data.id)) return;

        const now = Date.now();
        if (
          (data.id && data.id === lastCallIdRef.current) ||
          (now - lastCallTimeRef.current < 4000 && data.waiterId === currentUser.id)
        ) {
          return;
        }

        lastCallIdRef.current = data.id || null;
        lastCallTimeRef.current = now;
        setAdminCall(data);
      }
    };

    const handleStaffStatusChanged = (data: { userId: string; isActive: boolean }) => {
      if (data.userId === currentUser.id && !data.isActive) {
        toast.error(
          "Your staff account has been deactivated by administrator. Redirecting to login...",
          {
            id: "staff-deactivated-listener",
            duration: 4000,
          }
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 1200);
      }
    };

    socket.on("waiter:call", handleAdminCall);
    socket.on("staff:status_changed", handleStaffStatusChanged);

    return () => {
      socket.off("waiter:call", handleAdminCall);
      socket.off("staff:status_changed", handleStaffStatusChanged);
    };
  }, [socket, currentUser.id]);

  // 2. High-reliability Polling (every 2.5s) for active calls (works 100% on Vercel and serverless)
  useEffect(() => {
    if (!currentUser?.id) return;
    let isCancelled = false;

    const checkActiveCalls = async () => {
      try {
        const res = await fetch(
          `/api/waiter/call?waiterId=${currentUser.id}&activeOnly=true&t=${Date.now()}`
        );
        if (!res.ok) return;
        const json = await res.json();
        if (isCancelled) return;

        if (json?.activeCall) {
          const call: AdminCallData = json.activeCall;
          if (call.id && !dismissedCallIdsRef.current.has(call.id)) {
            setAdminCall((prev) => {
              if (prev && prev.id === call.id) return prev;
              lastCallIdRef.current = call.id;
              return call;
            });
          }
        }
      } catch {
        // Silently catch network errors during offline / navigation
      }
    };

    void checkActiveCalls();

    const interval = setInterval(() => {
      void checkActiveCalls();
    }, 2500);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleDismiss = useCallback(async () => {
    if (adminCall) {
      if (adminCall.id) {
        dismissedCallIdsRef.current.add(adminCall.id);
      }
      try {
        await fetch("/api/waiter/call/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callId: adminCall.id,
            waiterId: adminCall.waiterId || currentUser.id,
          }),
        });
      } catch {
        // ignore
      }
    }
    setAdminCall(null);
  }, [adminCall, currentUser.id]);

  const handleAcknowledge = useCallback(() => {
    if (adminCall?.id) {
      dismissedCallIdsRef.current.add(adminCall.id);
    }
    setAdminCall(null);
  }, [adminCall]);

  return (
    <AdminCallAlertModal
      callData={adminCall}
      onDismiss={handleDismiss}
      onAcknowledgeSuccess={handleAcknowledge}
    />
  );
}
