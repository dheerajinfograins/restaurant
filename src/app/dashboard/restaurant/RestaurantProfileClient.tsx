"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
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
  Layers,
  UploadCloud,
  Loader2,
  Trash2,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

const isConfiguredRemoteDomain = (url?: string | null) => {
  if (!url) return false;
  return url.startsWith("https://images.unsplash.com") || url.startsWith("https://res.cloudinary.com");
};

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

const HUB_NAVIGATION_LINKS = [
  {
    href: "/dashboard/tables",
    title: "Dining Tables & QR Codes",
    icon: UtensilsCrossed,
  },
  {
    href: "/dashboard/products",
    title: "Menu & Dishes Catalog",
    icon: Store,
  },
  {
    href: "/dashboard/staff",
    title: "Staff Team & Roles",
    icon: Users,
  },
  {
    href: "/dashboard/reports",
    title: "Financial Reports & Analytics",
    icon: BarChart3,
  },
];

interface RestaurantProfileFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  website: string;
  description: string;
  logo: string;
  coverImage: string;
  isActive: boolean;
}

const DEFAULT_FORM_DATA: RestaurantProfileFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  website: "",
  description: "",
  logo: "",
  coverImage: PRESET_COVERS[0].url,
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.data?.message) {
    return error.response.data.message;
  }
  return fallback;
}

interface RestaurantProfileResponse {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  website?: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  isActive?: boolean;
}

