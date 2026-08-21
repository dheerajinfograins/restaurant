import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { UtensilsCrossed, Users } from "lucide-react";
import { MenuClientInit } from "@/components/customer/menu-client";
import { ProductListClient } from "./product-list-client";

export default async function MenuHomePage({
  params,
}: Readonly<{
  params: Promise<{ tableId: string }>;
}>) {
  const tableId = (await params).tableId;

  const table = await prisma.restaurantTable.findUnique({
    where: { id: tableId },
    include: {
      restaurant: true,
    },
  });

  if (!table) {
    notFound();
  }

  const { restaurant } = table;


  // Fetch available products with category info
  const products = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      isAvailable: true,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const settings = await prisma.restaurantSettings.findUnique({
    where: { restaurantId: restaurant.id },
  });

  // If Admin disabled the digital menu via Publish Switch
  if (settings?.qrMenuStatus === false) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center selection:bg-amber-700 selection:text-white">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-stone-200/90 shadow-2xl shadow-stone-950/10 space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 text-amber-800 mx-auto flex items-center justify-center shadow-inner">
            <UtensilsCrossed size={36} className="text-amber-700" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Menu Temporarily Offline</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-cormorant text-stone-900 leading-tight">
              {restaurant.name || "The Culinary Ledger"}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Our digital QR menu is temporarily paused for updates. Please ask your table server or waiter for the physical menu card.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs text-stone-600 space-y-1">
            <p className="font-bold text-stone-800">Table {table.tableNumber}</p>
            <p className="text-[11px] text-stone-400">Our waitstaff is available at your service on the floor.</p>
          </div>

          {restaurant.phone && (
            <p className="text-xs text-stone-400 pt-2 border-t border-stone-100">
              Assistance Hotline: <strong className="text-stone-700">{restaurant.phone}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <MenuClientInit
        tableId={table.id}
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
      />

      {/* Hero Branding Header */}
      <header className="relative w-full bg-white rounded-b-[2.5rem] shadow-[0_12px_40px_rgb(0,0,0,0.06)] mb-6 overflow-hidden border-b border-amber-100/60">
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="px-6 pt-10 pb-6 flex flex-col items-center justify-center relative z-10">
          {/* Logo / Brand Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100/80 rounded-full flex items-center justify-center overflow-hidden mb-3 border-2 border-amber-200 shadow-md relative">
            {restaurant.logo ? (
              <Image
                src={restaurant.logo}
                alt={restaurant.name}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <UtensilsCrossed className="text-culinary-primary w-9 h-9" />
            )}
          </div>

          {/* Restaurant Title */}
          <h1 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text mb-2 text-center tracking-tight">
            {restaurant.name || "The Culinary Ledger"}
          </h1>

          {/* Badges: Table Info & Live Status */}
          <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
            <div className="bg-amber-50 border border-amber-200/80 px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="text-xs text-amber-900 font-bold">Table {table.tableNumber}</span>
              {table.capacity ? (
                <>
                  <span className="text-amber-300 text-xs">•</span>
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-0.5">
                    <Users size={11} /> {table.capacity} Seats
                  </span>
                </>
              ) : null}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-emerald-800">Digital Menu & Ordering</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Menu Content */}
      <div className="px-5">
        <ProductListClient
          products={products}
          settings={settings}
        />
      </div>
    </div>
  );
}
