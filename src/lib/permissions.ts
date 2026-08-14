import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { AppError, HTTP_STATUS } from "@/exceptions";

export type UserRole = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "WAITER" | "KITCHEN" | "CASHIER";

/**
 * Checks if the current request is authorized based on the user's role.
 * Throws an AppError if unauthorized, which will be caught by `handleError`.
 * Returns the decoded payload.
 */
export async function requireRoles(allowedRoles: UserRole[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const payload = verifyAccessToken(token) as any;
    
    if (!allowedRoles.includes(payload.role as UserRole)) {
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
export async function getOptionalPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  if (!token) return null;
  
  try {
    return verifyAccessToken(token) as any;
  } catch (e) {
    return null;
  }
}
