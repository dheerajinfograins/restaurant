"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

export function MenuClientInit({
  tableId,
  restaurantId,
  restaurantName,
}: {
  tableId: string;
  restaurantId: string;
  restaurantName?: string;
}) {
  const setContext = useCartStore((state) => state.setContext);

  useEffect(() => {
    setContext(tableId, restaurantId, restaurantName);
  }, [tableId, restaurantId, restaurantName, setContext]);

  return null;
}
