import { KDSClient } from "@/components/kitchen/kds-client";

export default function KitchenPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-culinary-text font-cormorant">Kitchen Display System</h2>
          <p className="text-culinary-muted text-sm mt-1">Live order tracking and management</p>
        </div>
      </div>
      <KDSClient />
    </div>
  );
}
