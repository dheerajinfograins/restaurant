import { Metadata } from "next";
import { Suspense } from "react";
import { CategoryList } from "@/components/category/category-list";

export const metadata: Metadata = {
  title: "Menu Categories & Sections | The Culinary Ledger",
  description: "Manage restaurant menu categories, sections, and digital QR visibility",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-cormorant">
          Menu Categories & Sections
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Organize dishes into menu sections, customize category banners, and toggle live visibility on customer QR menus.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-20 space-y-3 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
            <p className="text-sm font-semibold text-gray-500">Loading menu categories...</p>
          </div>
        }
      >
        <CategoryList />
      </Suspense>
    </div>
  );
}
