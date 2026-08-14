"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import TaxBillingSettings from "@/components/dashboard/settings/TaxBillingSettings";
import OpeningHoursSettings from "@/components/dashboard/settings/OpeningHoursSettings";
import OrderSettings from "@/components/dashboard/settings/OrderSettings";
import QRMenuSettings from "@/components/dashboard/settings/QRMenuSettings";
import AccountSettings from "@/components/dashboard/settings/AccountSettings";
import { Receipt, Clock, ShoppingBag, QrCode, UserCircle, Settings as SettingsIcon } from "lucide-react";

interface SystemData {
  gstNumber?: string | null;
  taxPercentage?: number | null;
  serviceCharge?: number | null;
  currency?: string | null;
  invoicePrefix?: string | null;
  openingHours?: Record<string, string>;
  isRestaurantOpen?: boolean;
  acceptOnlineOrders?: boolean;
  autoAcceptOrders?: boolean;
  allowCustomerNotes?: boolean;
  allowItemQuantity?: boolean;
  maxOrderAmount?: number;
  qrMenuStatus?: boolean;
  qrShowLogo?: boolean;
  qrShowImages?: boolean;
  qrShowRatings?: boolean;
  qrShowPrices?: boolean;
}

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState("tax");
  const [loading, setLoading] = useState(true);
  const [system, setSystem] = useState<SystemData | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/settings");
      setSystem(data.data.system);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const TABS = [
    { id: "tax", label: "Tax & Billing", icon: Receipt, badge: "GST 5%" },
    { id: "hours", label: "Opening Hours", icon: Clock, badge: "7 Days" },
    { id: "orders", label: "Order Settings", icon: ShoppingBag, badge: "Rules" },
    { id: "qr", label: "QR / Menu", icon: QrCode, badge: "Branding" },
    { id: "account", label: "Admin Account", icon: UserCircle, badge: "Security" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading restaurant system settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* Horizontal Nav Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? "bg-white text-culinary-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-culinary-primary" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-amber-50 text-culinary-primary border border-amber-200"
                    : "bg-white text-gray-500 border border-gray-200"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden p-6 md:p-8 animate-in fade-in duration-200">
        {activeTab === "tax" && <TaxBillingSettings data={system} refresh={fetchSettings} />}
        {activeTab === "hours" && <OpeningHoursSettings data={system} refresh={fetchSettings} />}
        {activeTab === "orders" && <OrderSettings data={system} refresh={fetchSettings} />}
        {activeTab === "qr" && <QRMenuSettings data={system} refresh={fetchSettings} />}
        {activeTab === "account" && <AccountSettings refresh={fetchSettings} />}
      </div>
    </div>
  );
}
