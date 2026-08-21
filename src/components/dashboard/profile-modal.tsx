"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  restaurant?: {
    id: string;
    name: string;
    logo?: string | null;
  } | null;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    email: string;
    role: string;
    image?: string | null;
  };
  onProfileUpdated?: (updatedUser: { name: string; email: string; role: string; image?: string | null }) => void;
}

// --- Extracted Helper Functions ---

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "AD";
  return trimmed
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleTitle(role?: string): string {
  const normalized = role?.toUpperCase() || "";
  switch (normalized) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "Administrator Profile Settings";
    case "MANAGER":
      return "Manager Profile Settings";
    case "WAITER":
      return "Waiter Profile Settings";
    case "CHEF":
      return "Chef Profile Settings";
    case "KITCHEN":
      return "Kitchen Profile Settings";
    case "CASHIER":
      return "Cashier Profile Settings";
    default: {
      if (!role) return "Profile Settings";
      const formatted = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase().replaceAll("_", " ");
      return `${formatted} Profile Settings`;
    }
  }
}

function roleDisplayName(role?: string): string {
  const normalized = role?.toUpperCase() || "";
  switch (normalized) {
    case "SUPER_ADMIN":
      return "Administrator";
    case "ADMIN":
      return "Administrator";
    case "MANAGER":
      return "Manager";
    case "WAITER":
      return "Waiter";
    case "CHEF":
      return "Chef";
    case "KITCHEN":
      return "Kitchen Staff";
    case "CASHIER":
      return "Cashier";
    default:
      return role?.replaceAll("_", " ") || "Staff Member";
  }
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please select a valid image file (PNG, JPG, WEBP)";
  }
  if (file.size > 5 * 1024 * 1024) {
    return "Image size must be less than 5MB";
  }
  return null;
}

function validatePasswordChange(
  currentPassword?: string,
  newPassword?: string,
  confirmPassword?: string
): string | null {
  if (!newPassword) return null;
  if (!currentPassword) {
    return "Current password is required to change your password";
  }
  if (newPassword.length < 6) {
    return "New password must be at least 6 characters";
  }
  if (newPassword !== confirmPassword) {
    return "New password and confirm password do not match";
  }
  return null;
}

