import * as z from "zod";
import { CategoryStatus } from "@prisma/client";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name is too long."),
  image: z.string().optional().or(z.literal("")),
  description: z.string().max(500, "Description is too long").optional(),
  status: z.enum([CategoryStatus.ACTIVE, CategoryStatus.INACTIVE]).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
