import { CreateProductDto, UpdateProductDto } from "./dto";
import productRepository, { ProductFilters } from "./repository";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { PRODUCT_MESSAGES } from "./constants";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

class ProductService {
  /**
   * Get all products for a restaurant
   */
  async getProducts(restaurantId: string, filters?: ProductFilters) {
    return productRepository.findByRestaurantId(restaurantId, filters);
  }

  private async validateDietaryRestrictions(
    restaurantId: string,
    foodType?: string,
    action: "add" | "set" = "set"
  ) {
    if (!foodType) return;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { dietaryCategory: true },
    });

    if (restaurant?.dietaryCategory === "PURE_VEG" && foodType !== "VEG") {
      throw new AppError(
        action === "add"
          ? "Cannot add non-vegetarian or egg items to a Pure Veg restaurant."
          : "Cannot set non-vegetarian or egg items in a Pure Veg restaurant.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (restaurant?.dietaryCategory === "PURE_NON_VEG" && foodType === "VEG") {
      throw new AppError(
        action === "add"
          ? "Cannot add vegetarian items to a Pure Non-Veg restaurant. Only Non-Veg and Egg dishes are permitted."
          : "Cannot set vegetarian items in a Pure Non-Veg restaurant. Only Non-Veg and Egg dishes are permitted.",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  private async validateUniqueName(name: string, restaurantId: string) {
    const existingProduct = await productRepository.findByName(name, restaurantId);
    if (existingProduct) {
      throw new AppError(
        PRODUCT_MESSAGES.ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }
  }

  private async processImageUpload(image?: string | null): Promise<string | null | undefined> {
    if (!image?.startsWith("data:image")) {
      return image;
    }

    try {
      const uploadResult = await uploadImageToCloudinary(image, "products");
      return uploadResult.url;
    } catch (err) {
      console.error("Failed to upload product image to Cloudinary:", err);
      return image;
    }
  }

  private async handleImageUpdate(
    oldImage: string | null | undefined,
    newImage?: string | null
  ): Promise<string | null | undefined> {
    const processedUrl = await this.processImageUpload(newImage);

    if (oldImage && oldImage !== processedUrl && oldImage.includes("res.cloudinary.com")) {
      void deleteImageFromCloudinary(oldImage);
    }

    return processedUrl;
  }

  /**
   * Create a new product
   */
  async createProduct(restaurantId: string, data: CreateProductDto) {
    await this.validateDietaryRestrictions(restaurantId, data.foodType, "add");
    await this.validateUniqueName(data.name, restaurantId);

    const slug = generateSlug(data.name);
    const imageUrl = await this.processImageUpload(data.image);

    return productRepository.create({
      ...data,
      image: imageUrl,
      slug,
      restaurantId,
    });
  }

  /**
   * Get a single product
   */
  async getProduct(id: string, restaurantId: string) {
    const product = await productRepository.findById(id, restaurantId);
    
    if (!product) {
      throw new AppError(PRODUCT_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return product;
  }

  /**
   * Update a product
   */
  async updateProduct(id: string, restaurantId: string, data: UpdateProductDto) {
    const product = await this.getProduct(id, restaurantId);

    // Check dietary restrictions
    await this.validateDietaryRestrictions(restaurantId, data.foodType, "set");

    const updateData: UpdateProductDto & { slug?: string } = { ...data };

    // If name is being updated, ensure it doesn't conflict and update slug
    if (data.name && data.name.toLowerCase() !== product.name.toLowerCase()) {
      await this.validateUniqueName(data.name, restaurantId);
      updateData.slug = generateSlug(data.name);
    }

    // Handle image update & cleanup
    if (data.image !== undefined) {
      updateData.image = await this.handleImageUpdate(product.image, data.image);
    }

    return productRepository.update(id, updateData);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string, restaurantId: string) {
    const product = await this.getProduct(id, restaurantId);

    // Check if product is referenced in order items
    const ordersCount = await prisma.orderItem.count({
      where: {
        productId: id,
      },
    });

    if (ordersCount > 0) {
      throw new AppError(
        "Cannot delete product because it is associated with existing order records. You can mark it as unavailable instead to hide it from the menu.",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Delete image from Cloudinary if exists
    if (product.image?.includes("res.cloudinary.com")) {
      void deleteImageFromCloudinary(product.image);
    }

    return productRepository.delete(id);
  }
}

const productService = new ProductService();
export default productService;
