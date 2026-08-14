"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  QrCode, 
  Save, 
  Sparkles, 
  Eye, 
  Image as ImageIcon, 
  DollarSign, 
  Store, 
  ExternalLink,
  Utensils
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface QRMenuSettingsData {
  qrMenuStatus?: boolean;
  qrShowLogo?: boolean;
  qrShowImages?: boolean;
  qrShowRatings?: boolean;
  qrShowPrices?: boolean;
}

interface QRMenuSettingsProps {
  readonly data?: QRMenuSettingsData | null;
  readonly refresh: () => void;
}

export default function QRMenuSettings({ data, refresh }: QRMenuSettingsProps) {
  const [formData, setFormData] = useState({
    qrMenuStatus: data?.qrMenuStatus ?? true,
    qrShowLogo: data?.qrShowLogo ?? true,
    qrShowImages: data?.qrShowImages ?? true,
    qrShowRatings: data?.qrShowRatings ?? true,
    qrShowPrices: data?.qrShowPrices ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/settings/system", formData);
      toast.success("QR Menu customization saved successfully!");
      refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update QR settings");
      } else {
        toast.error("Failed to update QR settings");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
            <QrCode size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Customer QR Menu Customization
            </h2>
            <p className="text-xs text-gray-500">
              Customize what guests experience when they scan table QR codes on their mobile phones.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Toggles */}
        <div className="lg:col-span-2 space-y-4 text-xs">
          
          {/* Active QR Menu Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5">
                <QrCode size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Active Public Digital Menu</Label>
                <p className="text-[11px] text-gray-500">
                  Allow customers to view menu upon scanning table QR codes.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.qrMenuStatus}
              onCheckedChange={(v) => setFormData({ ...formData, qrMenuStatus: v })}
            />
          </div>

          {/* Show Restaurant Logo */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl mt-0.5">
                <Store size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Show Restaurant Monogram & Logo</Label>
                <p className="text-[11px] text-gray-500">
                  Display restaurant branding and verified badge at the top of the mobile menu.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.qrShowLogo}
              onCheckedChange={(v) => setFormData({ ...formData, qrShowLogo: v })}
            />
          </div>

          {/* Show Product Images */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                <ImageIcon size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Show Dish Food Photography</Label>
                <p className="text-[11px] text-gray-500">
                  Show dish images. (Disable for ultra-fast text-only menu on slow connections).
                </p>
              </div>
            </div>
            <Switch
              checked={formData.qrShowImages}
              onCheckedChange={(v) => setFormData({ ...formData, qrShowImages: v })}
            />
          </div>

          {/* Show Item Prices */}
          <div className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl mt-0.5">
                <DollarSign size={16} />
              </div>
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-gray-900">Show Item Price Tags</Label>
                <p className="text-[11px] text-gray-500">
                  Display prices on the digital menu.
                </p>
              </div>
            </div>
            <Switch
              checked={formData.qrShowPrices}
              onCheckedChange={(v) => setFormData({ ...formData, qrShowPrices: v })}
            />
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
            >
              <Save size={14} />
              {loading ? "Saving Customization..." : "Save QR Customization"}
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Quick Links */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 space-y-4 text-xs">
          <h4 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-culinary-primary" /> Table QR Tools
          </h4>

          <div className="space-y-2.5">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-amber-50 hover:text-culinary-primary text-gray-700 transition-colors border border-gray-200/80 font-semibold"
            >
              <span>Test Public Mobile Menu</span>
              <ExternalLink size={13} />
            </Link>

            <Link
              href="/dashboard/tables"
              className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-amber-50 hover:text-culinary-primary text-gray-700 transition-colors border border-gray-200/80 font-semibold"
            >
              <span>Generate Table QR Stickers</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
