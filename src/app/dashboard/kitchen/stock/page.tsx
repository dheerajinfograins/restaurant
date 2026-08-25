import { getAllProductsAction } from "@/modules/kitchen/controller";
import { StockClient, type Product } from "@/components/kitchen/stock-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Menu Stock | Kitchen",
};

export default async function MenuStockPage() {
  const result = await getAllProductsAction();
  const products = (result.success && result.data ? result.data : []) as unknown as Product[];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-culinary-text font-cormorant">Menu Stock</h2>
        <p className="text-culinary-muted text-sm">Manage item availability and 86&apos;d items</p>
      </div>
      
      <StockClient initialProducts={products} />
    </div>
  );
}

