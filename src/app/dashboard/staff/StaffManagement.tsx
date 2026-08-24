"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Users, Armchair, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from "@/components/ui/select";

import { WaiterPerformanceSection } from "@/components/dashboard/waiters/WaiterPerformanceSection";
import { Staff, StaffFormData } from "./types";
import {
  calculateStaffKpis,
  calculateFilterCounts,
  filterStaffList,
  validateStaffForm,
  getApiErrorMessage,
} from "./utils/staffHelpers";
import { StaffKpiCards } from "./components/StaffKpiCards";
import { StaffControlBar } from "./components/StaffControlBar";
import { StaffCardView } from "./components/StaffCardView";
import { StaffTableView } from "./components/StaffTableView";
import { StaffPagination } from "./components/StaffPagination";
import { StaffEmptyState } from "./components/StaffEmptyState";
import { StaffFormSheet } from "./components/StaffFormSheet";
import { StaffDetailsSheet } from "./components/StaffDetailsSheet";
import { StaffDeleteDialog } from "./components/StaffDeleteDialog";

export { type Staff } from "./types";

const INITIAL_FORM_DATA: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "WAITER",
  isActive: true,
};

function getDietaryBadge(dietaryCategory?: string): string {
  if (dietaryCategory === "PURE_VEG") return "🌱 Pure Veg";
  if (dietaryCategory === "PURE_NON_VEG") return "🍗 Pure Non-Veg";
  return "🥗🍗 Multi-Cuisine";
}

