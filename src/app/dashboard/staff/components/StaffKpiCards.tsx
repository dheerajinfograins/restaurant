"use client";

import { Users, UserCheck, Utensils, ChefHat, Shield } from "lucide-react";
import { StaffKpiStats } from "../types";

interface StaffKpiCardsProps {
  stats: StaffKpiStats;
}

export function StaffKpiCards({ stats }: Readonly<StaffKpiCardsProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Staff */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Staff</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalStaff}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <UserCheck size={12} /> {stats.activeStaff} Active on Duty
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
          <p className="text-3xl font-bold text-sky-700">{stats.waiters}</p>
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
          <p className="text-3xl font-bold text-orange-700">{stats.kitchen}</p>
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
          <p className="text-3xl font-bold text-purple-700">{stats.managers + stats.cashiers}</p>
          <p className="text-[11px] text-gray-400 font-medium">
            {stats.managers} Managers · {stats.cashiers} Cashiers
          </p>
        </div>
        <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
          <Shield size={24} />
        </div>
      </div>
    </div>
  );
}
