import { ReactNode } from "react";
import WaiterSidebar from "@/components/layouts/waiter-sidebar";
import Navbar from "@/components/dashboard/navbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { prisma } from "@/lib/prisma";
import { getOptionalPayload } from "@/lib/permissions";

export default async function WaiterLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const payload = await getOptionalPayload();
  const role = payload?.role || "WAITER";
  
  // Fetch Restaurant & User Data
  let restaurantName = "Culinary Ledger";
  let user = { name: "Waiter", email: "waiter@example.com", role };

  if (payload) {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { restaurant: true }
    });
    
    if (dbUser) {
      user = { name: dbUser.name, email: dbUser.email, role: dbUser.role };
      if (dbUser.restaurant) {
        restaurantName = dbUser.restaurant.name;
      }
    }
  }

  const restaurantId = payload ? (await prisma.user.findUnique({ where: { id: payload.id } }))?.restaurantId : undefined;

  return (
    <SocketProvider restaurantId={restaurantId || undefined}>
      <div className="flex h-screen overflow-hidden bg-culinary-background">
        <WaiterSidebar restaurantName={restaurantName} />

        <div className="flex-1 flex flex-col w-full h-full relative">
          <Navbar user={user} />

          <main className="flex-1 overflow-auto p-4 md:p-6 w-full">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
