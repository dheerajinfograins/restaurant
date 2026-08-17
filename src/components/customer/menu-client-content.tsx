"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, UtensilsCrossed, Clock, Star, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  foodType: string;
  preparationTime: number | null;
  categoryId: string;
};

type Restaurant = {
  id: string;
  name: string;
  logo: string | null;
};

interface MenuClientContentProps {
  readonly tableId: string;
  readonly tableNumber: string;
  readonly restaurant: Restaurant;
  readonly categories: Category[];
  readonly products: Product[];
}

export function MenuClientContent({
  tableId,
  tableNumber,
  restaurant,
  categories,
  products,
}: MenuClientContentProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "All" || product.categoryId === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getProductQuantity = (productId: string) => {
    return items.find((item) => item.id === productId)?.quantity || 0;
  };

  const handleAdd = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      foodType: product.foodType,
    });
    toast.success(`Added ${product.name} to cart`, {
      style: { borderRadius: '16px', background: '#333', color: '#fff' }
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <>
      {/* Header / Banner */}
      <div className="w-full bg-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-culinary-primary/10 rounded-full flex items-center justify-center overflow-hidden relative">
              {restaurant.logo ? (
                <Image src={restaurant.logo} alt={restaurant.name} fill sizes="48px" className="object-cover" />
              ) : (
                <UtensilsCrossed className="text-culinary-primary w-6 h-6" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-cormorant text-culinary-text">{restaurant.name}</h1>
              <p className="text-sm text-culinary-text/60 font-medium">Table {tableNumber}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-culinary-text/40 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-[#FDFBF7] border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-culinary-primary/20 transition-all placeholder:text-culinary-text/40"
          />
        </div>
      </div>

      <div className="px-6 space-y-10">
        {/* Categories */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-cormorant text-culinary-text">Categories</h2>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            <button type="button"
              onClick={() => setActiveCategory("All")}
              className={`flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCategory === "All"
                ? "bg-culinary-primary text-white shadow-md shadow-culinary-primary/20"
                : "bg-white text-culinary-text border border-culinary-border/40 hover:border-culinary-primary/30"
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button type="button"
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCategory === category.id
                  ? "bg-culinary-primary text-white shadow-md shadow-culinary-primary/20"
                  : "bg-white text-culinary-text border border-culinary-border/40 hover:border-culinary-primary/30"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Products */}
        <section>
          <h2 className="text-xl font-bold font-cormorant text-culinary-text mb-6">
            {activeCategory === "All" ? "Popular Dishes" : categories.find(c => c.id === activeCategory)?.name}
          </h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-culinary-text/60">No dishes found.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredProducts.map((product) => {
                const quantity = getProductQuantity(product.id);

                return (
                  <div key={product.id} className="bg-white rounded-3xl p-3 flex gap-4 border border-culinary-border/30 shadow-sm">
                    {/* Make the left side and text clickable */}
                    <Link href={`/product/${product.id}?tableId=${tableId}`} className="flex gap-4 flex-1">
                      <div className="w-28 h-28 bg-gray-100 rounded-2xl flex-none overflow-hidden relative">
                        {product.image ? (
                          <Image src={product.image} alt={product.name} fill sizes="112px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <UtensilsCrossed size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col justify-between py-1 w-full">
                        <div>
                          <div className="flex justify-between items-start pr-2">
                            <h3 className="font-semibold text-culinary-text leading-tight pr-2">{product.name}</h3>
                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5">
                              <Star size={10} className="fill-current" />
                              <span>4.8</span>
                            </div>
                          </div>
                          <p className="text-xs text-culinary-text/60 mt-1 line-clamp-2 pr-2">{product.description}</p>
                        </div>

                        <div className="flex flex-col mt-2">
                          <span className="text-lg font-bold text-culinary-text">₹{product.price}</span>
                          {product.preparationTime && (
                            <span className="text-[10px] text-culinary-text/50 flex items-center gap-1 font-medium mt-0.5">
                              <Clock size={10} /> {product.preparationTime} min
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Add to Cart Actions */}
                    <div className="flex flex-col justify-end pb-1 pr-1 shrink-0">
                      {quantity > 0 ? (
                        <div className="flex items-center bg-black text-white rounded-xl h-8 overflow-hidden shadow-md">
                          <button type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateQuantity(product.id, quantity - 1); }}
                            className="w-8 h-full flex items-center justify-center font-bold hover:bg-gray-800 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateQuantity(product.id, quantity + 1); }}
                            className="w-8 h-full flex items-center justify-center font-bold hover:bg-gray-800 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(product); }}
                          className="px-5 py-2 h-8 flex items-center justify-center bg-black text-white text-xs font-semibold rounded-xl shadow-md active:scale-95 transition-transform hover:bg-gray-800"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
