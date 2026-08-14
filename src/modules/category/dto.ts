import { CategoryStatus } from "@prisma/client";

export interface CreateCategoryDto {
  name: string;
  image?: string;
  description?: string;
  status?: CategoryStatus;
}

export interface UpdateCategoryDto {
  name?: string;
  image?: string;
  description?: string;
  status?: CategoryStatus;
}
