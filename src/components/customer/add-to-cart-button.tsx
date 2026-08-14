"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  readonly product: {
    readonly id: string;
    readonly name: string;
    readonly price: number;
    readonly image?: string | null;
    readonly foodType: string;
  };
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
      foodType: product.foodType,
    });
    
    toast.success(`Added ${quantity} ${product.name} to cart`, {
      style: {
        borderRadius: '16px',
        background: '#333',
        color: '#fff',
      },
    });
    // Reset quantity after adding
    setQuantity(1);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center bg-gray-100 rounded-2xl h-14">
        <button 
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-12 h-full flex items-center justify-center text-xl font-bold text-culinary-text"
        >
          -
        </button>
        <span className="w-8 text-center font-bold text-culinary-text">{quantity}</span>
        <button 
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          className="w-12 h-full flex items-center justify-center text-xl font-bold text-culinary-text"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        className="flex-1 h-14 bg-culinary-primary hover:bg-culinary-secondary text-white rounded-2xl font-bold text-lg shadow-lg shadow-culinary-primary/30 transition-transform active:scale-[0.98]"
      >
        Add to Cart - ₹{product.price * quantity}
      </button>
    </div>
  );
}