function validateProfileForm(formData: ProfileFormData): string | null {
  if (!formData.name.trim()) {
    return "Full name is required";
  }
  if (!formData.email.trim()) {
    return "Email address is required";
  }
  return validatePasswordChange(
    formData.currentPassword,
    formData.newPassword,
    formData.confirmPassword
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

function buildProfilePayload(formData: ProfileFormData, imagePreview: string | null) {
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

  return payload;
}

// --- Extracted Tab Subcomponents ---

interface GeneralTabContentProps {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  profile: UserProfileData;
  roleFormatted: string;
}

function GeneralTabContent({
  formData,
  setFormData,
  profile,
  roleFormatted,
}: Readonly<GeneralTabContentProps>) {
  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* Photo Info Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex items-start gap-2.5 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-amber-100/80 text-amber-700 rounded-lg sm:rounded-xl shrink-0 mt-0.5">
          <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <div className="text-[11px] sm:text-xs space-y-0.5 sm:space-y-1">
          <p className="font-bold text-amber-900">Profile Photo Management</p>
          <p className="text-amber-700/90 leading-relaxed hidden sm:block">
            Your avatar appears in the top navigation bar, order logs, kitchen comments, and audit trails.
            Supported formats: JPG, PNG, WEBP (Max 5MB).
          </p>
          <p className="text-amber-700/90 leading-tight sm:hidden">
            Your avatar appears in order logs & floor sync. Max 5MB (JPG, PNG, WEBP).
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-1.5 sm:col-span-2">
          <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-culinary-primary" /> Full Name
          </Label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Ram Patidar"
            className="rounded-xl border-gray-200 text-xs py-2 bg-white focus-visible:ring-culinary-primary"
            required
          />
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-culinary-primary" /> Email Address
          </Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="user@restaurant.com"
            className="rounded-xl border-gray-200 text-xs py-2 bg-white focus-visible:ring-culinary-primary"
            required
          />
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-culinary-primary" /> Phone Number
          </Label>
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+91 98765 43210"
            className="rounded-xl border-gray-200 text-xs py-2 bg-white focus-visible:ring-culinary-primary"
          />
        </div>
      </div>

      {/* Account Metadata Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1 sm:pt-2">
        <div className="p-2 sm:p-3.5 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200/80">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Access Role</p>
          <p className="text-[11px] sm:text-xs font-bold text-gray-800 mt-0.5 sm:mt-1 flex items-center gap-1 truncate">
            <ShieldCheck className="w-3 h-3 text-green-600 shrink-0" />
            <span className="truncate">{roleFormatted}</span>
          </p>
        </div>

        <div className="p-2 sm:p-3.5 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200/80">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Restaurant</p>
          <p className="text-[11px] sm:text-xs font-bold text-gray-800 mt-0.5 sm:mt-1 truncate">
            {profile.restaurant?.name || "The Daily Grind"}
          </p>
        </div>

        <div className="p-2 sm:p-3.5 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-200/80">
          <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
          <p className="text-[11px] sm:text-xs font-bold text-green-600 mt-0.5 sm:mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            Active
          </p>
        </div>
      </div>
    </div>
  );
}

interface SecurityTabContentProps {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
}

function SecurityTabContent({
  formData,
  setFormData,
}: Readonly<SecurityTabContentProps>) {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
          <KeyRound className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-blue-900">Change Account Password</p>
          <p className="text-blue-700/90 leading-relaxed">
            To update your login password, enter your current password followed by your desired new password.
            Leave these fields empty if you do not wish to change your password.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5 relative">
          <Label className="text-xs font-bold text-gray-700">Current Password</Label>
          <div className="relative">
            <Input
              type={showCurrentPw ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Enter your current password"
              className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 relative">
            <Label className="text-xs font-bold text-gray-700">New Password</Label>
            <div className="relative">
              <Input
                type={showNewPw ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Minimum 6 characters"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 relative">
            <Label className="text-xs font-bold text-gray-700">Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirmPw ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Re-type new password"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Modal Component ---

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: Readonly<ProfileModalProps>) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileData>({
    id: "",
    name: currentUser?.name || "Admin",
    email: currentUser?.email || "",
    phone: "",
    role: currentUser?.role || "SUPER_ADMIN",
    image: currentUser?.image || null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(currentUser?.image || null);
  const [activeSection, setActiveSection] = useState<"general" | "security">("general");

  // Form states
  const [formData, setFormData] = useState<ProfileFormData>({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch full account info whenever modal is opened
  useEffect(() => {
    if (!isOpen) return;

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
          console.error("Failed to load user profile:", err);
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
  }, [isOpen]);

  // Handle Photo File Selection & Cloudinary Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    const validationError = validateImageFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      toast.error(validationError);
      return;
    }

    // Instant local preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload directly via Cloudinary endpoint
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
        setProfile((prev) => ({ ...prev, image: uploadedUrl }));
        toast.success("Photo uploaded! Click Save to apply changes.");
      }
    } catch (err: unknown) {
      console.error("Image upload failed:", err);
      const errorMsg = getErrorMessage(err, "Failed to upload photo");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle Remove Photo
  const handleRemovePhoto = () => {
    setImagePreview(null);
    setProfile((prev) => ({ ...prev, image: null }));
    setErrorMessage(null);
    toast.success("Profile photo removed. Click Save to apply changes.");
  };

  // Handle Save
  const handleSaveProfile = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
      const payload = buildProfilePayload(formData, imagePreview);
      const res = await axios.patch("/api/account", payload);
      const updatedUser = res.data?.data;

      setSuccessMessage("Profile updated successfully!");
      toast.success("Profile updated successfully!");

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      if (updatedUser && onProfileUpdated) {
        onProfileUpdated({
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          image: updatedUser.image,
        });
      }

      router.refresh();
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: unknown) {
      console.error("Save profile error:", err);
      const errorMsg = getErrorMessage(err, "Failed to update profile");
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(formData.name);
  const roleFormatted = (profile.role || currentUser?.role || "WAITER").replaceAll("_", " ");
  const roleTitle = getRoleTitle(profile.role || currentUser?.role);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        {/* Header with decorative background */}
        <div className="relative bg-gradient-to-r from-culinary-primary via-culinary-secondary to-amber-700 p-3.5 sm:p-5 text-white shrink-0">
          <div className="absolute inset-0 bg-black/15 backdrop-blur-[1px]"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl border border-white/20 shadow-inner">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-cormorant tracking-wide text-white">
                  {roleTitle}
                </DialogTitle>
                <DialogDescription className="text-[10px] sm:text-xs text-amber-100/90 mt-0.5 line-clamp-1 sm:line-clamp-none">
                  Manage your personal details, avatar image, and security credentials.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* User Hero Preview Bar */}
          <div className="relative mt-3 sm:mt-4 flex flex-row items-center justify-between gap-3 pt-2.5 sm:pt-3.5 border-t border-white/20">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              {/* Avatar with Camera Overlay */}
              <div className="relative group shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-white/20 border-2 border-white/80 shadow-md flex items-center justify-center relative">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt={formData.name || "Profile photo"}
                      fill
                      sizes="(max-width: 640px) 48px, 64px"
                      unoptimized={!isConfiguredRemoteDomain(imagePreview)}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-amber-600 to-culinary-primary flex items-center justify-center text-white font-bold text-base sm:text-xl font-cormorant">
                      {initials}
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 bg-white text-culinary-primary rounded-lg sm:rounded-xl shadow-md border border-gray-100 hover:bg-amber-50 hover:scale-110 active:scale-95 transition-all duration-200"
                  title="Upload new photo"
                >
                  <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white font-cormorant leading-tight truncate">
                    {formData.name || roleDisplayName(profile.role || currentUser?.role)}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 sm:px-2.5 sm:py-0.5 rounded-full bg-amber-400/25 text-amber-100 border border-amber-300/30">
                    <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {roleFormatted}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-white/80 mt-0.5 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-amber-200 shrink-0" />
                  <span className="truncate">{formData.email || "No email"}</span>
                </p>
                {profile.restaurant?.name && (
                  <p className="text-[10px] sm:text-[11px] text-white/70 mt-0.5 flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-amber-200 shrink-0" />
                    <span className="truncate">{profile.restaurant.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Photo Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="bg-white/90 hover:bg-white text-culinary-primary text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl h-7 sm:h-8 px-2 sm:px-3 gap-1 shadow-xs"
              >
                {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                <span className="hidden sm:inline">Upload Photo</span>
                <span className="sm:hidden">Photo</span>
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-200/30 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl h-7 sm:h-8 px-2 sm:px-2.5 gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Message Banner (Error / Success) */}
        {errorMessage && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3.5 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl flex items-start justify-between gap-2.5 text-xs text-red-800 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Unable to Save</p>
                <p className="text-red-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-700 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl sm:rounded-2xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-3.5 sm:px-6 pt-2.5 sm:pt-3 pb-1 bg-gray-50/80 border-b border-gray-200/80 flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection("general")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              activeSection === "general"
                ? "bg-white text-culinary-primary shadow-xs border border-gray-200/80"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Personal Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("security")}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
              activeSection === "security"
                ? "bg-white text-culinary-primary shadow-xs border border-gray-200/80"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Security & Password
          </button>
        </div>

        {/* Modal Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 space-y-3">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-culinary-primary animate-spin" />
              <p className="text-xs font-medium text-gray-500">Loading profile data...</p>
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4 sm:space-y-6">
              {activeSection === "general" && (
                <GeneralTabContent
                  formData={formData}
                  setFormData={setFormData}
                  profile={profile}
                  roleFormatted={roleFormatted}
                />
              )}

              {activeSection === "security" && (
                <SecurityTabContent
                  formData={formData}
                  setFormData={setFormData}
                />
              )}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-2.5 sm:p-4 px-3.5 sm:px-6 bg-gray-50 border-t border-gray-200/80 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg sm:rounded-xl text-xs font-semibold px-3 sm:px-4 h-8 sm:h-9 border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              form="profile-form"
              disabled={loading || uploadingImage}
              className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-lg sm:rounded-xl text-xs px-4 sm:px-6 h-8 sm:h-9 gap-1.5 sm:gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
