import { CategoryStatus } from "@prisma/client";

export interface ICategory {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  image: string | null;
  description: string | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    products: number;
  };
}
