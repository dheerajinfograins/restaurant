import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // product id
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  foodType: string;
}

interface CartState {
  items: CartItem[];
  tableId: string | null;
  restaurantId: string | null;
  activeOrderId: string | null;
  
  // Actions
  setContext: (tableId: string, restaurantId: string) => void;
  setActiveOrderId: (orderId: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed values
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      restaurantId: null,
      activeOrderId: null,

      setContext: (tableId, restaurantId) => {
        const current = get();
        // If context changes (e.g. scanning a different QR), clear cart
        if (current.tableId !== tableId || current.restaurantId !== restaurantId) {
          set({ tableId, restaurantId, items: [] });
        }
      },

      setActiveOrderId: (orderId) => set({ activeOrderId: orderId }),

      addItem: (item) => {
        set((state) => {
          const itemExists = state.items.some((i) => i.id === item.id);
          
          if (itemExists) {
            return {
              items: state.items.map((i) => 
                i.id === item.id 
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            };
          }
          
          return { items: [...state.items, item] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id)
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((i) => 
            i.id === id ? { ...i, quantity } : i
          ).filter((i) => i.quantity > 0)
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'culinary-cart-storage',
    }
  )
);
