"use client";

import { useCartStore } from "@/store/cart-store";
import { ShoppingBag, ArrowRight, ChefHat } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

export function CartFloatingButton() {
  const [isMounted, setIsMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems());
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const activeOrderId = useCartStore((state) => state.activeOrderId);
  
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const isCartPage = pathname === '/cart';
  const isCheckoutPage = pathname === '/checkout';
  const isOrderPage = pathname.startsWith('/order/');

  if (!isMounted) return null;

  const isOrderTrackingOnly = getTotalItems === 0 && activeOrderId;

  // Don't show if cart is empty and no active order
  if (getTotalItems === 0 && !activeOrderId) return null;
  
  // Don't show cart button if on cart or checkout page
  if (getTotalItems > 0 && (isCartPage || isCheckoutPage)) return null;
  
  // Don't show tracking button if already on order page
  if (isOrderTrackingOnly && isOrderPage) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-6 max-w-md mx-auto">
      {isOrderTrackingOnly ? (
        <Link href={`/order/${activeOrderId}`} className="block relative group">
          <div className="absolute inset-0 bg-green-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse"></div>
          
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
      ) : (
        <Link href="/cart" className="block relative group">
          {/* Animated Glow/Pulse Effect Behind */}
          <div className="absolute inset-0 bg-culinary-primary rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse"></div>
          
          {/* Main Button */}
          <div className="relative bg-gradient-to-r from-gray-900 to-black border border-gray-800 text-white rounded-2xl p-4 flex items-center justify-between shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="relative bg-white/10 p-2 rounded-xl">
                <ShoppingBag size={22} className="text-culinary-primary" />
                {/* Blinking badge */}
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-gray-900 animate-bounce">
                  {getTotalItems}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Your Order</span>
                <span className="text-lg font-bold text-white font-cormorant tracking-wide">₹{getTotalPrice.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/5">
              <span className="text-sm font-semibold tracking-wide text-white">View Cart</span>
              <ArrowRight size={16} className="text-culinary-primary animate-pulse" />
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
