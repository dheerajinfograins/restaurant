"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Mail,
  Phone,
  Camera,
  Trash2,
  KeyRound,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Sparkles,
  Upload,
  Shield,
  Save,
  MapPin,
  Store,
  AlertCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const isConfiguredRemoteDomain = (url?: string | null) => {
  if (!url) return false;
  return (
    url.startsWith("https://images.unsplash.com") ||
    url.startsWith("https://res.cloudinary.com")
  );
};

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  image?: string | null;
  createdAt?: string;
  lastLoginAt?: string | null;
  restaurant?: {
    id: string;
    name: string;
    logo?: string | null;
    email?: string;
    phone?: string;
    address?: string;
  } | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
};

const validatePasswordChange = (
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string
): string | null => {
  if (!newPassword) return null;
  if (!currentPassword) return "Current password is required to set a new password";
  if (newPassword.length < 6) return "New password must be at least 6 characters";
  if (!/^[A-Z]/.test(newPassword)) return "New password must start with a Capital letter (A-Z)";
  if (!/[a-z]/.test(newPassword) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
    return "New password must contain lowercase letters and a number or symbol";
  }
  if (newPassword !== confirmPassword) return "New password and confirmation do not match";
  return null;
};

const validateProfileForm = (data: ProfileFormData): string | null => {
  if (!data.name.trim()) return "Full name is required";
  if (!data.email.trim()) return "Email address is required";
  return validatePasswordChange(data.currentPassword, data.newPassword, data.confirmPassword);
};

