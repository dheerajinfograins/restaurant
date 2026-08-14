import { getAllProductsAction } from "@/modules/kitchen/controller";
import { PrepGuideClient } from "@/components/kitchen/prep-guide-client";

export const metadata = {
  title: "Prep Guide | Kitchen",
};

export default async function PrepGuidePage() {
  const result = await getAllProductsAction();
  const products = result.success ? result.data : [];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-culinary-text font-cormorant">Prep Guide</h2>
        <p className="text-culinary-muted text-sm">Reference instructions and prep times for menu items</p>
      </div>
      
      <PrepGuideClient products={products as any} />
    </div>
  );
}
