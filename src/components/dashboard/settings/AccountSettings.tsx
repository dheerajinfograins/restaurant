"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  UserCircle,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  Mail,
  User,
  Phone,
  Camera,
  Trash2,
  Upload,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";

const isConfiguredRemoteDomain = (url?: string | null) => {
  if (!url) return false;
  return (
    url.startsWith("https://images.unsplash.com") ||
    url.startsWith("https://res.cloudinary.com")
  );
};

export default function AccountSettings({ refresh }: { readonly refresh: () => void }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [role, setRole] = useState("SUPER_ADMIN");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    let ignore = false;

    const loadAccount = async () => {
      try {
        const res = await axios.get("/api/account");
        if (!ignore && res.data?.data) {
          const u = res.data.data;
          setFormData((prev) => ({
            ...prev,
            name: u.name || "",
            email: u.email || "",
            phone: u.phone || "",
          }));
          setImagePreview(u.image || null);
          setRole(u.role || "SUPER_ADMIN");
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load account settings:", err);
        }
      } finally {
        if (!ignore) {
          setFetching(false);
        }
      }
    };

    void loadAccount();

    return () => {
      ignore = true;
    };
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("folder", "avatars");

    try {
      const res = await axios.post("/api/upload?folder=avatars", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = res.data?.data?.url;
      if (uploadedUrl) {
        setImagePreview(uploadedUrl);
        toast.success("Photo uploaded! Click Save to apply.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    toast.success("Photo removed. Click Save to apply.");
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);
    try {
      const payload: {
        name: string;
        email: string;
        phone: string | null;
        image: string | null;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        image: imagePreview,
      };

      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast.error("Current password is required to change your password");
          setLoading(false);
          return;
        }
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      await axios.patch("/api/account", payload);
      toast.success("Account profile & security updated successfully!");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      refresh();
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update account");
      } else {
        toast.error("Failed to update account");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12 space-x-2">
        <Loader2 className="w-5 h-5 text-culinary-primary animate-spin" />
        <span className="text-xs text-gray-500 font-medium">Loading account details...</span>
      </div>
    );
  }

  const initials = formData.name.trim()
    ? formData.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-culinary-primary rounded-xl border border-amber-100 shadow-sm">
            <UserCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Administrator Profile & Security
            </h2>
            <p className="text-xs text-gray-500">
              Update personal administrator details, avatar photo, and reset account login password.
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Management Card */}
      <div className="bg-gradient-to-r from-amber-50/60 to-orange-50/40 rounded-2xl border border-amber-200/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-amber-300 shadow-md flex items-center justify-center relative">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt={formData.name || "Avatar"}
                  fill
                  sizes="64px"
                  unoptimized={!isConfiguredRemoteDomain(imagePreview)}
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-culinary-primary flex items-center justify-center text-white font-bold text-xl font-cormorant">
                  {initials}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white text-culinary-primary rounded-lg shadow border border-gray-200 hover:bg-amber-50 transition"
              title="Upload photo"
            >
              <Camera size={13} />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-900 text-sm font-cormorant">{formData.name || "Administrator"}</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <ShieldCheck size={11} /> {role.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Avatar image used across dashboard and receipts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={handleImageFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="rounded-xl text-xs font-semibold h-8 gap-1.5 bg-white border-amber-200 text-amber-900 hover:bg-amber-100/50"
          >
            {uploadingImage ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            Upload Photo
          </Button>
          {imagePreview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              className="rounded-xl text-xs font-semibold h-8 gap-1.5 bg-white border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} />
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profile Card */}
        <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5 space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <User size={15} className="text-culinary-primary" /> Administrator Profile
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <User size={12} className="text-gray-400" /> Full Name
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Mail size={12} className="text-gray-400" /> Email Address (Login ID)
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@restaurant.com"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Phone size={12} className="text-gray-400" /> Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5 space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <KeyRound size={15} className="text-amber-600" /> Change Login Password
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-gray-700">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Required only to change password"
                  className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-gray-700">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter secure new password (min 6 chars)"
                  className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button
          onClick={handleSave}
          disabled={loading || uploadingImage}
          className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {loading ? "Updating Account..." : "Save Account Settings"}
        </Button>
      </div>
    </div>
  );
}
