"use client";

import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePageNumbers } from "../utils/staffHelpers";

interface StaffPaginationProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  startItemNumber: number;
  endItemNumber: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function StaffPagination({
  pageSize,
  onPageSizeChange,
  startItemNumber,
  endItemNumber,
  totalItems,
  currentPage,
  totalPages,
  onPageChange,
}: Readonly<StaffPaginationProps>) {
  if (totalItems === 0) return null;

  const pageNumbers = generatePageNumbers(totalPages, currentPage);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30"
          >
            <option value={5}>5</option>
            <option value={9}>9</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div>
          Showing <span className="font-semibold text-gray-800">{startItemNumber}</span> to{" "}
          <span className="font-semibold text-gray-800">{endItemNumber}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> staff members
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Previous Page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p) => {
            if (typeof p === "string" && (p.startsWith("dots") || p === "...")) {
              return (
                <span key={p} className="px-2 text-xs text-gray-400">
                  ...
                </span>
              );
            }
            const pageNum = Number(p);
            const isCurrent = pageNum === currentPage;
            return (
              <button
                type="button"
                key={`page-${pageNum}`}
                onClick={() => onPageChange(pageNum)}
                className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${isCurrent
                  ? "bg-culinary-primary text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          title="Next Page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
