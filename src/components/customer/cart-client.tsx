"use client";

import { useCartStore } from "@/store/cart-store";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CartClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { items, tableId, removeItem, updateQuantity, getTotalPrice } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🛒</span>
        </div>
        <h2 className="text-2xl font-bold font-cormorant text-culinary-text mb-2">Your cart is empty</h2>
        <p className="text-culinary-text/60 mb-8">Looks like you haven&apos;t added any delicious items yet.</p>
        <Link 
          href={tableId ? `/menu/${tableId}` : "#"}
          className="px-8 py-3 bg-culinary-primary text-white rounded-xl font-semibold shadow-md"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const taxes = subtotal * 0.05; // 5% tax example
  const total = subtotal + taxes;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Header */}
      <div className="flex items-center p-6 bg-white shadow-sm mb-6">
        <button type="button" onClick={() => router.back()} className="mr-4">
          <ArrowLeft size={24} className="text-culinary-text" />
        </button>
        <h1 className="text-2xl font-bold font-cormorant text-culinary-text">Your Cart</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Cart Items */}
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
            <div className="w-20 h-20 bg-gray-100 rounded-xl relative overflow-hidden flex-none">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-culinary-text leading-tight">{item.name}</h3>
                  <p className="text-xs text-culinary-text/60 mt-1">₹{item.price}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold text-culinary-primary">₹{item.price * item.quantity}</span>
                
                <div className="flex items-center bg-gray-100 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-culinary-text font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button 
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-culinary-text font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Premium Invoice Bill Summary */}
        <div className="mt-10 relative bg-[#FFFDF8] p-8 rounded-lg shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] border border-[#E8DFC8] mx-auto max-w-lg mb-8">
          {/* Classic top border highlight */}
          <div className="absolute top-0 left-0 w-full h-2 bg-culinary-primary/90 rounded-t-lg"></div>
          
          <div className="text-center mb-8 pt-2">
            <h2 className="text-4xl font-bold font-cormorant text-culinary-text uppercase tracking-[0.2em]">Invoice</h2>
            <p className="text-sm text-culinary-text/60 mt-2 font-medium tracking-widest uppercase">The Culinary Ledger</p>
            <p className="text-xs text-culinary-text/40 mt-1">Date: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>

          <div className="border-b border-dashed border-[#D4C3A3] mb-6"></div>

          {/* Itemized List inside Invoice */}
          <div className="space-y-4 text-sm font-medium mb-6">
            <div className="flex justify-between text-culinary-text/50 text-xs uppercase tracking-wider mb-2">
              <span className="w-2/3">Item</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Amount</span>
            </div>
            
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-culinary-text/80 items-start">
                <span className="w-2/3 pr-2 leading-tight">{item.name}</span>
                <span className="w-1/6 text-center">x{item.quantity}</span>
                <span className="w-1/6 text-right font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-[#D4C3A3] mb-6"></div>

          {/* Subtotals */}
          <div className="space-y-3 text-sm font-medium mb-6">
            <div className="flex justify-between text-culinary-text/70 items-center">
              <span>Subtotal</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-culinary-text/70 items-center">
              <span>Taxes (5% GST)</span>
              <span className="font-semibold">₹{taxes.toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b-2 border-solid border-culinary-primary/20 mb-6"></div>

          {/* Grand Total */}
          <div className="flex justify-between items-center text-culinary-text bg-[#F9F3E5] p-5 rounded-xl shadow-inner border border-[#E8DFC8]/50">
            <span className="text-2xl font-bold font-cormorant tracking-wide">Grand Total</span>
            <span className="text-3xl font-bold text-culinary-primary">₹{total.toFixed(2)}</span>
          </div>

          <div className="mt-8 text-center text-xs text-culinary-text/40 uppercase tracking-widest">
            <p>Thank you for choosing us</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe">
        <div className="max-w-md mx-auto p-4 sm:p-6 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-culinary-text/70 font-medium">Amount to pay</span>
            <span className="text-xl font-bold text-culinary-text">₹{total.toFixed(2)}</span>
          </div>
          <Link 
            href="/checkout"
            className="flex-1 py-4 bg-culinary-primary text-center text-white rounded-2xl font-bold text-lg shadow-lg shadow-culinary-primary/30"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
