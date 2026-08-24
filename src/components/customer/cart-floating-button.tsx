"use client";

import { useCartStore, type CartItem } from "@/store/cart-store";
import { ShoppingBag, ArrowRight, ChefHat } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface CartTheme {
  glowColor: string;
  badgeColor: string;
  orderLabel: string;
  textColor: string;
}

function getCartTheme(items: CartItem[]): CartTheme {
  const isPureVeg = items.length > 0 && items.every((i) => i.foodType === "VEG");
  if (isPureVeg) {
    return {
      glowColor: "bg-emerald-500",
      badgeColor: "bg-emerald-600",
      orderLabel: "🌱 Veg Order",
      textColor: "text-emerald-400",
    };
  }

  const isPureNonVeg = items.length > 0 && items.every((i) => i.foodType === "NON_VEG" || i.foodType === "EGG");
  if (isPureNonVeg) {
    return {
      glowColor: "bg-rose-500",
      badgeColor: "bg-rose-600",
      orderLabel: "🍗 Non-Veg Order",
      textColor: "text-rose-400",
    };
  }

  return {
    glowColor: "bg-culinary-primary",
    badgeColor: "bg-amber-500",
    orderLabel: "🥗🍗 Your Order",
    textColor: "text-culinary-primary",
  };
}

function shouldShowButton({
  isMounted,
  totalItems,
  activeOrderId,
  pathname,
}: Readonly<{
  isMounted: boolean;
  totalItems: number;
  activeOrderId: string | null;
  pathname: string;
}>): boolean {
  if (!isMounted) return false;
  if (totalItems === 0 && !activeOrderId) return false;
  if (totalItems > 0 && (pathname === "/cart" || pathname === "/checkout")) return false;
  if (totalItems === 0 && activeOrderId && pathname.startsWith("/order/")) return false;
  return true;
}

function OrderTrackingButton({ orderId }: Readonly<{ orderId: string }>) {
  return (
    <Link href={`/order/${orderId}`} className="block relative group">
      <div className="absolute inset-0 bg-green-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />
      
      <div className="relative bg-gradient-to-r from-green-900 to-black border border-green-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative bg-white/10 p-2 rounded-xl">
            <ChefHat size={22} className="text-green-400 animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-green-300 font-medium uppercase tracking-widest">Order Accepted</span>
            <span className="text-lg font-bold text-white tracking-wide">Track your food</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/5">
          <span className="text-sm font-semibold tracking-wide text-white">View</span>
          <ArrowRight size={16} className="text-green-400 animate-pulse" />
        </div>
      </div>
    </Link>
  );
}

function CartSummaryButton({
  items,
  totalItems,
  totalPrice,
}: Readonly<{
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}>) {
  const theme = getCartTheme(items);

  return (
    <Link href="/cart" className="block relative group">
      {/* Animated Glow/Pulse Effect Behind */}
      <div className={`absolute inset-0 ${theme.glowColor} rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse`} />
      
      {/* Main Button */}
      <div className="relative bg-gradient-to-r from-gray-900 to-black border border-gray-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="relative bg-white/10 p-2 rounded-xl">
            <ShoppingBag size={22} className={theme.textColor} />
            {/* Blinking badge */}
            <span className={`absolute -top-2 -right-2 ${theme.badgeColor} text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 animate-bounce`}>
              {totalItems}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">{theme.orderLabel}</span>
            <span className="text-lg font-bold text-white font-cormorant tracking-wide">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/5">
          <span className="text-sm font-semibold tracking-wide text-white">View Cart</span>
          <ArrowRight size={16} className={`${theme.textColor} animate-pulse`} />
        </div>
      </div>
    </Link>
  );
}

export function CartFloatingButton() {
  const [isMounted, setIsMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems());
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const activeOrderId = useCartStore((state) => state.activeOrderId);
  
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isVisible = shouldShowButton({
    isMounted,
    totalItems: getTotalItems,
    activeOrderId,
    pathname,
  });

  if (!isVisible) return null;

  const isOrderTrackingOnly = getTotalItems === 0 && Boolean(activeOrderId);

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 max-w-md mx-auto">
      {isOrderTrackingOnly && activeOrderId ? (
        <OrderTrackingButton orderId={activeOrderId} />
      ) : (
        <CartSummaryButton
          items={items}
          totalItems={getTotalItems}
          totalPrice={getTotalPrice}
        />
      )}
    </div>
  );
}
