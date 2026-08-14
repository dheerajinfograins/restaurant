"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Sparkles, 
  CheckCircle2, 
  Store, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  QrCode, 
  UtensilsCrossed, 
  Users,
  BarChart3,
  Image as ImageIcon,
  Check,
  CheckCircle,
  Clock,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const PRESET_COVERS = [
  {
    name: "Modern Bistro",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Luxury Dining",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Artisan Cafe",
    url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Grill & Bar",
    url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function RestaurantProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [initialData, setInitialData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    website: "",
    description: "",
    logo: "",
    coverImage: "",
    isActive: true,
  });

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get("/api/restaurant");
      const profile = data.data;
      const loaded = {
        name: profile.name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "India",
        pincode: profile.pincode || "",
        website: profile.website || "",
        description: profile.description || "",
        logo: profile.logo || "",
        coverImage: profile.coverImage || PRESET_COVERS[0].url,
        isActive: profile.isActive ?? true,
      };
      setFormData(loaded);
      setInitialData(loaded);
    } catch (error) {
      console.error("Error loading restaurant profile:", error);
      toast.error("Failed to load restaurant profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Restaurant Name is required");
      return;
    }

    setSaving(true);
    try {
      await axios.patch("/api/restaurant", formData);
      toast.success("Restaurant profile saved successfully!");
      setInitialData(formData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      toast("Changes reset", { icon: "↩️" });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading restaurant profile & branding...</p>
      </div>
    );
  }

  const coverUrl = formData.coverImage || PRESET_COVERS[0].url;
  const initial = formData.name ? formData.name.charAt(0).toUpperCase() : "R";

  return (
    <div className="space-y-6 font-sans pb-16">
      
      {/* ===================== HERO BRAND BANNER ===================== */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 shadow-sm bg-gray-950">
        {/* Cover Image Backdrop */}
        <div className="h-44 md:h-52 w-full relative">
          <img
            src={coverUrl}
            alt="Restaurant Cover"
            className="w-full h-full object-cover opacity-60 filter brightness-90 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        </div>

        {/* Hero Overlay Content */}
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center md:items-end gap-4">
            {/* Logo Monogram */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white font-bold text-2xl md:text-3xl flex items-center justify-center shadow-2xl border-2 border-white/80 shrink-0 font-cormorant">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                initial
              )}
            </div>

            {/* Restaurant Meta */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-white font-cormorant tracking-tight">
                  {formData.name || "Restaurant Name"}
                </h2>
                <Badge
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    formData.isActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      formData.isActive ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                    }`}
                  ></span>
                  {formData.isActive ? "OPEN FOR DINING" : "CURRENTLY CLOSED"}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-300 flex-wrap">
                {formData.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-amber-400" />
                    {formData.city}, {formData.state || formData.country}
                  </span>
                )}
                {formData.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-amber-400" />
                    {formData.phone}
                  </span>
                )}
                <span className="text-amber-400/80 font-bold">• Currency: ₹ INR</span>
              </div>
            </div>
          </div>

          {/* Quick Toggle Live Dining Service */}
          <div className="flex items-center gap-3 bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-gray-700/80 text-xs">
            <div className="text-right">
              <p className="font-bold text-white text-xs">Accepting Orders</p>
              <p className="text-[10px] text-gray-400">Live Customer Dining</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
            />
          </div>
        </div>
      </div>

      {/* ===================== UNIFIED 2-COLUMN WORKSPACE ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Complete Configuration Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SECTION 1: Brand & Concept Story */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-culinary-primary rounded-xl border border-amber-100">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-cormorant text-xl">
                    Brand Identity & Story
                  </h3>
                  <p className="text-xs text-gray-400">Establish your dining establishment name, logo, and concept.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Section 1</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Official Restaurant Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. The Daily Grind & Gather"
                  className="rounded-xl border-gray-200 text-xs py-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Description & Concept Story</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell guests about your specialty cuisines, ambiance, and dining philosophy..."
                  rows={3}
                  className="rounded-xl border-gray-200 text-xs resize-none"
                />
              </div>

              {/* Cover Banner Presets */}
              <div className="space-y-2 pt-1">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-culinary-primary" /> Cover Banner Ambiance Presets
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PRESET_COVERS.map((preset) => {
                    const isSelected = formData.coverImage === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, coverImage: preset.url })}
                        className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all text-left group ${
                          isSelected
                            ? "border-culinary-primary ring-2 ring-culinary-primary/30"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex items-end p-1.5">
                          <span className="text-[10px] font-bold text-white truncate">{preset.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-culinary-primary text-white rounded-full p-0.5 shadow-md">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Logo Image URL</Label>
                  <Input
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://.../logo.png"
                    className="rounded-xl border-gray-200 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Custom Cover Image URL</Label>
                  <Input
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://.../banner.jpg"
                    className="rounded-xl border-gray-200 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Contact Channels & Online Presence */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-cormorant text-xl">
                    Contact Channels & Online Presence
                  </h3>
                  <p className="text-xs text-gray-400">Direct phone numbers, official email, and website for diners.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Section 2</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Phone size={13} className="text-gray-400" /> Primary Phone Number *
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="rounded-xl border-gray-200 text-xs py-2.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" /> Official Business Email *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@restaurant.com"
                  className="rounded-xl border-gray-200 text-xs py-2.5"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Globe size={13} className="text-gray-400" /> Official Website URL
                </Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.yourrestaurant.com"
                  className="rounded-xl border-gray-200 text-xs py-2.5"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Dining Location & Billing Address */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-cormorant text-xl">
                    Dining Location & Billing Address
                  </h3>
                  <p className="text-xs text-gray-400">Physical address printed on receipts, invoices, and table QR orders.</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Section 3</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Street Address & Landmark *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. AB Road, Main Road, Bhawarkhua"
                  className="rounded-xl border-gray-200 text-xs py-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Indore"
                    className="rounded-xl border-gray-200 text-xs py-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">State / Province</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Madhya Pradesh"
                    className="rounded-xl border-gray-200 text-xs py-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="e.g. India"
                    className="rounded-xl border-gray-200 text-xs py-2.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">Postal PIN Code</Label>
                  <Input
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="e.g. 452001"
                    className="rounded-xl border-gray-200 text-xs py-2.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Save Action Bar */}
          <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 p-4 shadow-lg flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs rounded-xl gap-1.5 border-gray-200 text-gray-600 hover:text-gray-900"
            >
              <RotateCcw size={13} /> Discard Changes
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-7 text-xs gap-2 shadow-sm h-10"
            >
              <Save size={15} />
              {saving ? "Saving Profile..." : "Save Restaurant Profile"}
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Customer Preview Card & Hub Shortcuts (1/3 width) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          
          {/* Live Customer Preview Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Store size={13} className="text-culinary-primary" /> Live Customer Card
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Preview
              </span>
            </div>

            {/* Mock Mobile View Card */}
            <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
              <div className="h-28 w-full relative bg-gray-900">
                <img
                  src={coverUrl}
                  alt="Customer Preview"
                  className="w-full h-full object-cover opacity-80 transition-all duration-300"
                />
                <div className="absolute top-2.5 right-2.5">
                  <Badge
                    className={`text-[10px] font-bold ${
                      formData.isActive
                        ? "bg-emerald-600 text-white border-none"
                        : "bg-rose-600 text-white border-none"
                    }`}
                  >
                    {formData.isActive ? "OPEN" : "CLOSED"}
                  </Badge>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-culinary-primary text-white font-bold text-lg flex items-center justify-center shrink-0 font-cormorant">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 truncate font-cormorant text-base">
                      {formData.name || "Restaurant Name"}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {formData.city || "City"}, {formData.country || "India"}
                    </p>
                  </div>
                </div>

                {formData.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed bg-gray-50 p-2 rounded-lg">
                    {formData.description}
                  </p>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Phone size={11} className="text-culinary-primary" />
                    {formData.phone || "No phone"}
                  </span>
                  <span className="text-[11px] font-bold text-culinary-primary">
                    Currency: ₹ INR
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Digital Menu Preview Button */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-50 hover:bg-amber-100/80 text-culinary-primary rounded-xl text-xs font-bold border border-amber-200/80 transition-colors"
            >
              <QrCode size={14} /> Open Customer Digital Menu <ExternalLink size={12} />
            </Link>
          </div>

          {/* Quick Hub Navigation Shortcuts */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-culinary-primary" /> Restaurant Management Hub
            </h4>

            <div className="space-y-2 pt-1">
              <Link
                href="/dashboard/tables"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-amber-50 hover:text-culinary-primary transition-colors text-xs font-semibold text-gray-700 border border-gray-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed size={15} className="text-gray-400 group-hover:text-culinary-primary" />
                  <span>Dining Tables & QR Codes</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </Link>

              <Link
                href="/dashboard/products"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-amber-50 hover:text-culinary-primary transition-colors text-xs font-semibold text-gray-700 border border-gray-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <Store size={15} className="text-gray-400 group-hover:text-culinary-primary" />
                  <span>Menu & Dishes Catalog</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </Link>

              <Link
                href="/dashboard/staff"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-amber-50 hover:text-culinary-primary transition-colors text-xs font-semibold text-gray-700 border border-gray-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={15} className="text-gray-400 group-hover:text-culinary-primary" />
                  <span>Staff Team & Roles</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </Link>

              <Link
                href="/dashboard/reports"
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-amber-50 hover:text-culinary-primary transition-colors text-xs font-semibold text-gray-700 border border-gray-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 size={15} className="text-gray-400 group-hover:text-culinary-primary" />
                  <span>Financial Reports & Analytics</span>
                </div>
                <ExternalLink size={13} className="text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