function mapProfileToFormData(profile?: RestaurantProfileResponse | null): RestaurantProfileFormData {
  if (!profile) return DEFAULT_FORM_DATA;
  return {
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
}

async function uploadImageFile(
  file: File,
  folder: "restaurant/logos" | "restaurant/covers"
): Promise<string | null> {
  if (!file.type.startsWith("image/")) {
    toast.error("Please select a valid image file (PNG, JPG, WEBP)");
    return null;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error("Image size must be less than 10MB");
    return null;
  }

  const toastId = toast.loading("Uploading to Cloudinary...");
  try {
    const formPayload = new FormData();
    formPayload.append("file", file);
    formPayload.append("folder", folder);

    const res = await axios.post(`/api/upload?folder=${folder}`, formPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const uploadedUrl = res.data?.data?.url;
    if (uploadedUrl) {
      toast.success("Uploaded to Cloudinary successfully!", { id: toastId });
      return uploadedUrl;
    }
    toast.error("Upload failed: No URL returned", { id: toastId });
    return null;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    toast.error(getErrorMessage(error, "Failed to upload image to Cloudinary"), { id: toastId });
    return null;
  }
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent" />
      <p className="text-sm font-semibold text-gray-500">Loading restaurant profile & branding...</p>
    </div>
  );
}

interface HeroBannerProps {
  readonly formData: RestaurantProfileFormData;
  readonly coverUrl: string;
  readonly initial: string;
  readonly onToggleActive: (val: boolean) => void;
}

function RestaurantHeroBanner({ formData, coverUrl, initial, onToggleActive }: Readonly<HeroBannerProps>) {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-gray-200/90 shadow-sm bg-gray-950">
      {/* Cover Image Backdrop */}
      <div className="h-44 md:h-52 w-full relative">
        <Image
          src={coverUrl}
          alt="Restaurant Cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
          unoptimized={!isConfiguredRemoteDomain(coverUrl)}
          className="object-cover opacity-60 filter brightness-90 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
      </div>

      {/* Hero Overlay Content */}
      <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="flex items-center md:items-end gap-4">
          {/* Logo Monogram */}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white font-bold text-2xl md:text-3xl flex items-center justify-center shadow-2xl border-2 border-white/80 shrink-0 font-cormorant relative overflow-hidden">
            {formData.logo ? (
              <Image
                src={formData.logo}
                alt="Logo"
                fill
                sizes="80px"
                unoptimized={!isConfiguredRemoteDomain(formData.logo)}
                className="object-cover rounded-2xl"
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
                />
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
            onCheckedChange={onToggleActive}
          />
        </div>
      </div>
    </div>
  );
}

interface PreviewCardProps {
  readonly formData: RestaurantProfileFormData;
  readonly coverUrl: string;
  readonly initial: string;
}

function LiveCustomerPreviewCard({ formData, coverUrl, initial }: Readonly<PreviewCardProps>) {
  return (
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
          <Image
            src={coverUrl}
            alt="Customer Preview"
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={!isConfiguredRemoteDomain(coverUrl)}
            className="object-cover opacity-80 transition-all duration-300"
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
  );
}

function RestaurantHubNavigation() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
        <Layers size={14} className="text-culinary-primary" /> Restaurant Management Hub
      </h4>

      <div className="space-y-2 pt-1">
        {HUB_NAVIGATION_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-amber-50 hover:text-culinary-primary transition-colors text-xs font-semibold text-gray-700 border border-gray-100 group"
            >
              <div className="flex items-center gap-2.5">
                <Icon size={15} className="text-gray-400 group-hover:text-culinary-primary" />
                <span>{link.title}</span>
              </div>
              <ExternalLink size={13} className="text-gray-400" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function RestaurantProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [initialData, setInitialData] = useState<RestaurantProfileFormData | null>(null);
  const [formData, setFormData] = useState<RestaurantProfileFormData>(DEFAULT_FORM_DATA);

  const handleUpload = async (
    file: File,
    folder: "restaurant/logos" | "restaurant/covers",
    setUploading: (val: boolean) => void,
    field: "logo" | "coverImage"
  ) => {
    setUploading(true);
    const url = await uploadImageFile(file, folder);
    setUploading(false);
    if (url) {
      setFormData((prev) => ({ ...prev, [field]: url }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const { data } = await axios.get("/api/restaurant");
        if (isMounted) {
          const loaded = mapProfileToFormData(data.data);
          setFormData(loaded);
          setInitialData(loaded);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error loading restaurant profile:", error);
          toast.error("Failed to load restaurant profile");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save profile"));
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
    return <LoadingState />;
  }

  const coverUrl = formData.coverImage || PRESET_COVERS[0].url;
  const initial = formData.name ? formData.name.charAt(0).toUpperCase() : "R";

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* ===================== HERO BRAND BANNER ===================== */}
      <RestaurantHeroBanner
        formData={formData}
        coverUrl={coverUrl}
        initial={initial}
        onToggleActive={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
      />

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
                        <Image
                          src={preset.url}
                          alt={preset.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent flex items-end p-1.5 z-10">
                          <span className="text-[10px] font-bold text-white truncate">{preset.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-culinary-primary text-white rounded-full p-0.5 shadow-md z-10">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Uploads & Cloudinary Sync */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                {/* Logo Uploader */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Camera size={14} className="text-culinary-primary" /> Official Brand Logo
                    </Label>
                    {formData.logo && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                        className="text-[10px] text-rose-500 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={10} /> Remove
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {formData.logo ? (
                        <Image
                          src={formData.logo}
                          alt="Logo preview"
                          fill
                          sizes="56px"
                          unoptimized={!isConfiguredRemoteDomain(formData.logo)}
                          className="object-cover"
                        />
                      ) : (
                        <span className="font-cormorant text-xl font-bold text-culinary-primary">
                          {initial}
                        </span>
                      )}
                      {uploadingLogo && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        id="restaurant-logo-input"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleUpload(file, "restaurant/logos", setUploadingLogo, "logo");
                            e.target.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo}
                        onClick={() => document.getElementById("restaurant-logo-input")?.click()}
                        className="w-full text-xs h-8 border-gray-200 hover:bg-amber-50/50 hover:border-amber-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-culinary-primary" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} className="text-culinary-primary" />
                            <span>{formData.logo ? "Change Logo (Cloudinary)" : "Upload Logo (Cloudinary)"}</span>
                          </>
                        )}
                      </Button>
                      <Input
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="Or enter logo image URL"
                        className="rounded-xl border-gray-200 text-[11px] h-7 px-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Cover Uploader */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-culinary-primary" /> Custom Cover Banner
                    </Label>
                    {formData.coverImage && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, coverImage: PRESET_COVERS[0].url }))}
                        className="text-[10px] text-gray-400 hover:underline"
                      >
                        Reset Preset
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                      <Image
                        src={formData.coverImage || PRESET_COVERS[0].url}
                        alt="Cover preview"
                        fill
                        sizes="56px"
                        unoptimized={!isConfiguredRemoteDomain(formData.coverImage || PRESET_COVERS[0].url)}
                        className="object-cover"
                      />
                      {uploadingCover && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <Loader2 size={16} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        type="file"
                        id="restaurant-cover-input"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleUpload(file, "restaurant/covers", setUploadingCover, "coverImage");
                            e.target.value = "";
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingCover}
                        onClick={() => document.getElementById("restaurant-cover-input")?.click()}
                        className="w-full text-xs h-8 border-gray-200 hover:bg-amber-50/50 hover:border-amber-300 transition-all flex items-center justify-center gap-1.5"
                      >
                        {uploadingCover ? (
                          <>
                            <Loader2 size={12} className="animate-spin text-culinary-primary" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={13} className="text-culinary-primary" />
                            <span>Upload Banner (Cloudinary)</span>
                          </>
                        )}
                      </Button>
                      <Input
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="Or enter banner image URL"
                        className="rounded-xl border-gray-200 text-[11px] h-7 px-2"
                      />
                    </div>
                  </div>
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
          <LiveCustomerPreviewCard
            formData={formData}
            coverUrl={coverUrl}
            initial={initial}
          />
          <RestaurantHubNavigation />
        </div>
      </div>
    </div>
  );
}
