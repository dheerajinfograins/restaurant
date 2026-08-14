import { Prisma, Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";

class CategoryRepository {
  /**
   * Find categories by restaurant ID
   */
  async findByRestaurantId(restaurantId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        restaurantId,
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Find a single category by ID and restaurant ID
   */
  async findById(id: string, restaurantId: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: {
        id,
        restaurantId,
      },
    });
  }

  /**
   * Find a category by name and restaurant ID (useful for uniqueness check)
   */
  async findByName(name: string, restaurantId: string): Promise<Category | null> {
    return prisma.category.findFirst({
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
   * Create a new category
   */
  async create(data: Prisma.CategoryUncheckedCreateInput): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  /**
   * Update a category
   */
  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<Category> {
    return prisma.category.delete({
      where: { id },
    });
  }
}

const categoryRepository = new CategoryRepository();
export default categoryRepository;
