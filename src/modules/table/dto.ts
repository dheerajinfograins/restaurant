import { z } from "zod";
import { createTableSchema, updateTableSchema } from "./validation";

export type CreateTableDTO = z.infer<typeof createTableSchema>;
export type UpdateTableDTO = z.infer<typeof updateTableSchema>;
