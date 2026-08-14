"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Receipt, 
  Percent, 
  FileText, 
  IndianRupee, 
  Sparkles, 
  Save, 
  RotateCcw,
  CheckCircle2,
  Building,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaxBillingData {
  gstNumber?: string | null;
  taxPercentage?: number | null;
  serviceCharge?: number | null;
  currency?: string | null;
  invoicePrefix?: string | null;
}

interface TaxBillingSettingsProps {
  readonly data: TaxBillingData | null | undefined;
  readonly refresh: () => void;
}

export default function TaxBillingSettings({ data, refresh }: TaxBillingSettingsProps) {
  const [formData, setFormData] = useState({
    gstNumber: data?.gstNumber || "23ABCDE1234F1Z5",
    taxPercentage: data?.taxPercentage ?? 5,
    serviceCharge: data?.serviceCharge ?? 2,
    currency: data?.currency || "INR",
    invoicePrefix: data?.invoicePrefix || "INV-",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        taxPercentage: Number(formData.taxPercentage),
        serviceCharge: Number(formData.serviceCharge),
      };
      await axios.patch("/api/settings/system", payload);
      toast.success("Tax & billing settings updated successfully!");
      refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update billing settings");
      } else {
        toast.error("Failed to update billing settings");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sample live bill simulation calculation
  const sampleSubtotal = 1000;
  const calculatedTax = (sampleSubtotal * (Number(formData.taxPercentage) || 0)) / 100;
  const calculatedService = (sampleSubtotal * (Number(formData.serviceCharge) || 0)) / 100;
  const grandTotal = sampleSubtotal + calculatedTax + calculatedService;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-culinary-primary rounded-xl border border-amber-100 shadow-sm">
            <Receipt size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Tax, GST & Invoice Configuration
            </h2>
            <p className="text-xs text-gray-500">
              Configure government GST tax rates, optional service charge, invoice prefixes, and currency formats.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* GST Number */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Building size={13} className="text-gray-400" /> GSTIN / Tax Identification No.
              </Label>
              <Input
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 23ABCDE1234F1Z5"
                className="rounded-xl border-gray-200 text-xs py-2.5 uppercase font-mono"
              />
              <p className="text-[10px] text-gray-400">Printed on official customer tax invoices and thermal receipts.</p>
            </div>

            {/* Invoice Prefix */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FileText size={13} className="text-gray-400" /> Invoice Number Prefix
              </Label>
              <Input
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                placeholder="e.g. INV-"
                className="rounded-xl border-gray-200 text-xs py-2.5 font-mono"
              />
              <p className="text-[10px] text-gray-400">Generates invoice IDs like {formData.invoicePrefix}1001, {formData.invoicePrefix}1002.</p>
            </div>

            {/* Tax Percentage */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Percent size={13} className="text-gray-400" /> Applicable Tax Rate (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.taxPercentage}
                  onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                  className="rounded-xl border-gray-200 text-xs py-2.5 pr-8 font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
              </div>
              <p className="text-[10px] text-gray-400">Default restaurant GST rate is usually 5% (2.5% CGST + 2.5% SGST).</p>
            </div>

            {/* Service Charge */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Percent size={13} className="text-gray-400" /> Restaurant Service Charge (%)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.serviceCharge}
                  onChange={(e) => setFormData({ ...formData, serviceCharge: Number(e.target.value) })}
                  className="rounded-xl border-gray-200 text-xs py-2.5 pr-8 font-semibold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
              </div>
              <p className="text-[10px] text-gray-400">Optional staff service charge applied on dine-in orders.</p>
            </div>

            {/* Currency Symbol */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <IndianRupee size={13} className="text-gray-400" /> Currency Symbol & Code
              </Label>
              <Input
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="e.g. INR"
                className="rounded-xl border-gray-200 text-xs py-2.5 font-semibold"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
            >
              <Save size={14} />
              {loading ? "Saving Settings..." : "Save Billing Settings"}
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Live Invoice Calculation Simulator */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-culinary-primary" /> Live Invoice Calculation
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sample ₹1,000 Bill
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-700 font-sans">
            <div className="flex justify-between py-1 text-gray-500">
              <span>Invoice Sample No:</span>
              <span className="font-mono font-bold text-gray-900">{formData.invoicePrefix}1001</span>
            </div>

            <div className="flex justify-between py-1">
              <span>Food & Drinks Subtotal:</span>
              <span className="font-semibold text-gray-900">₹{sampleSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-1 text-emerald-700">
              <span>GST Tax ({formData.taxPercentage}%):</span>
              <span className="font-semibold">+₹{calculatedTax.toFixed(2)}</span>
            </div>

            {Number(formData.serviceCharge) > 0 && (
              <div className="flex justify-between py-1 text-blue-700">
                <span>Service Charge ({formData.serviceCharge}%):</span>
                <span className="font-semibold">+₹{calculatedService.toFixed(2)}</span>
              </div>
            )}

            <div className="pt-2.5 mt-2 border-t border-gray-200 flex justify-between items-baseline font-bold text-sm text-gray-900">
              <span>Grand Total Amount:</span>
              <span className="text-base text-culinary-primary font-bold">₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="pt-2 text-[10px] text-gray-400 bg-white p-2.5 rounded-xl border border-gray-200/60 mt-3">
              <span className="font-bold text-gray-600 block mb-0.5">GSTIN: {formData.gstNumber || "Not Configured"}</span>
              This calculation rule will apply automatically across all table checkout bills and receipt prints.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
