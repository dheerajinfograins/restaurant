// Automatic progression is disabled because Kitchen Display System (KDS) handles it manually
export async function autoProgressOrder<T>(order: T): Promise<T> {
  return order;
}

export async function autoProgressOrders<T>(orders: T[]): Promise<T[]> {
  return orders;
}