export function StaffManagement() {
  const searchParams = useSearchParams();
  const initialRestId = searchParams.get("restaurantId") || "all";

  const [activeTab, setActiveTab] = useState<"roster" | "waiters_monitor">("roster");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [restaurants, setRestaurants] = useState<Array<{ id: string; name: string; dietaryCategory?: string }>>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(initialRestId);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // View Mode: Cards vs Table
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form State
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = useCallback(async (showIndicator = false, restId = selectedRestaurant) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const url = restId && restId !== "all" ? `/api/staff?restaurantId=${restId}` : "/api/staff";
      const [staffRes, superAdminRes] = await Promise.all([
        axios.get(url),
        axios.get("/api/super-admin/restaurants").catch(() => null),
      ]);
      if (staffRes.data?.data) {
        if (Array.isArray(staffRes.data.data)) {
          setStaff(staffRes.data.data);
        } else if (staffRes.data.data.staff) {
          setStaff(staffRes.data.data.staff);
        }
      }
      if (superAdminRes?.data?.success && Array.isArray(superAdminRes.data.data)) {
        setIsSuperAdmin(true);
        setRestaurants(superAdminRes.data.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, [selectedRestaurant]);

  useEffect(() => {
    let ignore = false;

    const loadStaff = async () => {
      try {
        const url = selectedRestaurant && selectedRestaurant !== "all"
          ? `/api/staff?restaurantId=${selectedRestaurant}`
          : "/api/staff";
        const [staffRes, superAdminRes] = await Promise.all([
          axios.get(url),
          axios.get("/api/super-admin/restaurants").catch(() => null),
        ]);
        if (!ignore) {
          if (staffRes.data?.data) {
            if (Array.isArray(staffRes.data.data)) {
              setStaff(staffRes.data.data);
            } else if (staffRes.data.data.staff) {
              setStaff(staffRes.data.data.staff);
            }
          }
          if (superAdminRes?.data?.success && Array.isArray(superAdminRes.data.data)) {
            setIsSuperAdmin(true);
            setRestaurants(superAdminRes.data.data);
          }
        }
      } catch (error: unknown) {
        if (!ignore) {
          console.error("Failed to fetch staff:", error);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadStaff();

    return () => {
      ignore = true;
    };
  }, [selectedRestaurant]);

  const handleOpenForm = (staffMember?: Staff) => {
    if (staffMember) {
      setSelectedStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone || "",
        password: "",
        role: staffMember.role,
        isActive: staffMember.isActive,
      });
    } else {
      setSelectedStaff(null);
      setFormData(INITIAL_FORM_DATA);
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    const isEditing = Boolean(selectedStaff);
    const validationError = validateStaffForm(formData, isEditing);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const trimmedName = formData.name.trim();
    const payloadData = {
      name: trimmedName,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim() || null,
      role: formData.role,
      isActive: formData.isActive,
      ...(formData.password ? { password: formData.password } : {}),
    };

    setIsSubmitting(true);
    try {
      if (selectedStaff) {
        await axios.put(`/api/staff/${selectedStaff.id}`, payloadData);
        toast.success(`Staff member "${trimmedName}" updated successfully!`);
      } else {
        await axios.post("/api/staff", payloadData);
        toast.success(`New staff member "${trimmedName}" registered successfully! 🎉`);
      }
      setIsFormOpen(false);
      await fetchStaff();
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error, "Failed to save staff details.");
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    try {
      await axios.patch(`/api/staff/${id}`, { isActive: nextStatus });
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: nextStatus } : s)));
      if (selectedStaff?.id === id) {
        setSelectedStaff((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
      }
      toast.success(`Staff account ${nextStatus ? "activated" : "deactivated"}`);
    } catch (error: unknown) {
      console.error("Error updating staff status:", error);
      toast.error("Failed to update active status.");
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/staff/${selectedStaff.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedStaff(null);
      await fetchStaff();
      toast.success("Staff member deleted successfully");
    } catch (error: unknown) {
      const errorMsg = getApiErrorMessage(error, "Failed to delete staff member.");
      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setCurrentPage(1);
  };

  // Aggregated data
  const kpiStats = useMemo(() => calculateStaffKpis(staff), [staff]);
  const filterCounts = useMemo(() => calculateFilterCounts(staff), [staff]);
  const filteredStaff = useMemo(
    () => filterStaffList(staff, searchTerm, roleFilter),
    [staff, roleFilter, searchTerm]
  );

  // Pagination calculation
  const totalItems = filteredStaff.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStaff = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, safeCurrentPage, pageSize]);

  const startItemNumber = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItemNumber = Math.min(safeCurrentPage * pageSize, totalItems);

  const handleViewDetails = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsDetailsOpen(true);
  };

  const handleDeleteStaffClick = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsDeleteDialogOpen(true);
  };

  const renderStaffContent = () => {
    if (paginatedStaff.length === 0) {
      return (
        <StaffEmptyState
          isFiltered={Boolean(searchTerm || roleFilter !== "ALL")}
          onResetFilters={handleResetFilters}
        />
      );
    }

    if (viewMode === "cards") {
      return (
        <StaffCardView
          staff={paginatedStaff}
          onToggleStatus={handleToggleStatus}
          onViewDetails={handleViewDetails}
          onEditStaff={handleOpenForm}
          onDeleteStaff={handleDeleteStaffClick}
        />
      );
    }

    return (
      <StaffTableView
        staff={paginatedStaff}
        onToggleStatus={handleToggleStatus}
        onViewDetails={handleViewDetails}
        onEditStaff={handleOpenForm}
        onDeleteStaff={handleDeleteStaffClick}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm text-gray-500 font-medium">Loading staff roster...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Scope Bar for Super Admin */}
      {isSuperAdmin && restaurants.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Restaurant Scope:</span>
            <Select
              value={selectedRestaurant}
              onValueChange={(val) => {
                setSelectedRestaurant(val ?? "all");
              }}
            >
              <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-amber-50/70 hover:bg-amber-50 h-9.5 w-full sm:w-80 shadow-2xs font-semibold text-gray-900 border-amber-200/80 transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <Building2 size={15} className="text-culinary-primary shrink-0" />
                  <span className="truncate">
                    {selectedRestaurant === "all"
                      ? "🏢 All Restaurants (Platform Staff)"
                      : restaurants.find((r) => r.id === selectedRestaurant)?.name || "Select Restaurant"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl text-xs w-[360px] min-w-[360px] max-h-72 overflow-y-auto p-1.5 shadow-xl border-gray-100 z-50">
                <SelectItem value="all" className="font-bold text-gray-900 py-2.5 px-3 rounded-xl cursor-pointer">
                  🏢 All Restaurants (Platform Staff)
                </SelectItem>
                {restaurants.map((rest) => (
                  <SelectItem key={rest.id} value={rest.id} className="text-xs py-2.5 px-3 rounded-xl cursor-pointer">
                    <div className="flex items-center justify-between w-full gap-3 pr-3">
                      <span className="font-semibold text-gray-800 truncate">{rest.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80 text-stone-700 font-medium shrink-0">
                        {getDietaryBadge(rest.dietaryCategory)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredStaff.length} team members across {selectedRestaurant === "all" ? "all restaurants" : "selected restaurant"}
          </span>
        </div>
      )}

      {/* Top Section Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80 max-w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("roster")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "roster" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
        >
          <Users size={15} className={activeTab === "roster" ? "text-culinary-primary" : ""} />
          <span>Staff Team Directory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("waiters_monitor")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "waiters_monitor"
            ? "bg-white text-gray-900 shadow-xs"
            : "text-gray-600 hover:text-gray-900"
            }`}
        >
          <Armchair size={15} className={activeTab === "waiters_monitor" ? "text-amber-600" : ""} />
          <span>Waitstaff Live Table Tracker</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {activeTab === "waiters_monitor" ? (
        <WaiterPerformanceSection restaurantId={selectedRestaurant} />
      ) : (
        <>
          <StaffKpiCards stats={kpiStats} />

          <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
            <StaffControlBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isRefreshing={isRefreshing}
              onRefresh={() => fetchStaff(true)}
              onAddStaff={() => handleOpenForm()}
              roleFilter={roleFilter}
              onRoleFilterChange={handleRoleFilterChange}
              filterCounts={filterCounts}
            />

            {renderStaffContent()}

            <StaffPagination
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              startItemNumber={startItemNumber}
              endItemNumber={endItemNumber}
              totalItems={totalItems}
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>

          <StaffFormSheet
            isOpen={isFormOpen}
            onOpenChange={setIsFormOpen}
            selectedStaff={selectedStaff}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSave}
            isSubmitting={isSubmitting}
          />

          <StaffDetailsSheet
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            staff={selectedStaff}
            onEditStaff={handleOpenForm}
          />

          <StaffDeleteDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            staff={selectedStaff}
            onConfirmDelete={handleDelete}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </div>
  );
}
