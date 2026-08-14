import { UserRole } from "@prisma/client";

/**
 * JWT Payload
 * Stored inside the JWT token.
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  restaurantId: string | null;
}

/**
 * Logged-in User
 * Used after authentication.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  restaurantId: string | null;
  isActive: boolean;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}
