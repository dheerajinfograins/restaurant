import { getKitchenHistoryAction } from "@/modules/kitchen/controller";
import { HistoryClient, type HistoryOrder } from "@/components/kitchen/history-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kitchen History | Kitchen",
};

export default async function KitchenHistoryPage() {
  const result = await getKitchenHistoryAction("all");
  const history = (result.success && result.data ? result.data : []) as unknown as HistoryOrder[];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-culinary-text font-cormorant">Kitchen History</h2>
        <p className="text-culinary-muted text-sm">Review today&apos;s completed and served orders</p>
      </div>
      
      <HistoryClient history={history} />
    </div>
  );
}

