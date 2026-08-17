"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { loginAction } from "@/app/(auth)/login/actions";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
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
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);
      
      const result = await loginAction(formData);
      
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
        return; // Normal Next.js navigation
      }
      console.error("Login error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div suppressHydrationWarning className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl border border-culinary-border/50 p-8 sm:p-10 shadow-2xl transition-all duration-500 hover:shadow-culinary-primary/5">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-4xl lg:text-5xl font-cormorant text-culinary-text font-medium tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-3 text-culinary-muted text-sm lg:text-base">
          Sign in to continue managing your restaurant.
        </p>
      </div>

      <Form {...form}>
        <form suppressHydrationWarning onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-culinary-text font-medium">Email Address</FormLabel>
                <FormControl>
                  <div suppressHydrationWarning className="relative flex items-center">
                    <Mail className="absolute left-4 text-culinary-primary/70" size={18} />
                    <Input
                      suppressHydrationWarning
                      placeholder="admin@restaurant.com"
                      className="pl-11 py-6 bg-white border-culinary-border/60 focus-visible:ring-culinary-primary/30 focus-visible:border-culinary-primary rounded-xl text-base shadow-sm transition-all"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500/80 text-xs mt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-culinary-text font-medium">Password</FormLabel>
                <FormControl>
                  <div suppressHydrationWarning className="relative flex items-center">
                    <Lock className="absolute left-4 text-culinary-primary/70" size={18} />
                    <Input
                      suppressHydrationWarning
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-11 pr-11 py-6 bg-white border-culinary-border/60 focus-visible:ring-culinary-primary/30 focus-visible:border-culinary-primary rounded-xl text-base shadow-sm transition-all"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-4 text-culinary-muted hover:text-culinary-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-red-500/80 text-xs mt-1" />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between pt-2">
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-culinary-border text-culinary-primary data-[state=checked]:bg-culinary-primary data-[state=checked]:border-culinary-primary rounded shadow-sm"
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-culinary-muted font-normal cursor-pointer">
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <button type="button" className="text-sm font-medium text-culinary-primary hover:text-culinary-secondary transition-colors">
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-6 mt-4 bg-culinary-primary hover:bg-culinary-secondary text-white rounded-xl text-base font-semibold shadow-lg shadow-culinary-primary/20 transition-all hover:shadow-xl hover:-translate-y-[1px]"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center">
        <p className="text-xs font-medium text-culinary-muted/60 tracking-wider">
          VERSION 1.0.0
        </p>
      </div>
    </div>
  );
}
