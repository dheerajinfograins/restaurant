"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart-store";

export function MenuClientInit({
  tableId,
  restaurantId,
}: {
  tableId: string;
  restaurantId: string;
}) {
  const setContext = useCartStore((state) => state.setContext);

  useEffect(() => {
    setContext(tableId, restaurantId);
  }, [tableId, restaurantId, setContext]);

  return null;
}
