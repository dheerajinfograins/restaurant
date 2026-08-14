import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import authController from "@/modules/auth/controller";
import { handleError } from "@/helpers/error-handler";
import { successResponse } from "@/lib/api-response";
import { AUTH_MESSAGES } from "@/modules/auth/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await authController.login(body);

    const cookieStore = await cookies();
    cookieStore.set("token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return successResponse(AUTH_MESSAGES.LOGIN_SUCCESS, result);
  } catch (error) {
    return handleError(error);
  }
}
