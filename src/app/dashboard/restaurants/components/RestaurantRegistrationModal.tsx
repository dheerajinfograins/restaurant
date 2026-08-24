"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import {
  Store,
  Leaf,
  Drumstick,
  Utensils,
  Sparkles,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { copyToClipboard } from "@/lib/utils";

interface RestaurantRegistrationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}

export type DietaryType = "PURE_VEG" | "PURE_NON_VEG" | "BOTH";

export default function RestaurantRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: Readonly<RestaurantRegistrationModalProps>) {
  const [step, setStep] = useState<1 | 2 | "SUCCESS">(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [dietaryCategory, setDietaryCategory] = useState<DietaryType>("BOTH");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [fssaiLicense, setFssaiLicense] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  // Owner State
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");

  // Created Result State
  const [createdData, setCreatedData] = useState<{
    restaurantName: string;
    dietaryCategory: DietaryType;
    ownerEmail: string;
    ownerPass: string;
  } | null>(null);

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    const randomValues = new Uint32Array(10);
    window.crypto.getRandomValues(randomValues);
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars[randomValues[i] % chars.length];
    }
    setOwnerPassword(pass);
    toast.success("Generated secure password!");
  };

  const handleNextStep = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter restaurant name");
    if (!email.trim()) return toast.error("Please enter restaurant email");
    if (!phone.trim()) return toast.error("Please enter restaurant phone");
    if (!address.trim()) return toast.error("Please enter restaurant address");
    setStep(2);
  };

  const handleRegister = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!ownerName.trim()) return toast.error("Please enter owner name");
    if (!ownerEmail.trim()) return toast.error("Please enter owner email");
    if (!ownerPassword || ownerPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      setLoading(true);
      const payload = {
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        fssaiLicense,
        website,
        description,
        dietaryCategory,
        ownerName,
        ownerEmail,
        ownerPhone: ownerPhone || phone,
        ownerPassword,
      };

      const res = await axios.post("/api/super-admin/restaurants", payload);

      if (res.data.success) {
        toast.success("Restaurant registered successfully!");
        setCreatedData({
          restaurantName: name,
          dietaryCategory,
          ownerEmail,
          ownerPass: ownerPassword,
        });
        setStep("SUCCESS");
        onSuccess();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "Failed to register restaurant";
        toast.error(msg);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to register restaurant");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdData) return;
    const text = `Restaurant Management Login Credentials:\nRestaurant: ${createdData.restaurantName}\nCategory: ${createdData.dietaryCategory}\nOwner Email: ${createdData.ownerEmail}\nPassword: ${createdData.ownerPass}\nURL: ${typeof window !== "undefined" ? window.location.origin : ""}/login`;
    const success = await copyToClipboard(text);
    if (success) {
      toast.success("Credentials copied to clipboard!");
    } else {
      toast.error("Could not auto-copy. Please select and copy credentials manually.");
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setPincode("");
    setFssaiLicense("");
    setWebsite("");
    setDescription("");
    setDietaryCategory("BOTH");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setOwnerPassword("");
    setCreatedData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-culinary-border shadow-2xl p-0 rounded-3xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white p-6 sm:p-8 rounded-t-3xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <Store className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-cormorant font-bold tracking-wide text-white">
                {step === "SUCCESS" ? "Restaurant Ready!" : "Register New Restaurant"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-amber-100/80">
                {step === "SUCCESS"
                  ? "Restaurant and Owner credentials provisioned."
                  : "Setup restaurant profile, dietary category, and owner account."}
              </DialogDescription>
            </div>
          </div>

          {/* Stepper indicator */}
          {step !== "SUCCESS" && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/15">
              <div className={`flex items-center gap-2 text-xs font-semibold ${step === 1 ? "text-amber-200" : "text-white/60"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? "bg-amber-400 text-amber-950 font-bold" : "bg-white/20 text-white"}`}>1</span>
                <span>Restaurant Info & Category</span>
              </div>
              <div className="w-8 h-px bg-white/20" />
              <div className={`flex items-center gap-2 text-xs font-semibold ${step === 2 ? "text-amber-200" : "text-white/60"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? "bg-amber-400 text-amber-950 font-bold" : "bg-white/20 text-white"}`}>2</span>
                <span>Owner Credentials</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: RESTAURANT DETAILS & DIETARY CLASSIFICATION */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-6">
              {/* Dietary Category Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-culinary-text">
                    Dietary Classification <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[11px] text-culinary-muted">Controls menu dish permissions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Pure Veg Option */}
                  <button
                    type="button"
                    onClick={() => setDietaryCategory("PURE_VEG")}
                    className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${dietaryCategory === "PURE_VEG"
                      ? "border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20"
                      : "border-culinary-border/80 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Leaf className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        100% Veg
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-emerald-950">Pure Veg</p>
                      <p className="text-[11px] text-emerald-700/80 mt-1 leading-snug">
                        Non-veg & eggs completely locked. Only veg allowed.
                      </p>
                    </div>
                  </button>

                  {/* Pure Non-Veg Option */}
                  <button
                    type="button"
                    onClick={() => setDietaryCategory("PURE_NON_VEG")}
                    className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${dietaryCategory === "PURE_NON_VEG"
                      ? "border-rose-600 bg-rose-50/70 shadow-md ring-2 ring-rose-500/20"
                      : "border-culinary-border/80 bg-white hover:border-rose-300 hover:bg-rose-50/30"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                        <Drumstick className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Non-Veg Only
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-rose-950">Pure Non-Veg</p>
                      <p className="text-[11px] text-rose-700/80 mt-1 leading-snug">
                        Meat, chicken, seafood & egg focused specialist.
                      </p>
                    </div>
                  </button>

                  {/* Both (Mixed) Option */}
                  <button
                    type="button"
                    onClick={() => setDietaryCategory("BOTH")}
                    className={`p-4 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${dietaryCategory === "BOTH"
                      ? "border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20"
                      : "border-culinary-border/80 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        Multi-Cuisine
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-amber-950">Both (Veg & Non-Veg)</p>
                      <p className="text-[11px] text-amber-800/80 mt-1 leading-snug">
                        Allows both dishes with Veg/Non-Veg filters & badges.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-culinary-text">
                    Restaurant Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Royal Spice Bistro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-culinary-text">
                    Restaurant Email <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@royalspice.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-culinary-text">
                    Phone Number <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="fssaiLicense" className="text-xs font-semibold text-culinary-text">
                    FSSAI License / Food Safety No.
                  </Label>
                  <Input
                    id="fssaiLicense"
                    placeholder="e.g. 10019022009876"
                    value={fssaiLicense}
                    onChange={(e) => setFssaiLicense(e.target.value)}
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>
              </div>

              {/* Location Fields */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-culinary-text">
                  Complete Address <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Plot 45, Commercial Hub, MG Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="border-culinary-border focus-visible:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-culinary-text">City</Label>
                  <Input
                    id="city"
                    placeholder="Indore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold text-culinary-text">State</Label>
                  <Input
                    id="state"
                    placeholder="Madhya Pradesh"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode" className="text-xs font-semibold text-culinary-text">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="452001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-culinary-border/50">
                <Button type="button" variant="outline" onClick={handleResetAndClose} className="rounded-xl border-culinary-border">
                  Cancel
                </Button>
                <Button type="submit" className="bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl gap-2 shadow-md">
                  Continue to Owner Account <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: OWNER CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">Primary Restaurant Admin / Owner</p>
                  <p className="text-amber-800/80">
                    An initial <strong>OWNER</strong> account will be provisioned for <strong>{name}</strong>. They will manage staff, menu, floor tables, and billing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-xs font-semibold text-culinary-text">
                    Owner Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="ownerName"
                    placeholder="e.g. Ramesh Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ownerPhone" className="text-xs font-semibold text-culinary-text">
                    Owner Direct Mobile
                  </Label>
                  <Input
                    id="ownerPhone"
                    placeholder="Defaults to restaurant phone"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="border-culinary-border focus-visible:ring-amber-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownerEmail" className="text-xs font-semibold text-culinary-text">
                  Owner Login Email <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="ramesh@royalspice.com"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                  className="border-culinary-border focus-visible:ring-amber-600"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ownerPassword" className="text-xs font-semibold text-culinary-text">
                    Owner Password <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-generate secure password
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="ownerPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    required
                    className="border-culinary-border focus-visible:ring-amber-600 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-culinary-muted hover:text-culinary-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-culinary-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="rounded-xl border-culinary-border"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Provisioning Restaurant...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Register & Launch Restaurant
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP SUCCESS: CREDENTIALS SUMMARY */}
          {step === "SUCCESS" && createdData && (
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-stone-900 font-cormorant">
                  {createdData.restaurantName} Successfully Registered!
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Tenant schema, starter categories, and Owner credentials have been configured.
                </p>
              </div>

              {/* Dietary Classification Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mx-auto">
                {createdData.dietaryCategory === "PURE_VEG" && (
                  <span className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Pure Veg Restaurant
                  </span>
                )}
                {createdData.dietaryCategory === "PURE_NON_VEG" && (
                  <span className="bg-rose-50 text-rose-800 border-rose-200 flex items-center gap-1.5">
                    <Drumstick className="w-3.5 h-3.5 text-rose-600" /> Pure Non-Veg Restaurant
                  </span>
                )}
                {createdData.dietaryCategory === "BOTH" && (
                  <span className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" /> Multi-Cuisine (Veg & Non-Veg)
                  </span>
                )}
              </div>

              {/* Copyable Credentials Card */}
              <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-5 text-left space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Owner Login Details</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyCredentials}
                    className="h-8 gap-1.5 text-xs rounded-lg border-stone-300 hover:bg-white text-stone-700"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy Details
                  </Button>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-stone-800 bg-white p-3 rounded-xl border border-stone-200">
                  <p><strong className="font-sans text-stone-500 font-medium">Email:</strong> {createdData.ownerEmail}</p>
                  <p><strong className="font-sans text-stone-500 font-medium">Password:</strong> {createdData.ownerPass}</p>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button
                  onClick={handleResetAndClose}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-xl px-8 shadow-md"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
