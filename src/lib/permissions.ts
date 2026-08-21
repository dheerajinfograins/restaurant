import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/jwt";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { UserRole } from "@prisma/client";
import { JwtPayload } from "@/modules/auth/types";
import { prisma } from "@/lib/prisma";

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

    // Verify user is active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, isActive: true },
    });

    if (!dbUser?.isActive) {
      throw new AppError("Your account has been deactivated. Please contact your administrator.", HTTP_STATUS.FORBIDDEN);
    }
    
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired token", HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * Resolves the authenticated user's restaurant ID.
 * Falls back to DB lookup or primary restaurant if not present in token.
 */
export async function getAuthenticatedRestaurantId(
  allowedRoles: UserRole[] = ["SUPER_ADMIN", "OWNER", "MANAGER"]
): Promise<string> {
  const payload = await requireRoles(allowedRoles);

  if (payload.restaurantId) {
    return payload.restaurantId;
  }

  // Look up user in DB if token didn't contain restaurantId
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { restaurantId: true },
  });

  if (user?.restaurantId) {
    return user.restaurantId;
  }

  // Fallback to first existing restaurant in database
  const firstRestaurant = await prisma.restaurant.findFirst({
    select: { id: true },
  });

  if (firstRestaurant) {
    return firstRestaurant.id;
  }

  throw new AppError("No restaurant found. Please create a restaurant first.", HTTP_STATUS.NOT_FOUND);
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


