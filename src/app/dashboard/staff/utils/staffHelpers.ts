import axios from "axios";
import { Staff, StaffFormData, StaffKpiStats } from "../types";

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return fallback;
};

export const validatePasswordCriteria = (password: string): string | null => {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  if (!/^[A-Z]/.test(password)) {
    return "Password must start with a Capital letter (A-Z).";
  }
  if (!/[a-z]/.test(password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return "Password must contain lowercase letters and a number or symbol.";
  }
  return null;
};

export const validateStaffForm = (formData: StaffFormData, isEditing: boolean): string | null => {
  const trimmedName = formData.name.trim();
  const trimmedEmail = formData.email.trim();

  if (!trimmedName) {
    return "Please enter staff member's full name.";
  }
  if (!trimmedEmail) {
    return "Please enter a valid email address.";
  }

  if (!isEditing && (!formData.password || formData.password.length < 6)) {
    return "Password must be at least 6 characters long.";
  }

  if (formData.password) {
    return validatePasswordCriteria(formData.password);
  }

  return null;
};

const matchesRoleFilter = (staffRole: string, filter: string): boolean => {
  if (filter === "ALL") return true;
  if (filter === "ADMIN") return staffRole === "SUPER_ADMIN" || staffRole === "OWNER";
  return staffRole === filter;
};

const matchesSearchQuery = (person: Staff, query: string): boolean => {
  if (!query) return true;
  return (
    person.name.toLowerCase().includes(query) ||
    person.email.toLowerCase().includes(query) ||
    Boolean(person.phone?.includes(query)) ||
    person.role.toLowerCase().includes(query)
  );
};

export const filterStaffList = (staff: Staff[], searchTerm: string, roleFilter: string): Staff[] => {
  const query = searchTerm.toLowerCase().trim();
  return staff.filter(
    (person) => matchesRoleFilter(person.role, roleFilter) && matchesSearchQuery(person, query)
  );
};

export const calculateStaffKpis = (staff: Staff[]): StaffKpiStats => {
  let activeStaff = 0;
  let waiters = 0;
  let kitchen = 0;
  let managers = 0;
  let cashiers = 0;

  for (const s of staff) {
    if (s.isActive) activeStaff++;
    if (s.role === "WAITER") waiters++;
    else if (s.role === "KITCHEN") kitchen++;
    else if (s.role === "MANAGER" || s.role === "OWNER") managers++;
    else if (s.role === "CASHIER") cashiers++;
  }

  return {
    totalStaff: staff.length,
    activeStaff,
    waiters,
    kitchen,
    managers,
    cashiers,
  };
};

export const calculateFilterCounts = (staff: Staff[]): Record<string, number> => {
  const counts: Record<string, number> = { ALL: staff.length, WAITER: 0, KITCHEN: 0, MANAGER: 0, CASHIER: 0, ADMIN: 0 };

  for (const s of staff) {
    if (s.role === "WAITER") counts.WAITER++;
    else if (s.role === "KITCHEN") counts.KITCHEN++;
    else if (s.role === "MANAGER") counts.MANAGER++;
    else if (s.role === "CASHIER") counts.CASHIER++;
    else if (s.role === "SUPER_ADMIN" || s.role === "OWNER") counts.ADMIN++;
  }

  return counts;
};

export const generatePageNumbers = (totalPages: number, currentPage: number): (number | string)[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];
  if (currentPage > 3) pages.push("dots-prev");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("dots-next");
  pages.push(totalPages);

  return pages;
};
