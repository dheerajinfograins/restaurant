import { ReactNode } from "react";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";
import { SocketProvider } from "@/components/providers/socket-provider";
import { getOptionalPayload } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
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

  if (dbUser.role === "WAITER") {
    redirect("/waiter");
  }

  const role = dbUser.role;
  
  // Fetch Restaurant & User Data
  let restaurantName = "Culinary Ledger";
  let restaurantLogo: string | null = null;
  const user = {
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    image: dbUser.image,
  };
  let restaurantId: string | undefined = undefined;

  if (dbUser.restaurant) {
    restaurantName = dbUser.restaurant.name;
    restaurantLogo = dbUser.restaurant.logo;
    restaurantId = dbUser.restaurant.id;
  }

  return (
    <SocketProvider restaurantId={restaurantId} role={role}>
      <div className="flex h-screen bg-culinary-background overflow-hidden">
        <Sidebar role={role} restaurantName={restaurantName} logo={restaurantLogo} />
        <div className="flex flex-col flex-1 overflow-hidden relative">
          <Navbar user={user} restaurantName={restaurantName} logo={restaurantLogo} />
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
