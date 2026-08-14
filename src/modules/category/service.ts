import { CreateCategoryDto, UpdateCategoryDto } from "./dto";
import categoryRepository from "./repository";
import { AppError, HTTP_STATUS } from "@/exceptions";

class CategoryService {
  /**
   * Get all categories for a restaurant
   */
  async getCategories(restaurantId: string) {
    return categoryRepository.findByRestaurantId(restaurantId);
  }

  /**
   * Create a new category
   */
  async createCategory(restaurantId: string, data: CreateCategoryDto) {
    // Check if category with same name exists for this restaurant
    const existingCategory = await categoryRepository.findByName(data.name, restaurantId);
    
    if (existingCategory) {
      throw new AppError(
        "A category with this name already exists.",
        HTTP_STATUS.CONFLICT
      );
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    return categoryRepository.create({
      ...data,
      slug,
      restaurantId,
    });
  }

  /**
   * Get a single category
   */
  async getCategory(id: string, restaurantId: string) {
    const category = await categoryRepository.findById(id, restaurantId);
    
    if (!category) {
      throw new AppError("Category not found.", HTTP_STATUS.NOT_FOUND);
    }

    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, restaurantId: string, data: UpdateCategoryDto) {
    const category = await this.getCategory(id, restaurantId);

    const updateData: UpdateCategoryDto & { slug?: string } = { ...data };

    // If name is being updated, ensure it doesn't conflict and update slug
    if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await categoryRepository.findByName(data.name, restaurantId);
      if (existingCategory) {
        throw new AppError(
          "A category with this name already exists.",
          HTTP_STATUS.CONFLICT
        );
      }
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    return categoryRepository.update(id, updateData);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string, restaurantId: string) {
    await this.getCategory(id, restaurantId);
    return categoryRepository.delete(id);
  }
}

const categoryService = new CategoryService();
export default categoryService;
