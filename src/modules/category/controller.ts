import { CreateCategoryDto, UpdateCategoryDto } from "./dto";
import categoryService from "./service";
import { createCategorySchema, updateCategorySchema } from "./validation";
import { successResponse } from "@/lib/api-response";
import { CATEGORY_MESSAGES } from "./constants";

class CategoryController {
  async getCategories(restaurantId: string) {
    const categories = await categoryService.getCategories(restaurantId);
    return successResponse(CATEGORY_MESSAGES.FETCHED, categories);
  }

  async createCategory(restaurantId: string, body: CreateCategoryDto) {
    const validatedData = createCategorySchema.parse(body);
    const category = await categoryService.createCategory(restaurantId, validatedData);
    return successResponse(CATEGORY_MESSAGES.CREATED, category, 201);
  }

  async getCategory(id: string, restaurantId: string) {
    const category = await categoryService.getCategory(id, restaurantId);
    return successResponse(CATEGORY_MESSAGES.FETCHED, category);
  }

  async updateCategory(id: string, restaurantId: string, body: UpdateCategoryDto) {
    const validatedData = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, restaurantId, validatedData);
    return successResponse(CATEGORY_MESSAGES.UPDATED, category);
  }

  async deleteCategory(id: string, restaurantId: string) {
    await categoryService.deleteCategory(id, restaurantId);
    return successResponse(CATEGORY_MESSAGES.DELETED);
  }
}

const categoryController = new CategoryController();
export default categoryController;
