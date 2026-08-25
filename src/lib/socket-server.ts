/**
 * Server-side Socket.IO Event Dispatcher
 *
 * Provides tenant isolation and global Super Admin visibility:
 * - If `restaurantId` is provided:
 *     - Emits to `restaurant:${restaurantId}` (Tenant scoped: only staff/managers of this restaurant).
 *     - ALSO emits to `super_admin` (Super Admin receives ALL events from ALL restaurants).
 * - If `restaurantId` is not provided (System-wide events like new restaurant registration):
 *     - Emits to all connected clients / `super_admin`.
 */
export function emitAppSocketEvent(
  eventName: string,
  data: unknown,
  restaurantId?: string | null
) {
  try {
    // @ts-expect-error - global.io is attached in server.ts
    const io = global.io;
    if (!io) return;

    if (restaurantId) {
      // Room array broadcasts to the restaurant room AND super_admin room without duplication
      io.to([`restaurant:${restaurantId}`, "super_admin"]).emit(eventName, data);
    } else {
      io.emit(eventName, data);
    }
  } catch (err) {
    console.error(`Failed to emit socket event '${eventName}':`, err);
  }
}
