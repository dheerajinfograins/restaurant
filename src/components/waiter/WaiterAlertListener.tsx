"use client";

import React, { useEffect, useState, useRef } from "react";
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

  useEffect(() => {
    if (!socket) return;

    const handleAdminCall = (data: AdminCallData) => {
      // Check if call is for this waiter specifically, or broadcast to all
      if (!data.waiterId || data.waiterId === currentUser.id) {
        const now = Date.now();
        // Deduplicate calls arriving within 5 seconds with same ID or same waiter
        if (
          (data.id && data.id === lastCallIdRef.current) ||
          (now - lastCallTimeRef.current < 5000 && data.waiterId === currentUser.id)
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

  return (
    <AdminCallAlertModal
      callData={adminCall}
      onDismiss={() => setAdminCall(null)}
    />
  );
}