export default function ProfileClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get("/api/account");
      if (res.data?.data) {
        const data = res.data.data;
        setProfile(data);
        setImagePreview(data.image || null);
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        }));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      toast.error("Failed to load profile details");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadProfile = async () => {
      try {
        const res = await axios.get("/api/account");
        if (!ignore && res.data?.data) {
          const data = res.data.data;
          setProfile(data);
          setImagePreview(data.image || null);
          setFormData((prev) => ({
            ...prev,
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
          }));
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch profile:", err);
          toast.error("Failed to load profile details");
        }
      } finally {
        if (!ignore) {
          setFetching(false);
        }
      }
    };

    void loadProfile();

    return () => {
      ignore = true;
    };
  }, []);

  // Handle Photo File Selection & Cloudinary Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    if (!file.type.startsWith("image/")) {
      const msg = "Please select a valid image file (PNG, JPG, WEBP)";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = "Image size must be less than 5MB";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    // Instant local preview
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
        setProfile((prev) => (prev ? { ...prev, image: uploadedUrl } : null));
        toast.success("Photo uploaded! Click 'Save Changes' to update your account.");
      }
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      const errorMsg = getApiErrorMessage(err, "Failed to upload photo");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setProfile((prev) => (prev ? { ...prev, image: null } : null));
    setErrorMessage(null);
    toast.success("Photo removed. Click 'Save Changes' to apply.");
  };

  const handleSave = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validateProfileForm(formData);
    if (validationError) {
      setErrorMessage(validationError);
      toast.error(validationError);
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

      if (formData.newPassword && formData.currentPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      await axios.patch("/api/account", payload);

      setSuccessMessage("Profile & Account Settings updated successfully!");
      toast.success("Profile & Account Settings updated successfully!");

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      void fetchProfile();
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      const errorMsg = getApiErrorMessage(err, "Failed to update profile");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500">Loading your profile details...</p>
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

  const roleFormatted = (profile?.role || "SUPER_ADMIN").replaceAll("_", " ");

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top Banner Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-culinary-primary via-culinary-secondary to-amber-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
        <div className="relative flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            {/* Avatar with Camera badge */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-3xl overflow-hidden bg-white/20 border-3 border-white/90 shadow-2xl flex items-center justify-center relative">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={formData.name || "Profile Photo"}
                    fill
                    sizes="112px"
                    unoptimized={!isConfiguredRemoteDomain(imagePreview)}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-culinary-primary flex items-center justify-center text-white font-bold text-3xl font-cormorant">
                    {initials}
                  </div>
                )}

                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleImageFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="absolute -bottom-1.5 -right-1.5 p-2.5 bg-white text-culinary-primary rounded-2xl shadow-lg border border-gray-100 hover:bg-amber-50 hover:scale-110 active:scale-95 transition-all duration-200"
                title="Change Photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-bold font-cormorant text-white">
                  {formData.name || "Administrator"}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                  {roleFormatted}
                </span>
              </div>
              <p className="text-xs md:text-sm text-white/80 flex items-center justify-center md:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-200" />
                {formData.email}
              </p>
              {profile?.restaurant?.name && (
                <p className="text-xs text-white/70 flex items-center justify-center md:justify-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-200" />
                  {profile.restaurant.name}
                </p>
              )}
            </div>
          </div>

          {/* Photo Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="bg-white/95 hover:bg-white text-culinary-primary text-xs font-bold rounded-2xl h-10 px-4 gap-2 shadow-md"
            >
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload Photo
            </Button>
            {imagePreview && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleRemovePhoto}
                className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-200/40 text-xs font-bold rounded-2xl h-10 px-4 gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove Photo
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Message Banner (Error / Success) */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl flex items-start justify-between gap-3 text-xs text-red-800 animate-in fade-in duration-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">Notice</p>
              <p className="text-red-700 mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold text-sm">{successMessage}</p>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Personal Information & Restaurant Badge */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Personal Details */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-culinary-primary rounded-2xl border border-amber-100">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-cormorant text-gray-900">
                      Personal Information
                    </h2>
                    <p className="text-xs text-gray-500">
                      Update your display name, official email address, and phone number.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-culinary-primary" /> Full Name
                  </Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alexander Vance"
                    className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 focus-visible:ring-culinary-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-culinary-primary" /> Email Address (Login ID)
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@restaurant.com"
                    className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 focus-visible:ring-culinary-primary"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-culinary-primary" /> Phone Number
                  </Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 focus-visible:ring-culinary-primary"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Security & Password */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-cormorant text-gray-900">
                      Security & Password
                    </h2>
                    <p className="text-xs text-gray-500">
                      Change your account login password. Leave blank if not updating.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <Label className="text-xs font-bold text-gray-700">Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="Enter current password to verify"
                      className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold text-gray-700">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Minimum 6 characters"
                        className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 relative">
                    <Label className="text-xs font-bold text-gray-700">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPw ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        className="rounded-2xl border-gray-200 text-sm py-2.5 bg-gray-50/50 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Role Privileges & Restaurant Details */}
          <div className="space-y-6">
            
            {/* Account Summary Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-5">
              <h3 className="font-bold text-gray-900 text-base font-cormorant flex items-center gap-2">
                <Shield className="w-4 h-4 text-culinary-primary" /> Role Privileges
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-500 font-medium">Assigned Role</span>
                  <span className="font-bold text-culinary-primary uppercase">{roleFormatted}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-500 font-medium">Account Status</span>
                  <span className="font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                </div>

                {profile?.createdAt && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-gray-500 font-medium">Member Since</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Restaurant Info Card */}
            {profile?.restaurant && (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-gray-900 text-base font-cormorant flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-600" /> Restaurant Affiliation
                </h3>

                <div className="flex items-center gap-3 p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  {profile.restaurant.logo ? (
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-200 shrink-0">
                      <Image
                        src={profile.restaurant.logo}
                        alt={profile.restaurant.name || "Restaurant logo"}
                        fill
                        sizes="40px"
                        unoptimized={!isConfiguredRemoteDomain(profile.restaurant.logo)}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-culinary-primary text-white flex items-center justify-center font-bold text-sm font-cormorant">
                      {profile.restaurant.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-900">{profile.restaurant.name}</p>
                    <p className="text-[11px] text-gray-500">{profile.restaurant.email || profile.restaurant.phone}</p>
                  </div>
                </div>

                {profile.restaurant.address && (
                  <p className="text-xs text-gray-500 flex items-start gap-1.5 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>{profile.restaurant.address}</span>
                  </p>
                )}
              </div>
            )}

            {/* Sticky Save Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-3xl border border-amber-200/80 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-culinary-primary font-bold text-sm">
                <Sparkles className="w-4 h-4" /> Save Profile Updates
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Click save below to immediately apply your changes to your session, navbar, and staff audit trails.
              </p>
              <Button
                type="submit"
                disabled={loading || uploadingImage}
                className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-2xl py-6 text-sm gap-2 shadow-lg shadow-culinary-primary/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
