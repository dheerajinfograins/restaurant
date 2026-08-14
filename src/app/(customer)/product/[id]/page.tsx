import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MenuClientContent } from "@/components/customer/menu-client-content";
import { FoodType } from "@prisma/client";

export default async function ProductDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tableId?: string; type?: string }>;
}>) {
  const id = (await params).id;
  const searchParamsResolved = await searchParams;
  const tableId = searchParamsResolved.tableId;
  const type = searchParamsResolved.type;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!product) {
    notFound();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: product.restaurantId }
  });

  if (!restaurant) {
    notFound();
  }

  let tableNumber = "1";
  if (tableId) {
    const table = await prisma.restaurantTable.findUnique({
      where: { id: tableId }
    });
    if (table) tableNumber = table.tableNumber;
  }

  const allProducts = await prisma.product.findMany({
    where: {
      restaurantId: product.restaurantId,
      isAvailable: true,
      ...(type ? { foodType: type as FoodType } : {})
    },
  });

  const allCategories = await prisma.category.findMany({
    where: { restaurantId: product.restaurantId }
  });

  // Filter categories: must contain any word from the clicked product's name, and must have at least one product of the selected type
  const searchTerms = product.name.toLowerCase().replaceAll('&', '').split(' ').filter(Boolean);
  const categories = allCategories.filter(category =>
    searchTerms.some(term => category.name.toLowerCase().includes(term)) &&
    allProducts.some(p => p.categoryId === category.id)
  );

  // Filter products: only include products that belong to the filtered categories
  const products = allProducts.filter(p =>
    categories.some(c => c.id === p.categoryId)
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <MenuClientContent
        tableId={tableId || ""}
        tableNumber={tableNumber}
        restaurant={restaurant}
        categories={categories}
        products={products}
      />
    </div>
  );
}
