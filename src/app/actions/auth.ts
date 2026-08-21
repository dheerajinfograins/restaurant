"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export async function logoutAction() {
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
      // ignore invalid token on logout
    }
  }

  cookieStore.delete("token");
  redirect("/login");
}
