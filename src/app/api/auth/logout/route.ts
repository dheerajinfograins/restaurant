import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        if (payload?.id) {
          await prisma.user.update({
            where: { id: payload.id },
            data: { lastLoginAt: null },
          });
        }
      } catch {
        // ignore token decode errors on logout
      }
    }

    cookieStore.delete("token");

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({
      success: true,
      message: "Logged out",
    });
  }
}
