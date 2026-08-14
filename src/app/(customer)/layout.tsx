import { ReactNode } from "react";
import { CartFloatingButton } from "@/components/customer/cart-floating-button";

export default function CustomerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-culinary-text selection:bg-culinary-primary/20">
      <main className="mx-auto max-w-md min-h-screen bg-white shadow-2xl relative pb-24 sm:pb-0 overflow-x-hidden">
        {children}
        <CartFloatingButton />
      </main>
    </div>
  );
}
