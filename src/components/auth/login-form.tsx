"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { loginAction } from "@/app/login/actions";
import { Eye, EyeOff, Mail, Lock, Loader2, Sparkles, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email address or Staff ID is required" })
    .transform((val) => val.trim().toLowerCase())
    .refine(
      (val) => {
        const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
        const isPhone = /^[6-9]\d{9}$/.test(val);
        const isStaffId = /^[a-zA-Z0-9_.-]{3,30}$/.test(val);
        return isEmail || isPhone || isStaffId;
      },
      { message: "Please enter a valid email (e.g. admin@restaurant.com) or Staff ID" }
    ),
  password: z
    .string()
    .min(1, { message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/^[A-Z]/, {
      message: "Password must start with a Capital letter (A-Z)",
    })
    .refine(
      (val) => /[a-z]/.test(val) && /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val),
      { message: "Password must contain lowercase letters and a number or symbol" }
    ),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  readonly restaurantName?: string;
  readonly restaurantLogo?: string | null;
}

interface RequirementItemProps {
  readonly isValid: boolean;
  readonly label: string;
}

function RequirementItem({ isValid, label }: Readonly<RequirementItemProps>) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
        isValid
          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
          : "bg-white text-stone-400 border-stone-200"
      }`}
    >
      <span className={isValid ? "text-emerald-600 font-bold" : "text-stone-400"}>
        {isValid ? "✓" : "○"}
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}

interface PasswordRequirementsProps {
  readonly startsWithCapital: boolean;
  readonly hasLowercase: boolean;
  readonly hasMixedNumberOrSymbol: boolean;
  readonly hasMinLength: boolean;
}

function PasswordRequirements({
  startsWithCapital,
  hasLowercase,
  hasMixedNumberOrSymbol,
  hasMinLength,
}: Readonly<PasswordRequirementsProps>) {
  const isAllValid =
    startsWithCapital && hasLowercase && hasMixedNumberOrSymbol && hasMinLength;

  return (
    <div className="mt-2 p-2.5 bg-stone-50/90 rounded-2xl border border-stone-200/90 space-y-1.5 animate-in fade-in duration-200">
      <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center justify-between">
        <span>Password Requirements:</span>
        {isAllValid ? (
          <span className="text-emerald-700 font-bold">✓ Strong & Valid</span>
        ) : (
          <span className="text-amber-700 font-medium">Follow rules below</span>
        )}
      </p>
      <div className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] font-semibold">
        <RequirementItem isValid={startsWithCapital} label="1st Capital (A-Z)" />
        <RequirementItem isValid={hasLowercase} label="Lowercase (a-z)" />
        <RequirementItem isValid={hasMixedNumberOrSymbol} label="Number / @#$" />
        <RequirementItem isValid={hasMinLength} label="Min 6 Letters" />
      </div>
    </div>
  );
}

export default function LoginForm({
  restaurantName,
  restaurantLogo,
}: Readonly<LoginFormProps>) {
  const brandName = restaurantName?.trim() || "The Culinary Ledger";
  const logoSrc = restaurantLogo || "/images/logo.png";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const watchedPassword = useWatch({
    control: form.control,
    name: "password",
    defaultValue: "",
  }) || "";
  const startsWithCapital = /^[A-Z]/.test(watchedPassword);
  const hasLowercase = /[a-z]/.test(watchedPassword);
  const hasMixedNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(watchedPassword);
  const hasMinLength = watchedPassword.length >= 6;

  const handleQuickRoleSelect = (roleName: string, email: string) => {
    setActiveDemoRole(roleName);
    form.setValue("email", email, { shouldValidate: true });
    toast.success(`Selected ${roleName} login (${email})`, { id: "quick-role" });
  };

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const result = await loginAction(formData);

      if (result?.error) {
        toast.error(result.error, { id: "login-error" });
      }
    } catch (error: unknown) {
      const err = error as { message?: string; digest?: string } | null;
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
        return; // Normal Next.js redirect
      }
      console.error("Login error:", error);
      toast.error("Invalid credentials or server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPassword = () => {
    toast("Please contact your Restaurant Administrator to reset credentials.", {
      icon: "🔒",
      duration: 4000,
    });
  };

  return (
    <div
      suppressHydrationWarning
      className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-stone-200/90 p-6 sm:p-9 shadow-2xl shadow-stone-950/30 relative transition-all animate-in fade-in duration-500 selection:bg-amber-700 selection:text-white"
    >
      {/* Mobile-Only Header Brand Badge */}
      <div className="lg:hidden flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 relative rounded-2xl overflow-hidden border border-amber-500/30 shadow-md bg-stone-900 p-2 flex items-center justify-center mb-2.5">
          <Image
            src={logoSrc}
            alt={brandName}
            fill
            sizes="56px"
            className="object-contain p-1"
          />
        </div>
        <h1 className="text-2xl font-bold font-cormorant text-stone-900 leading-tight">
          {brandName}
        </h1>
        <p className="text-[11px] text-amber-800 font-medium">
          Enterprise Restaurant Management
        </p>
      </div>

      {/* Main Title & Subtitle */}
      <div className="mb-6 text-center lg:text-left">
        <div className="hidden lg:flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles size={13} />
          <span>Staff & Management Portal</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold font-cormorant text-stone-900 tracking-tight leading-tight">
          Welcome Back
        </h2>
        <p className="mt-1 text-stone-500 text-xs sm:text-sm">
          Sign in to access {brandName} floor operations, kitchen & billing.
        </p>
      </div>

      {/* Quick Role Fill Pills for Fast Access */}
      <div className="mb-5 p-2.5 bg-stone-50 rounded-2xl border border-stone-200/80">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider flex items-center gap-1">
            <UserCheck size={11} className="text-amber-700" />
            Quick Demo Accounts
          </span>
          <span className="text-[10px] text-stone-400 font-medium">Click to fill</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickRoleSelect("Admin", "admin@restaurant.com")}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
              activeDemoRole === "Admin"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            👑 Admin
          </button>

          <button
            type="button"
            onClick={() => handleQuickRoleSelect("Waiter", "rampatidar@gmail.com")}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
              activeDemoRole === "Waiter"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            🍽️ Waiter
          </button>

          <button
            type="button"
            onClick={() => handleQuickRoleSelect("Kitchen", "kitchen@restaurant.com")}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
              activeDemoRole === "Kitchen"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
            }`}
          >
            👨‍🍳 Kitchen
          </button>
        </div>
      </div>

      <Form {...form}>
        <form suppressHydrationWarning onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-stone-700 font-bold text-xs">Email Address / Staff ID</FormLabel>
                  <span className="text-[10px] text-stone-400">Email or Login ID</span>
                </div>
                <FormControl>
                  <div suppressHydrationWarning className="relative flex items-center">
                    <Mail className="absolute left-3.5 text-stone-400" size={17} />
                    <Input
                      suppressHydrationWarning
                      placeholder="admin@restaurant.com or Staff ID"
                      className="pl-10 h-11 bg-white border-stone-200 focus-visible:ring-amber-500/20 focus-visible:border-amber-600 rounded-xl text-xs sm:text-sm shadow-2xs transition-all selection:bg-amber-700 selection:text-white"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-600 text-[11px] mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-stone-700 font-bold text-xs">Password</FormLabel>
                  <span className="text-[10px] text-amber-700 font-semibold">1st Letter Capital + Mixed</span>
                </div>
                <FormControl>
                  <div suppressHydrationWarning className="relative flex items-center">
                    <Lock className="absolute left-3.5 text-stone-400" size={17} />
                    <Input
                      suppressHydrationWarning
                      type={showPassword ? "text" : "password"}
                      placeholder="e.g. Admin@123"
                      className="pl-10 pr-10 h-11 bg-white border-stone-200 focus-visible:ring-amber-500/20 focus-visible:border-amber-600 rounded-xl text-xs sm:text-sm shadow-2xs transition-all selection:bg-amber-700 selection:text-white"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </FormControl>

                {/* Real-time Live Password Requirement Indicator */}
                {watchedPassword.length > 0 && (
                  <PasswordRequirements
                    startsWithCapital={startsWithCapital}
                    hasLowercase={hasLowercase}
                    hasMixedNumberOrSymbol={hasMixedNumberOrSymbol}
                    hasMinLength={hasMinLength}
                  />
                )}

                <FormMessage className="text-red-600 text-[11px] mt-1" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-1">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-stone-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 rounded-md"
                    />
                  </FormControl>
                  <FormLabel className="text-xs text-stone-600 font-normal cursor-pointer select-none">
                    Remember this terminal
                  </FormLabel>
                </FormItem>
              )}
            />

            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 mt-2 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-amber-900/25 transition-all active:scale-[0.99] gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Authenticating Portal...</span>
              </>
            ) : (
              <>
                <span>Sign In To Portal</span>
                <ArrowRight size={15} />
              </>
            )}
          </Button>
        </form>
      </Form>

      {/* Security Guarantee Badge */}
      <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>256-Bit Encrypted • {brandName}</span>
        </div>
        <span className="font-mono text-[10px]">v1.0.0</span>
      </div>
    </div>
  );
}
