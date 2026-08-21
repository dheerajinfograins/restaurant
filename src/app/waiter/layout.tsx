import { ReactNode } from "react";
import { redirect } from "next/navigation";
import WaiterSidebar from "@/components/layouts/waiter-sidebar";
import Navbar from "@/components/dashboard/navbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { WaiterUserProvider, WaiterUser } from "@/components/providers/waiter-user-provider";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";

import { WaiterAlertListener } from "@/components/waiter/WaiterAlertListener";

export default async function WaiterLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const payload = await getOptionalPayload();
  if (!payload) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.id },
    include: { restaurant: true }
  });

  if (!dbUser?.isActive) {
    redirect("/login");
  }

  const role = dbUser.role || "WAITER";
  
  // Fetch Restaurant & User Data
  let restaurantName = "Culinary Ledger";
  const user: WaiterUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role,
    image: dbUser.image,
    restaurantId: dbUser.restaurantId || undefined,
  };

  if (dbUser.restaurant) {
    restaurantName = dbUser.restaurant.name;
  }

  const restaurantId = user.restaurantId || (payload ? (await prisma.user.findUnique({ where: { id: payload.id } }))?.restaurantId : undefined);

  return (
    <SocketProvider restaurantId={restaurantId || undefined}>
      <WaiterUserProvider user={user}>
        <WaiterAlertListener />
        <div className="flex h-screen overflow-hidden bg-culinary-background">
          <WaiterSidebar restaurantName={restaurantName} />

          <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
            <div className="hidden md:block">
              <Navbar user={user} restaurantName={restaurantName} />
            </div>

            <main className="flex-1 overflow-y-auto p-0 md:p-6 w-full">
              <div className="max-w-7xl mx-auto md:space-y-8 min-h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </WaiterUserProvider>
    </SocketProvider>
  );
}

