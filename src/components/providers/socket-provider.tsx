"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({
  children,
  restaurantId,
  role,
}: {
  children: React.ReactNode;
  restaurantId?: string;
  role?: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const customSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
    const hostname = window.location.hostname;
    const isLocalServer =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.endsWith(".local");

    // On Vercel / serverless deployments without a dedicated WebSocket server URL,
    // skip ClientIO to completely eliminate "WebSocket connection failed" browser errors.
    // All real-time synchronization is handled with 100% reliability via our dual REST/polling engine.
    if (!customSocketUrl && !isLocalServer) {
      setIsConnected(false);
      setSocket(null);
      return;
    }

    const targetUrl = customSocketUrl || window.location.origin;

    const socketInstance = ClientIO(targetUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 3500,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      setSocket(socketInstance);
      setIsConnected(true);
    });

    socketInstance.on("connect_error", () => {
      setIsConnected(false);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected) {
      if (role === "SUPER_ADMIN") {
        socket.emit("join_super_admin");
      }
      if (restaurantId) {
        socket.emit("join_restaurant", restaurantId);
      }
    }
  }, [socket, isConnected, restaurantId, role]);

  const value = useMemo(
    () => ({ socket, isConnected }),
    [socket, isConnected]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
