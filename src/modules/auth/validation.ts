import { z } from "zod";
import { UserRole } from "@prisma/client";

const userRoleSchema = z.enum([
  UserRole.SUPER_ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.WAITER,
  UserRole.KITCHEN,
  UserRole.CASHIER,
]);

const phoneRegex = /^(?:(?:\+|00)91[\s-]?)?[6-9]\d{9}$/;
const emailRegex = /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

/**
 * Login Validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .refine(
      (val) => phoneRegex.test(val) || emailRegex.test(val),
      "Please enter a valid email or mobile number."
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100, "Password is too long."),
});

/**
 * Create User Validation
 */
export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters.")
    .max(100, "Name is too long."),

  email: z
    .string()
    .trim()
    .pipe(z.email("Please enter a valid email address.")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(100),

  phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid mobile number."),

  role: userRoleSchema,

  restaurantId: z.uuid("Invalid restaurant ID."),
});

/**
 * Update User Validation
 */
export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  email: z
    .string()
    .trim()
    .pipe(z.email())
    .optional(),

  phone: z
    .string()
    .regex(phoneRegex, "Please enter a valid mobile number.")
    .optional(),

  role: userRoleSchema.optional(),

  isActive: z.boolean().optional(),
});
