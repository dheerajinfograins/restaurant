import { CreateCategoryDto, UpdateCategoryDto } from "./dto";
import categoryRepository from "./repository";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

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

    let imageUrl = data.image;
    // If image is a base64 data URI, upload directly to Cloudinary
    if (imageUrl?.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl, "categories");
        imageUrl = uploadResult.url;
      } catch (err) {
        console.error("Failed to upload category image to Cloudinary:", err);
      }
    }

    return categoryRepository.create({
      ...data,
      image: imageUrl,
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

    // Handle image update & cleanup
    if (data.image !== undefined) {
      let newImageUrl = data.image;
      if (newImageUrl?.startsWith("data:image")) {
        try {
          const uploadResult = await uploadImageToCloudinary(newImageUrl, "categories");
          newImageUrl = uploadResult.url;
          updateData.image = newImageUrl;
        } catch (err) {
          console.error("Failed to upload updated category image to Cloudinary:", err);
        }
      }

      // If previous image was Cloudinary and changed, delete the old image
      if (category.image && category.image !== newImageUrl && category.image.includes("res.cloudinary.com")) {
        void deleteImageFromCloudinary(category.image);
      }
    }

    return categoryRepository.update(id, updateData);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string, restaurantId: string) {
    const category = await this.getCategory(id, restaurantId);

    // Check if any product in this category is referenced by order items
    const ordersCount = await prisma.orderItem.count({
      where: {
        product: {
          categoryId: id,
        },
      },
    });

    if (ordersCount > 0) {
      throw new AppError(
        "Cannot delete category because it contains products associated with existing order records. Please set the category status to INACTIVE instead to hide it.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Clean up product images from Cloudinary for all products in this category
    const categoryProducts = await prisma.product.findMany({
      where: { categoryId: id },
      select: { image: true },
    });

    for (const product of categoryProducts) {
      if (product.image?.includes("res.cloudinary.com")) {
        void deleteImageFromCloudinary(product.image);
      }
    }

    // Delete category image from Cloudinary if exists
    if (category.image?.includes("res.cloudinary.com")) {
      void deleteImageFromCloudinary(category.image);
    }

    return categoryRepository.delete(id);
  }
}

const categoryService = new CategoryService();
export default categoryService;
