"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  foodType: string;
  image?: string | null;
  description?: string | null;
};

type Settings = {
  showVegNonVeg?: boolean;
  qrShowImages?: boolean;
  qrShowPrices?: boolean;
  allowOrdering?: boolean;
};

export function ProductListClient({ products, tableId, settings }: Readonly<{ products: Product[], tableId: string, settings?: Settings | null }>) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const router = useRouter();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleTypeSelection = (type: "VEG" | "NON_VEG") => {
    if (selectedProduct) {
      router.push(`/product/${selectedProduct.id}?tableId=${tableId}&type=${type}`);
      setSelectedProduct(null);
    }
  };

  const showVegIcon = settings?.showVegNonVeg !== false;
  const showPrices = settings?.qrShowPrices !== false;

  const renderFoodTypeIcon = (foodType: string) => {
    if (!showVegIcon) return null;
    
    if (foodType === "VEG") {
      return (
        <div className="w-4 h-4 border border-green-600 flex items-center justify-center rounded-sm shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-600"></div>
        </div>
      );
    } else if (foodType === "NON_VEG") {
      return (
        <div className="w-4 h-4 border border-red-600 flex items-center justify-center rounded-sm shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-600"></div>
        </div>
      );
    } else if (foodType === "EGG") {
      return (
        <div className="w-4 h-4 border border-yellow-500 flex items-center justify-center rounded-sm shrink-0">
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
    <div className="space-y-4">
      {products.map((product) => (
        <button
          type="button"
          key={product.id}
          onClick={() => handleProductClick(product)}
          className="bg-white rounded-2xl p-4 flex gap-4 items-start border border-culinary-border/30 shadow-sm cursor-pointer w-full text-left transition-all hover:shadow-md"
        >
          {settings?.qrShowImages !== false && product.image && (
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 relative">
              <Image src={product.image} alt={product.name} fill sizes="80px" className="object-cover" />
            </div>
          )}
          
          <div className="flex-1 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {renderFoodTypeIcon(product.foodType)}
                <h3 className="font-bold text-culinary-text text-lg leading-tight">{product.name}</h3>
              </div>
              {product.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{product.description}</p>
              )}
            </div>
            
            {showPrices && (
              <div className="mt-2 font-semibold text-culinary-primary">
                ₹{Number(product.price).toFixed(2)}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>

    {/* Popup / Modal for Veg/Non-Veg Selection */}
    {selectedProduct && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 relative shadow-xl">
          <button
            type="button"
            onClick={() => setSelectedProduct(null)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          <h3 className="text-xl font-bold text-culinary-text mb-6 text-center">
            Select Type for {selectedProduct.name}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleTypeSelection("VEG")}
              className="py-4 rounded-2xl border-2 border-green-500 bg-green-50 text-green-700 font-bold flex flex-col items-center gap-2 hover:bg-green-100 transition-colors shadow-sm"
            >
              <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-600"></div>
              </div>
              Veg
            </button>

            <button
              type="button"
              onClick={() => handleTypeSelection("NON_VEG")}
              className="py-4 rounded-2xl border-2 border-red-500 bg-red-50 text-red-700 font-bold flex flex-col items-center gap-2 hover:bg-red-100 transition-colors shadow-sm"
            >
              <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
              Non-Veg
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
