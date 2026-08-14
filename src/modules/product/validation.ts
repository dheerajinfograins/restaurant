import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name must be less than 100 characters"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  discount: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%").default(0),
  image: z.string().optional().nullable(),
  foodType: z.enum(["VEG", "NON_VEG", "EGG"]).default("VEG"),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  preparationTime: z.coerce.number().min(0, "Preparation time cannot be negative").optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();
