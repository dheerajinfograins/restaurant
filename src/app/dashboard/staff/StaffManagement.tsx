"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  Mail, 
  Shield, 
  ChefHat, 
  Users, 
  ShoppingBag, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Filter,
  CheckCircle2,
  Calendar,
  Utensils,
  CreditCard,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

const ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "KITCHEN", "CASHIER"] as const;

const ROLE_FILTERS = [
  { label: "All Staff", value: "ALL" },
  { label: "Waiters", value: "WAITER" },
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Managers", value: "MANAGER" },
  { label: "Cashiers", value: "CASHIER" },
  { label: "Owners / Admins", value: "ADMIN" },
] as const;

export function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([]);
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
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "WAITER",
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStaff = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const response = await axios.get("/api/staff");
      if (response.data?.data) {
        setStaff(response.data.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch staff:", error);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
  }, []);

  const handleOpenForm = (staffMember?: Staff) => {
    if (staffMember) {
      setSelectedStaff(staffMember);
      setFormData({
        name: staffMember.name,
        email: staffMember.email,
        phone: staffMember.phone || "",
        password: "", // Leave blank to keep existing password
        role: staffMember.role,
        isActive: staffMember.isActive,
      });
    } else {
      setSelectedStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "WAITER",
        isActive: true,
      });
    }
    setShowPassword(false);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      alert("Name, Email, and Role are required.");
      return;
    }
    if (!selectedStaff && !formData.password) {
      alert("Password is required for new staff.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedStaff) {
        await axios.put(`/api/staff/${selectedStaff.id}`, formData);
      } else {
        await axios.post("/api/staff", formData);
      }
      setIsFormOpen(false);
      await fetchStaff();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to save staff details.");
      } else {
        alert("An error occurred while saving staff details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/staff/${id}`, { isActive: !currentStatus });
      setStaff((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !currentStatus } : s))
      );
      if (selectedStaff?.id === id) {
        setSelectedStaff((prev) => (prev ? { ...prev, isActive: !currentStatus } : null));
      }
    } catch (error: unknown) {
      console.error("Error updating staff status:", error);
      alert("Failed to update active status.");
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Failed to delete staff member.");
      } else {
        alert("Failed to delete staff member.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPI calculations
  const kpiStats = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.isActive).length;
    const waiters = staff.filter((s) => s.role === "WAITER").length;
    const kitchen = staff.filter((s) => s.role === "KITCHEN").length;
    const managers = staff.filter((s) => s.role === "MANAGER" || s.role === "OWNER").length;
    const cashiers = staff.filter((s) => s.role === "CASHIER").length;

    return {
      totalStaff,
      activeStaff,
      waiters,
      kitchen,
      managers,
      cashiers,
    };
  }, [staff]);

  // Filter Counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: staff.length };
    staff.forEach((s) => {
      if (s.role === "WAITER") counts["WAITER"] = (counts["WAITER"] || 0) + 1;
      else if (s.role === "KITCHEN") counts["KITCHEN"] = (counts["KITCHEN"] || 0) + 1;
      else if (s.role === "MANAGER") counts["MANAGER"] = (counts["MANAGER"] || 0) + 1;
      else if (s.role === "CASHIER") counts["CASHIER"] = (counts["CASHIER"] || 0) + 1;
      else if (s.role === "SUPER_ADMIN" || s.role === "OWNER") counts["ADMIN"] = (counts["ADMIN"] || 0) + 1;
    });
    return counts;
  }, [staff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return staff.filter((s) => {
      let matchesRole = true;
      if (roleFilter === "WAITER") matchesRole = s.role === "WAITER";
      else if (roleFilter === "KITCHEN") matchesRole = s.role === "KITCHEN";
      else if (roleFilter === "MANAGER") matchesRole = s.role === "MANAGER";
      else if (roleFilter === "CASHIER") matchesRole = s.role === "CASHIER";
      else if (roleFilter === "ADMIN") matchesRole = s.role === "SUPER_ADMIN" || s.role === "OWNER";

      if (!matchesRole) return false;

      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        s.role.toLowerCase().includes(q)
      );
    });
  }, [staff, roleFilter, searchTerm]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchTerm, pageSize]);

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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-[11px] font-semibold">Super Admin</Badge>;
      case "OWNER":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-semibold">Owner</Badge>;
      case "MANAGER":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold">Manager</Badge>;
      case "WAITER":
        return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[11px] font-semibold">Waiter</Badge>;
      case "KITCHEN":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[11px] font-semibold">Kitchen Staff</Badge>;
      case "CASHIER":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold">Cashier</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{role}</Badge>;
    }
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
      
      {/* Top 4 Staff Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-3xl font-bold text-gray-900">{kpiStats.totalStaff}</p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <UserCheck size={12} /> {kpiStats.activeStaff} Active on Duty
            </p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Users size={24} />
          </div>
        </div>

        {/* Waitstaff */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Waitstaff</p>
            <p className="text-3xl font-bold text-sky-700">{kpiStats.waiters}</p>
            <p className="text-[11px] text-gray-400 font-medium">Table service & taking orders</p>
          </div>
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <Utensils size={24} />
          </div>
        </div>

        {/* Kitchen Team */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kitchen Team</p>
            <p className="text-3xl font-bold text-orange-700">{kpiStats.kitchen}</p>
            <p className="text-[11px] text-gray-400 font-medium">Chefs, cooks & food prep</p>
          </div>
          <div className="p-3.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
            <ChefHat size={24} />
          </div>
        </div>

        {/* Managers & Cashiers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Management & POS</p>
            <p className="text-3xl font-bold text-purple-700">{kpiStats.managers + kpiStats.cashiers}</p>
            <p className="text-[11px] text-gray-400 font-medium">{kpiStats.managers} Managers · {kpiStats.cashiers} Cashiers</p>
          </div>
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Shield size={24} />
          </div>
        </div>
      </div>

      {/* Main Staff Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-culinary-border/40 overflow-hidden">
        
        {/* Top Control Bar: Search, Add Staff, View Switcher & Role Filter */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search staff by name, email, phone, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-culinary-primary/20 focus:border-culinary-primary transition-all placeholder:text-gray-400 text-gray-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
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
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === "cards"
                      ? "bg-white text-culinary-primary shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LayoutGrid size={14} />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === "table"
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
                onClick={() => fetchStaff(true)}
                disabled={isRefreshing}
                className="text-xs h-9 gap-1.5 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-none"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-culinary-primary" : ""}`} />
                Refresh
              </Button>

              {/* Add Staff Button */}
              <Button
                size="sm"
                onClick={() => handleOpenForm()}
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
                <button
                  key={filter.value}
                  onClick={() => setRoleFilter(filter.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-culinary-primary text-white shadow-sm font-semibold"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/70"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Section: Cards Grid View OR Table List View */}
        {paginatedStaff.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="p-4 bg-gray-50 rounded-2xl mb-3 border border-gray-100">
              <Users className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {searchTerm || roleFilter !== "ALL"
                ? "No staff members match your search criteria"
                : "No staff members registered"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              {searchTerm || roleFilter !== "ALL"
                ? "Try clearing your search term or selecting a different role filter."
                : "Add waiters, kitchen staff, and managers to manage your restaurant operations."}
            </p>
            {(searchTerm || roleFilter !== "ALL") && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs rounded-xl"
                onClick={() => {
                  setSearchTerm("");
                  setRoleFilter("ALL");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : viewMode === "cards" ? (
          /* ===================== CARDS GRID VIEW ===================== */
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedStaff.map((person) => {
                const initial = person.name ? person.name.charAt(0).toUpperCase() : "S";
                return (
                  <div
                    key={person.id}
                    className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Avatar, Name & Role Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-culinary-primary font-bold text-lg flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-gray-900 truncate" title={person.name}>
                              {person.name}
                            </h3>
                            <div className="mt-1">{getRoleBadge(person.role)}</div>
                          </div>
                        </div>

                        {/* Status Switch */}
                        {person.role !== "SUPER_ADMIN" ? (
                          <div className="flex flex-col items-end gap-1">
                            <Switch
                              checked={person.isActive}
                              onCheckedChange={() => handleToggleStatus(person.id, person.isActive)}
                            />
                            <span className={`text-[10px] font-bold ${person.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {person.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Contact Info Pills */}
                      <div className="space-y-2 mb-4 text-xs text-gray-600">
                        <div className="flex items-center gap-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100 truncate">
                          <Mail size={13} className="text-gray-400 shrink-0" />
                          <span className="truncate" title={person.email}>{person.email}</span>
                        </div>
                        {person.phone && (
                          <div className="flex items-center gap-2 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                            <Phone size={13} className="text-gray-400 shrink-0" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats & Meta */}
                      <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/60 text-center">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Orders Handled</span>
                          <span className="font-bold text-sm text-culinary-primary">
                            {person._count?.orders || 0}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Joined On</span>
                          <span className="font-semibold text-xs text-gray-700">
                            {format(new Date(person.createdAt), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStaff(person);
                          setIsDetailsOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      >
                        <Eye size={13} className="mr-1 text-blue-600" /> Details
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(person)}
                          className="h-8 px-2.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                        >
                          <Edit3 size={13} className="mr-1" /> Edit
                        </Button>

                        {person.role !== "SUPER_ADMIN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedStaff(person);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ===================== TABLE LIST VIEW ===================== */
          <div className="overflow-x-auto">
            <Table className="w-full text-left">
              <TableHeader className="bg-gray-50/70 border-b border-gray-200/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pl-6">
                    Staff Member
                  </TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
                    Role
                  </TableHead>
                  <TableHead className="w-[180px] whitespace-nowrap font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
                    Contact Info
                  </TableHead>
                  <TableHead className="w-[110px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
                    Orders
                  </TableHead>
                  <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 text-center">
                    Active Status
                  </TableHead>
                  <TableHead className="w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5">
                    Joined Date
                  </TableHead>
                  <TableHead className="text-right w-[130px] font-bold text-xs uppercase tracking-wider text-gray-600 py-3.5 pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100">
                {paginatedStaff.map((person) => {
                  const initial = person.name ? person.name.charAt(0).toUpperCase() : "S";
                  return (
                    <TableRow key={person.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Staff Member */}
                      <TableCell className="align-middle py-3.5 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-culinary-primary font-bold text-sm flex items-center justify-center border border-amber-200/60 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-gray-900">{person.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {person.id.slice(-6)}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell className="align-middle py-3.5">
                        {getRoleBadge(person.role)}
                      </TableCell>

                      {/* Contact */}
                      <TableCell className="align-middle py-3.5">
                        <div className="text-xs text-gray-800 font-medium truncate max-w-[170px]" title={person.email}>
                          {person.email}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {person.phone || "No phone"}
                        </div>
                      </TableCell>

                      {/* Orders */}
                      <TableCell className="align-middle py-3.5 text-center">
                        <span className="font-bold text-xs text-culinary-primary bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                          {person._count?.orders || 0}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-middle py-3.5 text-center">
                        {person.role !== "SUPER_ADMIN" ? (
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={person.isActive}
                              onCheckedChange={() => handleToggleStatus(person.id, person.isActive)}
                            />
                            <span className={`text-[11px] font-bold ${person.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {person.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Active
                          </span>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="align-middle py-3.5 text-xs text-gray-600">
                        {format(new Date(person.createdAt), "MMM d, yyyy")}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right align-middle py-3.5 pr-6">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Staff Profile"
                            onClick={() => {
                              setSelectedStaff(person);
                              setIsDetailsOpen(true);
                            }}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Staff"
                            onClick={() => handleOpenForm(person)}
                            className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                          >
                            <Edit3 size={14} />
                          </Button>
                          {person.role !== "SUPER_ADMIN" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete Staff"
                              onClick={() => {
                                setSelectedStaff(person);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Integrated Pagination Footer */}
        {filteredStaff.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
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
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage === 1}
                title="First Page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                title="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1 mx-1">
                {getPageNumbers().map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`dots-${idx}`} className="px-2 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === safeCurrentPage;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all ${
                        isCurrent
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                title="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 p-0 rounded-lg border-gray-200 bg-white"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage === totalPages}
                title="Last Page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Staff Side Drawer (Opens on Right Side) */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[500px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
          <div className="p-6">
            <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-culinary-primary font-bold text-lg flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold font-cormorant text-gray-900">
                    {selectedStaff ? "Edit Staff Member" : "Register New Staff"}
                  </SheetTitle>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selectedStaff
                      ? `Update account details & role permissions for ${selectedStaff.name}`
                      : "Create login credentials and assign duties for a new employee"}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Full Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl border-gray-200 text-xs py-3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Mobile Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="rounded-xl border-gray-200 text-xs py-3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Email Address (Login ID) *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@restaurant.com"
                  className="rounded-xl border-gray-200 text-xs py-3"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Assigned Role *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v || "WAITER" })}>
                  <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white py-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl text-xs">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs font-medium">
                        {r.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 relative">
                <Label className="text-xs font-bold text-gray-700">
                  Password {selectedStaff && <span className="text-[10px] text-gray-400 font-normal">(Leave blank to keep existing)</span>}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="rounded-xl border-gray-200 text-xs pr-10 py-3"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-xl border border-gray-100 mt-2">
                <div>
                  <p className="font-bold text-xs text-gray-800">Account Active Status</p>
                  <p className="text-[10px] text-gray-500">Allow employee to log in and access system</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                />
              </div>
            </div>

            <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="w-full text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs py-2.5"
              >
                {isSubmitting ? "Saving..." : selectedStaff ? "Update Staff" : "Create Staff Member"}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 font-cormorant">Delete Staff Member</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-xs text-gray-600">
            Are you sure you want to delete <b className="text-gray-900">{selectedStaff?.name}</b>? They will lose all access to the system.
          </p>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Profile Details Drawer */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[460px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
          <div className="p-6">
            <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
              <SheetTitle className="text-2xl font-bold text-gray-900 font-cormorant">
                Staff Profile
              </SheetTitle>
            </SheetHeader>

            {selectedStaff && (
              <div className="space-y-6">
                {/* Hero Header */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/60 to-gray-50/40 rounded-2xl border border-amber-100/80 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-culinary-primary text-white font-bold text-3xl flex items-center justify-center shadow-md mb-3">
                    {selectedStaff.name ? selectedStaff.name.charAt(0).toUpperCase() : "S"}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h2>
                  <div className="mt-1.5">{getRoleBadge(selectedStaff.role)}</div>
                </div>

                {/* Contact & Status Details */}
                <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Email</span>
                    <span className="font-semibold text-gray-900">{selectedStaff.email}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Mobile Phone</span>
                    <span className="font-semibold text-gray-900">{selectedStaff.phone || "Not provided"}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Account Status</span>
                    <span className={`font-bold flex items-center gap-1 ${selectedStaff.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {selectedStaff.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {selectedStaff.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Joined Date</span>
                    <span className="font-semibold text-gray-900">
                      {format(new Date(selectedStaff.createdAt), "MMMM d, yyyy")}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 font-medium">Total Orders Handled</span>
                    <span className="font-bold text-sm text-culinary-primary">
                      {selectedStaff._count?.orders || 0} orders
                    </span>
                  </div>
                </div>
              </div>
            )}

            <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs rounded-xl"
                onClick={() => setIsDetailsOpen(false)}
              >
                Close Profile
              </Button>
              <Button
                type="button"
                className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white text-xs font-bold rounded-xl"
                onClick={() => {
                  setIsDetailsOpen(false);
                  if (selectedStaff) handleOpenForm(selectedStaff);
                }}
              >
                Edit Staff Details
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
