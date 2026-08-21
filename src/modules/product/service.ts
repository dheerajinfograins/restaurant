import { CreateProductDto, UpdateProductDto } from "./dto";
import productRepository, { ProductFilters } from "./repository";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { PRODUCT_MESSAGES } from "./constants";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

class ProductService {
  /**
   * Get all products for a restaurant
   */
  async getProducts(restaurantId: string, filters?: ProductFilters) {
    return productRepository.findByRestaurantId(restaurantId, filters);
  }

  /**
   * Create a new product
   */
  async createProduct(restaurantId: string, data: CreateProductDto) {
    // Check if product with same name exists for this restaurant
    const existingProduct = await productRepository.findByName(data.name, restaurantId);
    
    if (existingProduct) {
      throw new AppError(
        PRODUCT_MESSAGES.ALREADY_EXISTS,
        HTTP_STATUS.CONFLICT
      );
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    let imageUrl = data.image;
    // If image is a base64 data URI, upload directly to Cloudinary
    if (imageUrl?.startsWith("data:image")) {
      try {
        const uploadResult = await uploadImageToCloudinary(imageUrl, "products");
        imageUrl = uploadResult.url;
      } catch (err) {
        console.error("Failed to upload product image to Cloudinary:", err);
      }
    }

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
    const updateData: UpdateProductDto & { slug?: string } = { ...data };

    // If name is being updated, ensure it doesn't conflict and update slug
    if (data.name && data.name.toLowerCase() !== product.name.toLowerCase()) {
      const existingProduct = await productRepository.findByName(data.name, restaurantId);
      if (existingProduct) {
        throw new AppError(
          PRODUCT_MESSAGES.ALREADY_EXISTS,
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
          const uploadResult = await uploadImageToCloudinary(newImageUrl, "products");
          newImageUrl = uploadResult.url;
          updateData.image = newImageUrl;
        } catch (err) {
          console.error("Failed to upload updated product image to Cloudinary:", err);
        }
      }

      // If previous image was Cloudinary and changed, delete the old image
      if (product.image !== newImageUrl && product.image?.includes("res.cloudinary.com")) {
        void deleteImageFromCloudinary(product.image);
      }
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
