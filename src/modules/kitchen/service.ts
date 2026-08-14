import { KitchenRepository } from "./repository";
import { OrderStatus } from "@prisma/client";

export class KitchenService {
  private readonly repository: KitchenRepository;

  constructor() {
    this.repository = new KitchenRepository();
  }

  async getActiveKitchenOrders() {
    return this.repository.getActiveKitchenOrders();
  }

  async acceptOrder(orderId: string) {
    return this.repository.updateOrderStatus(orderId, OrderStatus.PREPARING);
  }

  async markAsPreparing(orderId: string) {
    return this.repository.updateOrderStatus(orderId, OrderStatus.PREPARING);
  }

  async markAsReady(orderId: string) {
    return this.repository.updateOrderStatus(orderId, OrderStatus.READY);
  }

  async markAsServed(orderId: string) {
    return this.repository.updateOrderStatus(orderId, OrderStatus.SERVED);
  }

  async getAllProducts() {
    return this.repository.getAllProducts();
  }

  async toggleProductAvailability(productId: string, isAvailable: boolean) {
    return this.repository.toggleProductAvailability(productId, isAvailable);
  }

  async getKitchenHistory(timeRange: "today" | "week" | "all" = "today") {
    return this.repository.getKitchenHistory(timeRange);
  }
}
