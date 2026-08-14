"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  ShoppingBag, 
  Save, 
  CheckCircle2, 
  Zap, 
  FileText, 
  ShieldAlert, 
  IndianRupee, 
  Sparkles,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface OrderSettingsData {
  acceptOnlineOrders?: boolean;
  autoAcceptOrders?: boolean;
  allowCustomerNotes?: boolean;
  allowItemQuantity?: boolean;
  maxOrderAmount?: number;
}

interface OrderSettingsProps {
  readonly data: OrderSettingsData | null;
  readonly refresh: () => void;
}

export default function OrderSettings({ data, refresh }: OrderSettingsProps) {
  const [formData, setFormData] = useState({
    acceptOnlineOrders: data?.acceptOnlineOrders ?? true,
    autoAcceptOrders: data?.autoAcceptOrders ?? false,
    allowCustomerNotes: data?.allowCustomerNotes ?? true,
    allowItemQuantity: data?.allowItemQuantity ?? true,
    maxOrderAmount: data?.maxOrderAmount || 10000,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/settings/system", {
        ...formData,
        maxOrderAmount: Number(formData.maxOrderAmount),
      });
      toast.success("Order handling rules saved successfully!");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update order settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shadow-sm">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Customer Order Handling & Kitchen Rules
            </h2>
            <p className="text-xs text-gray-500">
              Configure order acceptance flows, auto-kitchen routing, special instructions, and bill limits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Switches & Inputs */}
        <div className="lg:col-span-2 space-y-4 text-xs">
          
          {/* Rule 1: Accept Online Orders */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5">
                <Utensils size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Accept Table QR Dining Orders</Label>
                <p className="text-[11px] text-gray-500">
                  Allow guests scanning table QR codes to browse menu and place food orders directly.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.acceptOnlineOrders}
              onCheckedChange={(v) => setFormData({ ...formData, acceptOnlineOrders: v })}
            />
          </div>

          {/* Rule 2: Auto Accept Orders */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl mt-0.5">
                <Zap size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Auto-Send Orders Directly to Kitchen</Label>
                <p className="text-[11px] text-gray-500">
                  When enabled, incoming orders automatically enter &quot;Preparing&quot; on the Kitchen KDS without waiter manual accept.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.autoAcceptOrders}
              onCheckedChange={(v) => setFormData({ ...formData, autoAcceptOrders: v })}
            />
          </div>

          {/* Rule 3: Customer Cooking Notes */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                <FileText size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Allow Customer Special Cooking Instructions</Label>
                <p className="text-[11px] text-gray-500">
                  Allow guests to specify notes (e.g. &quot;Less spicy&quot;, &quot;No onions&quot;, &quot;Extra cheese&quot;).
                </p>
              </div>
            </div>
            <Switch
              checked={formData.allowCustomerNotes}
              onCheckedChange={(v) => setFormData({ ...formData, allowCustomerNotes: v })}
            />
          </div>

          {/* Rule 4: Max Order Limit */}
          <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl mt-0.5">
                <ShieldAlert size={16} />
              </div>
              <div className="space-y-0.5 flex-1">
                <Label className="text-xs font-bold text-gray-900">Maximum Single Order Bill Limit (₹)</Label>
                <p className="text-[11px] text-gray-500">
                  Safety limit on maximum cart value a customer can order in a single ticket.
                </p>
                <div className="pt-2 max-w-xs">
                  <Input
                    type="number"
                    value={formData.maxOrderAmount}
                    onChange={(e) => setFormData({ ...formData, maxOrderAmount: Number(e.target.value) })}
                    className="rounded-xl border-gray-200 text-xs py-2 bg-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
            >
              <Save size={14} />
              {loading ? "Saving Rules..." : "Save Order Rules"}
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Summary Card */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 space-y-3 text-xs">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-culinary-primary" /> Active Workflow Status
          </h4>

          <div className="space-y-2 pt-1 text-gray-600">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Online Orders:</span>
              <span className={`font-bold ${formData.acceptOnlineOrders ? "text-emerald-600" : "text-rose-600"}`}>
                {formData.acceptOnlineOrders ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Kitchen Auto-Accept:</span>
              <span className="font-bold text-gray-900">{formData.autoAcceptOrders ? "Automated" : "Manual Waiter"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span>Custom Notes:</span>
              <span className="font-bold text-gray-900">{formData.allowCustomerNotes ? "Allowed" : "Disabled"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Max Ticket Cap:</span>
              <span className="font-bold text-culinary-primary">₹{formData.maxOrderAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
