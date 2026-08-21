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

export interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  isActive: boolean;
}

export interface StaffKpiStats {
  totalStaff: number;
  activeStaff: number;
  waiters: number;
  kitchen: number;
  managers: number;
  cashiers: number;
}

export type StaffFilterType = "ALL" | "WAITER" | "KITCHEN" | "MANAGER" | "CASHIER" | "ADMIN";

export const ROLES = ["SUPER_ADMIN", "OWNER", "MANAGER", "WAITER", "KITCHEN", "CASHIER"] as const;

export const ROLE_FILTERS = [
  { label: "All Staff", value: "ALL" },
  { label: "Waiters", value: "WAITER" },
  { label: "Kitchen", value: "KITCHEN" },
  { label: "Managers", value: "MANAGER" },
  { label: "Cashiers", value: "CASHIER" },
  { label: "Owners / Admins", value: "ADMIN" },
] as const;
