import { UserRole } from "@prisma/client";

/**
 * Login Request DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Create User Request DTO
 * Used by Super Admin / Owner / Manager
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  restaurantId: string;
}

/**
 * Update User DTO
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}
