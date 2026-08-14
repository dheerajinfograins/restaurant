import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

import { UtensilsCrossed } from "lucide-react";
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

  const products = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      isAvailable: true
    },
  });

  const settings = await prisma.restaurantSettings.findUnique({
    where: { restaurantId: restaurant.id }
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-24">
      <MenuClientInit tableId={table.id} restaurantId={restaurant.id} />

      {/* Header */}
      <div className="w-full bg-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-culinary-primary/10 rounded-full flex items-center justify-center overflow-hidden mb-3">
          {restaurant.logo ? (
            <Image src={restaurant.logo} alt="Restaurant Logo" width={80} height={80} className="object-cover w-full h-full" />
          ) : (
            <UtensilsCrossed className="text-culinary-primary w-10 h-10" />
          )}
        </div>
        <h1 className="text-2xl font-bold font-cormorant text-culinary-text mb-2 text-center">
          The Culinary Ledger
        </h1>
        <div className="bg-gray-100 px-4 py-1.5 rounded-full">
          <p className="text-sm text-culinary-text/80 font-bold">Table {table.tableNumber}</p>
        </div>
      </div>

      <div className="px-6 space-y-6">
        <h2 className="text-xl font-bold font-cormorant text-culinary-text">All Products</h2>

        <ProductListClient products={products} tableId={tableId} settings={settings} />
      </div>
    </div>
  );
}
