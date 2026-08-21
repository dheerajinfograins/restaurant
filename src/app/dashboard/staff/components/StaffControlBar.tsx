"use client";

import { Search, LayoutGrid, List, RotateCw, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLE_FILTERS } from "../types";

interface StaffControlBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: "cards" | "table";
  onViewModeChange: (mode: "cards" | "table") => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddStaff: () => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  filterCounts: Record<string, number>;
}

export function StaffControlBar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  isRefreshing,
  onRefresh,
  onAddStaff,
  roleFilter,
  onRoleFilterChange,
  filterCounts,
}: Readonly<StaffControlBarProps>) {
  return (
    <div className="p-5 border-b border-gray-100 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
          <input
            type="text"
            placeholder="Search staff by name, email, phone, role..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
          />
          {searchTerm && (
            <button type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200/80 rounded-full w-4 h-4 flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Controls: View Mode, Refresh & Add Staff Button */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Cards vs Table Switcher */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => onViewModeChange("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "cards"
                ? "bg-white text-culinary-primary shadow-sm font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === "table"
                ? "bg-white text-culinary-primary shadow-sm font-bold"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <List size={14} />
              <span>Table</span>
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
            Refresh
          </Button>

          {/* Add Staff Button */}
          <Button
            size="sm"
            onClick={onAddStaff}
            className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold h-9 px-4 rounded-xl shadow-sm text-xs gap-1.5"
          >
            <Plus size={15} /> Add Staff Member
          </Button>
        </div>
      </div>

      {/* Role Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin pt-2">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1 shrink-0 uppercase tracking-wider text-[11px]">
          <Filter className="h-3 w-3" /> Role:
        </span>
        {ROLE_FILTERS.map((filter) => {
          const count = filterCounts[filter.value] || 0;
          const isSelected = roleFilter === filter.value;
          return (
            <button type="button"
              key={filter.value}
              onClick={() => onRoleFilterChange(filter.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${isSelected
                ? "bg-culinary-primary text-white shadow-sm font-semibold"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                }`}
            >
              {filter.label}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
