import { CreateProductDto, UpdateProductDto } from "./dto";
import productService from "./service";
import { createProductSchema, updateProductSchema } from "./validation";
import { successResponse } from "@/lib/api-response";
import { PRODUCT_MESSAGES } from "./constants";
import { ProductFilters } from "./repository";

class ProductController {
  async getProducts(restaurantId: string, filters?: ProductFilters) {
    const products = await productService.getProducts(restaurantId, filters);
    return successResponse(PRODUCT_MESSAGES.FETCHED, products);
  }

  async createProduct(restaurantId: string, body: CreateProductDto) {
    const validatedData = createProductSchema.parse(body);
    const product = await productService.createProduct(restaurantId, validatedData);
    return successResponse(PRODUCT_MESSAGES.CREATED, product, 201);
  }

  async getProduct(id: string, restaurantId: string) {
    const product = await productService.getProduct(id, restaurantId);
    return successResponse(PRODUCT_MESSAGES.FETCHED, product);
  }

  async updateProduct(id: string, restaurantId: string, body: UpdateProductDto) {
    const validatedData = updateProductSchema.parse(body);
    const product = await productService.updateProduct(id, restaurantId, validatedData);
    return successResponse(PRODUCT_MESSAGES.UPDATED, product);
  }

  async deleteProduct(id: string, restaurantId: string) {
    await productService.deleteProduct(id, restaurantId);
    return successResponse(PRODUCT_MESSAGES.DELETED);
  }
}

const productController = new ProductController();
export default productController;
