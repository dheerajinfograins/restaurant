"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import authService from "@/modules/auth/service";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  let redirectUrl = "/dashboard";

  try {
    const result = await authService.login({ email, password });
    
    const cookieStore = await cookies();
    cookieStore.set("token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    if (result.user.role === "SUPER_ADMIN") {
      redirectUrl = "/dashboard/restaurants";
    } else if (result.user.role === "WAITER") {
      redirectUrl = "/waiter";
    } else if (result.user.role === "KITCHEN") {
      redirectUrl = "/dashboard/kitchen";
    }

  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message || "Invalid credentials" };
    }
    return { error: "Invalid credentials" };
  }

  // Redirect must happen outside the try-catch block in Server Actions
  redirect(redirectUrl);
}
