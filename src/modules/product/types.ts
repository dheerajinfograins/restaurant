import { FoodType, Category } from "@prisma/client";

export interface IProduct {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  discount: number;
  image: string | null;
  foodType: FoodType;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number | null;
  createdAt: Date;
  updatedAt: Date;
  
  category?: Partial<Category>;
}
