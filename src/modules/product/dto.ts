import { z } from "zod";
import { createProductSchema, updateProductSchema } from "./validation";

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
