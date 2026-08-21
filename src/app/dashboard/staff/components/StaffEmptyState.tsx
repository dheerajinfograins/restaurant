"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffEmptyStateProps {
  isFiltered: boolean;
  onResetFilters: () => void;
}

export function StaffEmptyState({ isFiltered, onResetFilters }: Readonly<StaffEmptyStateProps>) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center">
      <div className="p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100">
        <Users className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-base font-bold text-gray-800">
        {isFiltered ? "No staff members match your search criteria" : "No staff members registered"}
      </h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">
        {isFiltered
          ? "Try clearing your search term or selecting a different role filter."
          : "Add waiters, kitchen staff, and managers to manage your restaurant operations."}
      </p>
      {isFiltered && (
        <Button variant="outline" size="sm" className="mt-4 text-xs rounded-xl" onClick={onResetFilters}>
          Reset Filters
        </Button>
      )}
    </div>
  );
}
