"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Clock, 
  Save, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Building,
  RotateCw,
  Sun,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

interface SystemSettingsData {
  openingHours?: Record<string, string>;
  isRestaurantOpen?: boolean;
}

interface OpeningHoursSettingsProps {
  readonly data: SystemSettingsData | null;
  readonly refresh: () => void;
}

export default function OpeningHoursSettings({ data, refresh }: OpeningHoursSettingsProps) {
  const [openingHours, setOpeningHours] = useState<Record<string, string>>(
    data?.openingHours || {
      monday: "10:00 AM - 11:00 PM",
      tuesday: "10:00 AM - 11:00 PM",
      wednesday: "10:00 AM - 11:00 PM",
      thursday: "10:00 AM - 11:00 PM",
      friday: "10:00 AM - 11:30 PM",
      saturday: "10:00 AM - 11:30 PM",
      sunday: "10:00 AM - 11:00 PM",
    }
  );
  const [isOpen, setIsOpen] = useState(data?.isRestaurantOpen ?? true);
  const [loading, setLoading] = useState(false);

  const handleHourChange = (day: string, value: string) => {
    setOpeningHours((prev) => ({ ...prev, [day]: value }));
  };

  const applyToAllDays = () => {
    const mondayVal = openingHours["monday"] || "10:00 AM - 11:00 PM";
    const updated: Record<string, string> = {};
    DAYS.forEach((d) => {
      updated[d.key] = mondayVal;
    });
    setOpeningHours(updated);
    toast.success("Applied Monday hours to all days!");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/settings/system", { openingHours, isRestaurantOpen: isOpen });
      toast.success("Opening hours and schedule saved successfully!");
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update opening hours");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Master Switch */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Operating Hours & Dining Schedule
            </h2>
            <p className="text-xs text-gray-500">
              Configure weekly dining shift timings, kitchen operational hours, and live open status.
            </p>
          </div>
        </div>

        {/* Master Open / Closed Status Pill */}
        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-200 text-xs">
          <div className="text-right">
            <p className="font-bold text-gray-900">
              {isOpen ? "🟢 OPEN FOR DINING" : "🔴 CURRENTLY CLOSED"}
            </p>
            <p className="text-[10px] text-gray-400">Master Service Switch</p>
          </div>
          <Switch checked={isOpen} onCheckedChange={setIsOpen} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Days Schedule Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Weekly Schedule Timings
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyToAllDays}
              className="text-xs rounded-xl h-8 text-culinary-primary hover:text-culinary-primary border-amber-200 bg-amber-50/50"
            >
              <Sparkles size={12} className="mr-1" /> Copy Monday to All Days
            </Button>
          </div>

          <div className="space-y-2.5">
            {DAYS.map((day) => {
              const isWeekend = day.key === "saturday" || day.key === "sunday";
              return (
                <div
                  key={day.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 border border-gray-200/80 hover:bg-gray-50 transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 w-32 shrink-0">
                    <Calendar size={14} className={isWeekend ? "text-amber-500" : "text-gray-400"} />
                    <span className={`text-xs font-bold ${isWeekend ? "text-amber-900" : "text-gray-800"}`}>
                      {day.label}
                    </span>
                    {isWeekend && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                        Weekend
                      </span>
                    )}
                  </div>

                  <div className="flex-1 max-w-sm">
                    <Input
                      value={openingHours[day.key] || ""}
                      onChange={(e) => handleHourChange(day.key, e.target.value)}
                      placeholder="e.g. 10:00 AM - 11:00 PM (or Closed)"
                      className="rounded-xl border-gray-200 text-xs py-2 bg-white font-medium"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
            >
              <Save size={14} />
              {loading ? "Saving Schedule..." : "Save Operating Hours"}
            </Button>
          </div>
        </div>

        {/* Right 1 Col: Quick Tips Card */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-5 space-y-4">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sun size={14} className="text-amber-500" /> Dining Hours Information
          </h4>

          <div className="space-y-3 text-xs text-gray-600">
            <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1">
              <span className="font-bold text-gray-900 block">Customer Facing Display</span>
              <p className="text-[11px] text-gray-500">
                These timings are displayed on your public digital menu and printed receipts.
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-gray-200/70 space-y-1">
              <span className="font-bold text-gray-900 block">Marking a Day Closed</span>
              <p className="text-[11px] text-gray-500">
                Simply write &quot;Closed&quot; in the timing field for holidays or off-days.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
