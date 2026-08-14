import { CreateProductDto, UpdateProductDto } from "./dto";
import productRepository, { ProductFilters } from "./repository";
import { AppError, HTTP_STATUS } from "@/exceptions";
import { PRODUCT_MESSAGES } from "./constants";

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

    return productRepository.create({
      ...data,
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

    return productRepository.update(id, updateData);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string, restaurantId: string) {
    await this.getProduct(id, restaurantId);
    return productRepository.delete(id);
  }
}

const productService = new ProductService();
export default productService;
