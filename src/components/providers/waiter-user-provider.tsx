"use client";

import React, { createContext, useContext, useMemo } from "react";

export type WaiterUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
  restaurantId?: string;
};

type WaiterUserContextType = {
  currentUser: WaiterUser;
};

const WaiterUserContext = createContext<WaiterUserContextType>({
  currentUser: {
    name: "Waiter",
    email: "waiter@example.com",
    role: "WAITER",
    image: null,
  },
});

export const useWaiterUser = () => {
  return useContext(WaiterUserContext);
};

export function WaiterUserProvider({
  children,
  user,
}: Readonly<{
  children: React.ReactNode;
  user: WaiterUser;
}>) {
  const value = useMemo(() => ({ currentUser: user }), [user]);

  return (
    <WaiterUserContext.Provider value={value}>
      {children}
    </WaiterUserContext.Provider>
  );
}
