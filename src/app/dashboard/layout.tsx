import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { getOptionalPayload } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const payload = await getOptionalPayload();
  const role = payload?.role || "WAITER"; // Default fallback
  
  // Fetch Restaurant & User Data
  let restaurantName = "Culinary Ledger";
  let user = { name: "Admin", email: "admin@example.com", role };
  let restaurantId: string | undefined = undefined;

  if (payload) {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { restaurant: true }
    });
    
    if (dbUser) {
      user = { name: dbUser.name, email: dbUser.email, role: dbUser.role };
      if (dbUser.restaurant) {
        restaurantName = dbUser.restaurant.name;
        restaurantId = dbUser.restaurant.id;
      }
    }
  }

  return (
    <SocketProvider restaurantId={restaurantId}>
      <div className="flex h-screen bg-culinary-background overflow-hidden">
        <Sidebar role={role} restaurantName={restaurantName} />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <Navbar user={user} restaurantName={restaurantName} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  );
}
