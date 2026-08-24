"use client";

import { useCartStore } from "@/store/cart-store";
import { ArrowLeft, Minus, Plus, Trash2, UtensilsCrossed, ChevronRight, Receipt, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CartClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { items, tableId, restaurantName, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center animate-in fade-in-50 duration-300">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-amber-100/80 rounded-3xl flex items-center justify-center mb-5 border border-amber-200 shadow-sm relative">
          <ShoppingBag size={42} className="text-culinary-primary" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-stone-900 text-xs font-black flex items-center justify-center shadow-xs">
            0
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text mb-2">
          Your Cart is Empty
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xs mb-8 leading-relaxed">
          Looks like you haven&apos;t added any delicious dishes yet. Explore our handcrafted menu!
        </p>
        <Link
          href={tableId ? `/menu/${tableId}` : "/"}
          className="px-8 py-3.5 bg-culinary-primary hover:bg-culinary-primary/90 text-white rounded-2xl font-bold text-sm shadow-md shadow-culinary-primary/25 active:scale-95 transition-all flex items-center gap-2"
        >
          <UtensilsCrossed size={16} />
          <span>Explore Menu</span>
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const taxes = subtotal * 0.05; // 5% GST
  const total = subtotal + taxes;
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const renderFoodTypeBadge = (foodType?: string) => {
    if (foodType === "VEG") {
      return (
        <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Pure Veg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
        </div>
      );
    } else if (foodType === "NON_VEG") {
      return (
        <div className="w-3.5 h-3.5 border border-rose-600 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Non-Veg">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-600"></div>
        </div>
      );
    } else if (foodType === "EGG") {
      return (
        <div className="w-3.5 h-3.5 border border-amber-500 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Contains Egg">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
        </div>
      );
    }
    return null;
  };

  const hasVeg = items.some((i) => i.foodType === "VEG");
  const hasNonVeg = items.some((i) => i.foodType === "NON_VEG");
  const hasEgg = items.some((i) => i.foodType === "EGG");

  const dietaryNotice = (() => {
    if (!hasVeg && (hasNonVeg || hasEgg)) {
      return {
        badge: "100% Non-Veg & Egg Order",
        color: "bg-rose-50 border-rose-200 text-rose-800",
        icon: "🍗",
      };
    }
    if (hasVeg && !hasNonVeg && !hasEgg) {
      return {
        badge: "100% Pure Vegetarian Order",
        color: "bg-emerald-50 border-emerald-200 text-emerald-800",
        icon: "🌱",
      };
    }
    return {
      badge: "Multi-Cuisine Dining Order",
      color: "bg-amber-50 border-amber-200 text-amber-900",
      icon: "🥗🍗",
    };
  })();

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-36 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 text-culinary-primary flex items-center justify-center border border-amber-200/70 transition-all active:scale-95 shadow-2xs"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-cormorant text-culinary-text leading-tight">Your Cart</h1>
            <p className="text-[11px] text-gray-500 font-medium">Review your items before ordering</p>
          </div>
        </div>

        <div className="bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold text-amber-900 flex items-center gap-1.5 shadow-2xs">
          <span>{totalItemCount}</span>
          <span>{totalItemCount === 1 ? "item" : "items"}</span>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        {/* Dietary Classification Banner */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-semibold ${dietaryNotice.color}`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{dietaryNotice.icon}</span>
            <span>{dietaryNotice.badge}</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono uppercase tracking-wider">Verified Kitchen</span>
        </div>

        {/* Cart Item Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Items</h2>
            <Link
              href={tableId ? `/menu/${tableId}` : "/"}
              className="text-xs font-bold text-culinary-primary hover:underline flex items-center gap-0.5"
            >
              <span>+ Add More</span>
            </Link>
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-3.5 rounded-3xl shadow-xs border border-gray-100 hover:border-amber-200/80 transition-all flex gap-3.5 relative overflow-hidden group"
            >
              {/* Dish Image Thumbnail */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/40 relative overflow-hidden shrink-0 border border-gray-100">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-700/40 gap-0.5">
                    <UtensilsCrossed size={20} />
                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">Dish</span>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {renderFoodTypeBadge(item.foodType)}
                      <h3 className="font-bold text-culinary-text text-sm sm:text-base leading-tight truncate">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      ₹{Number(item.price).toFixed(2)} each
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="w-7 h-7 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Price & Quantity Stepper */}
                <div className="flex justify-between items-center mt-2 pt-1">
                  <span className="font-black text-culinary-primary font-cormorant text-lg">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>

                  <div className="flex items-center bg-gray-900 text-white rounded-xl h-7 overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-full flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-full flex items-center justify-center hover:bg-gray-800 active:bg-gray-700 transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Premium Invoice Bill Summary */}
        <section className="relative bg-[#FFFDF8] p-6 sm:p-7 rounded-3xl shadow-sm border border-[#E8DFC8] overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-culinary-primary to-amber-600"></div>

          <div className="text-center mb-5 pt-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-800 text-xs font-bold tracking-widest uppercase mb-1">
              <Receipt size={14} />
              <span>Bill Summary</span>
            </div>
            <h2 className="text-2xl font-bold font-cormorant text-culinary-text tracking-wide">
              {restaurantName || "The Culinary Ledger"}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="border-b border-dashed border-[#D4C3A3]/80 my-4"></div>

          {/* Itemized List */}
          <div className="space-y-2.5 text-xs font-medium">
            <div className="flex justify-between text-gray-400 font-bold uppercase tracking-wider pb-1">
              <span className="w-7/12">Item</span>
              <span className="w-2/12 text-center">Qty</span>
              <span className="w-3/12 text-right">Amount</span>
            </div>

            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-stone-800 items-start">
                <span className="w-7/12 pr-2 leading-tight truncate">{item.name}</span>
                <span className="w-2/12 text-center text-gray-500 font-semibold">x{item.quantity}</span>
                <span className="w-3/12 text-right font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-[#D4C3A3]/80 my-4"></div>

          {/* Subtotals & Taxes */}
          <div className="space-y-2 text-xs font-medium text-stone-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-stone-900">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Taxes (5% GST)</span>
              <span className="font-semibold text-stone-900">₹{taxes.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b-2 border-solid border-culinary-primary/20 my-4"></div>

          {/* Grand Total */}
          <div className="flex justify-between items-center bg-[#F9F3E5] p-4 rounded-2xl border border-[#E8DFC8]/70 shadow-inner">
            <div>
              <span className="text-base font-bold font-cormorant text-stone-900 block leading-tight">Grand Total</span>
              <span className="text-[10px] text-stone-500 font-medium">Inclusive of all taxes</span>
            </div>
            <span className="text-2xl font-black text-culinary-primary font-cormorant">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <div className="mt-5 text-center text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            <p>Freshly prepared upon your order</p>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-md mx-auto p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">To Pay</span>
            <span className="text-xl font-black text-culinary-primary font-cormorant leading-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>
          <Link
            href="/checkout"
            className="flex-1 py-3.5 bg-gradient-to-r from-amber-600 to-culinary-primary hover:from-amber-700 hover:to-culinary-primary/90 text-center text-white rounded-2xl font-bold text-sm shadow-md shadow-amber-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
