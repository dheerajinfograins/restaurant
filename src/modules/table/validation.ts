import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).default("AVAILABLE"),
});

export const updateTableSchema = createTableSchema.partial();
