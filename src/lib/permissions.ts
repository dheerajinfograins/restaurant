import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { UserRole } from "@prisma/client";
import { JwtPayload } from "@/modules/auth/types";

export type { UserRole };

/**
 * Checks if the current request is authorized based on the user's role.
 * Throws an AppError if unauthorized, which will be caught by `handleError`.
 * Returns the decoded payload.
 */
export async function requireRoles(allowedRoles: UserRole[]): Promise<JwtPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const payload = verifyAccessToken(token);
    
    if (!allowedRoles.includes(payload.role)) {
      throw new AppError("Forbidden: Insufficient permissions", HTTP_STATUS.FORBIDDEN);
    }
    
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Helper to optionally get payload without throwing error if no token is found,
 * but still verifies token if it exists. Useful for layout checks.
 */
export async function getOptionalPayload(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) return null;
  
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

