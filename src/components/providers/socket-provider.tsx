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
    // Connect to external socket URL if configured, or current host
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";

    const socketInstance = ClientIO(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 2, // Stop aggressive polling after 2 tries if running on serverless/Vercel
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
