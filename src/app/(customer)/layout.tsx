import { ReactNode } from "react";
import { CartFloatingButton } from "@/components/customer/cart-floating-button";

export default function CustomerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-stone-100 flex justify-center text-stone-900 selection:bg-amber-700 selection:text-white">
      <main className="w-full max-w-md min-h-screen bg-[#FDFBF7] shadow-2xl relative overflow-x-hidden border-x border-stone-200/70">
        {children}
        <CartFloatingButton />
      </main>
    </div>
  );
}
