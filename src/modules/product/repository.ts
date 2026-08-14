import { Prisma, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ProductFilters {
  categoryId?: string;
  foodType?: "VEG" | "NON_VEG" | "EGG";
  isAvailable?: boolean;
  isFeatured?: boolean;
}

class ProductRepository {
  /**
   * Find products by restaurant ID with optional filters
   */
  async findByRestaurantId(restaurantId: string, filters?: ProductFilters): Promise<Product[]> {
    const whereClause: Prisma.ProductWhereInput = {
      restaurantId,
      ...filters,
    };

    return prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Find a single product by ID and restaurant ID
   */
  async findById(id: string, restaurantId: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: {
        id,
        restaurantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
  }

  /**
   * Find a product by name and restaurant ID (useful for uniqueness check)
   */
  async findByName(name: string, restaurantId: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        restaurantId,
      },
    });
  }

  /**
   * Create a new product
   */
  async create(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
    return prisma.product.create({
      data,
    });
  }

  /**
   * Update a product
   */
  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
}

const productRepository = new ProductRepository();
export default productRepository;
