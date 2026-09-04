"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";
import {
  Users,
  Search,
  RotateCw,
  Phone,
  Mail,
  Armchair,
  IndianRupee,
  Clock,
  ChevronRight,
  History,
  UserCheck,
  TrendingUp,
  PhoneCall,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { toast } from "react-hot-toast";
import { useSocket } from "@/components/providers/socket-provider";
import { WaiterHistoryModal } from "@/components/waiter/WaiterHistoryModal";
import { AdminWaiterAckModal, WaiterAckData } from "./AdminWaiterAckModal";
import Image from "next/image";

export interface WaiterRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  tableNumber: string;
  totalAmount: number;
  status: string;
  servedAt: string;
  itemsCount: number;
  items: Array<{
    name: string;
    quantity: number;
    totalPrice: number;
  }>;
}

export interface WaiterPerformance {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  isActive: boolean;
  isOnline: boolean;
  lastActiveAt: string;
  tablesServedToday: number;
  tablesServedTotal: number;
  activeOrdersCount: number;
  activeTableNumbers: string[];
  revenueToday: number;
  revenueAllTime: number;
  recentServedOrders: WaiterRecentOrder[];
}

export interface WaiterSummary {
  totalWaiters: number;
  onlineWaiters: number;
  totalServedToday: number;
  totalRevenueToday: number;
}

export type WaiterFilterStatus = "ALL" | "ONLINE" | "ACTIVE_NOW";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function matchesWaiterFilter(
  waiter: WaiterPerformance,
  search: string,
  filter: WaiterFilterStatus
): boolean {
  const query = search.trim().toLowerCase();
  if (query) {
    const matchesSearch =
      waiter.name.toLowerCase().includes(query) ||
      waiter.email.toLowerCase().includes(query) ||
      Boolean(waiter.phone?.includes(query));
    if (!matchesSearch) return false;
  }

  if (filter === "ONLINE") {
    return waiter.isOnline;
  }
  if (filter === "ACTIVE_NOW") {
    return waiter.activeOrdersCount > 0 || waiter.tablesServedToday > 0;
  }
  return true;
}

interface WaiterOverviewCardsProps {
  readonly summary: WaiterSummary;
}

function WaiterOverviewCards({ summary }: Readonly<WaiterOverviewCardsProps>) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Waitstaff */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-gray-300 transition-all">
        <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
          <Users size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Waitstaff
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-gray-900">{summary.totalWaiters}</span>
            <span className="text-xs font-medium text-gray-500">Registered</span>
          </div>
        </div>
      </div>

      {/* Online / Active on Shift */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-emerald-300 transition-all">
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 relative">
          <UserCheck size={24} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Online Waiters
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-emerald-600">
              {summary.onlineWaiters}
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Active on Shift
            </span>
          </div>
        </div>
      </div>

      {/* Tables Served Today */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-blue-300 transition-all">
        <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
          <Armchair size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tables Served Today
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-blue-600">
              {summary.totalServedToday}
            </span>
            <span className="text-xs font-medium text-gray-500">Dining Tables</span>
          </div>
        </div>
      </div>

      {/* Today's Served Sales */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-4 hover:border-purple-300 transition-all">
        <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
          <IndianRupee size={24} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Today&apos;s Served Sales
          </p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold text-purple-700">
              ₹{summary.totalRevenueToday.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WaiterFilterToolbarProps {
  readonly searchTerm: string;
  readonly setSearchTerm: (val: string) => void;
  readonly statusFilter: WaiterFilterStatus;
  readonly setStatusFilter: (val: WaiterFilterStatus) => void;
  readonly totalWaitersCount: number;
  readonly onlineWaitersCount: number;
  readonly activeWaitersCount: number;
  readonly isRefreshing: boolean;
  readonly onRefresh: () => void;
}

function WaiterFilterToolbar({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  totalWaitersCount,
  onlineWaitersCount,
  activeWaitersCount,
  isRefreshing,
  onRefresh,
}: Readonly<WaiterFilterToolbarProps>) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder="Search waiter by name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50/70 border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === "ALL"
              ? "bg-white text-gray-900 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            All ({totalWaitersCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ONLINE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${statusFilter === "ONLINE"
              ? "bg-white text-emerald-700 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Online ({onlineWaitersCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ACTIVE_NOW")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === "ACTIVE_NOW"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            On Duty ({activeWaitersCount})
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded-xl border-gray-200 text-xs font-semibold gap-2"
        >
          <RotateCw size={14} className={isRefreshing ? "animate-spin text-culinary-primary" : ""} />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}

interface WaiterCardProps {
  readonly waiter: WaiterPerformance;
  readonly onOpen: (waiter: WaiterPerformance) => void;
  readonly onCall: (id: string, name: string) => void;
  readonly isCalling: boolean;
}

function WaiterCard({ waiter, onOpen, onCall, isCalling }: Readonly<WaiterCardProps>) {
  const initials = getInitials(waiter.name);

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-culinary-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
    >
      {/* Status indicator bar */}
      <div
        className={`h-1.5 w-full ${waiter.isOnline
          ? "bg-gradient-to-r from-emerald-400 to-teal-500"
          : "bg-gray-200"
          }`}
      />

      <div className="p-5 space-y-4">
        {/* Waiter Card Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {waiter.image ? (
                <Image
                  src={waiter.image}
                  alt={waiter.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold font-cormorant text-lg flex items-center justify-center shadow-xs">
                  {initials}
                </div>
              )}
              {waiter.isOnline ? (
                <span
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
                  title="Online Now"
                >
                  <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                </span>
              ) : (
                <span
                  className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-gray-400 border-2 border-white rounded-full"
                  title="Offline"
                ></span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base group-hover:text-culinary-primary transition-colors font-cormorant leading-tight">
                  {waiter.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                <Phone size={11} className="text-gray-400" />
                {waiter.phone || "No phone linked"}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${waiter.isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
          >
            {waiter.isOnline ? "🟢 On Shift" : "⚪ Offline"}
          </Badge>
        </div>

        {/* Key Service Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Shift Today */}
          <div className="bg-amber-50/60 border border-amber-200/70 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-amber-600" /> Today Shift
              </span>
              <span className="font-bold text-amber-900">{waiter.tablesServedToday} tbl</span>
            </div>
            <p className="text-lg font-extrabold text-amber-950 mt-1">
              ₹{waiter.revenueToday.toLocaleString("en-IN")}
            </p>
          </div>

          {/* All-Time Lifetime */}
          <div className="bg-emerald-50/60 border border-emerald-200/70 p-3 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <TrendingUp size={11} className="text-emerald-600" /> All-Time Total
              </span>
              <span className="font-bold text-emerald-900">{waiter.tablesServedTotal} tbl</span>
            </div>
            <p className="text-lg font-extrabold text-emerald-950 mt-1">
              ₹{waiter.revenueAllTime.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Latest Served Table Chip */}
        {waiter.recentServedOrders.length > 0 && (
          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-amber-900 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded text-[10px] shrink-0">
                Table {waiter.recentServedOrders[0].tableNumber}
              </span>
              <span className="text-[11px] text-gray-500 truncate">
                Last: #{waiter.recentServedOrders[0].orderNumber}
              </span>
            </div>
            <span className="font-bold text-xs text-gray-900 shrink-0">
              ₹{waiter.recentServedOrders[0].totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Currently Active Floor Tables */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span className="font-semibold text-gray-600 flex items-center gap-1">
              <Flame size={13} className="text-orange-500" /> Active Tables Serving
            </span>
            <span className="text-[11px] font-bold text-gray-700">
              {waiter.activeTableNumbers.length > 0
                ? `${waiter.activeTableNumbers.length} Tables`
                : "None"}
            </span>
          </div>

          {waiter.activeTableNumbers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {waiter.activeTableNumbers.map((tableNum) => (
                <span
                  key={tableNum}
                  className="bg-orange-50 text-orange-800 border border-orange-200 font-bold px-2 py-0.5 rounded-lg text-xs flex items-center gap-1"
                >
                  <Armchair size={11} /> Table {tableNum}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">
              No active tables in service right now
            </p>
          )}
        </div>
      </div>

      {/* Card Footer Button */}
      <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between group-hover:bg-culinary-primary/5 transition-colors">
        <div className="text-[11px] text-gray-500 flex items-center gap-1">
          <Clock size={12} className="text-gray-400" />
          <span>
            {waiter.lastActiveAt
              ? `Active ${formatDistanceToNow(new Date(waiter.lastActiveAt), { addSuffix: true })}`
              : "No recent shifts"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onCall(waiter.id, waiter.name)}
            disabled={isCalling}
            className="relative z-10 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
          >
            <PhoneCall size={11} className={isCalling ? "animate-spin" : ""} />
            <span>{isCalling ? "Calling..." : "Call"}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpen(waiter)}
            aria-label={`View performance details for ${waiter.name}`}
            className="text-xs font-bold text-culinary-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-culinary-primary/50 rounded-md cursor-pointer after:absolute after:inset-0 after:content-[''] after:cursor-pointer"
          >
            <span>Full Details</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface WaiterListViewProps {
  readonly isLoading: boolean;
  readonly filteredWaiters: WaiterPerformance[];
  readonly searchTerm: string;
  readonly onOpenWaiter: (waiter: WaiterPerformance) => void;
  readonly onCallWaiter: (id: string, name: string) => void;
  readonly callingWaiterId: string | null;
}

function WaiterListView({
  isLoading,
  filteredWaiters,
  searchTerm,
  onOpenWaiter,
  onCallWaiter,
  callingWaiterId,
}: Readonly<WaiterListViewProps>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 bg-white rounded-3xl border border-gray-100 shadow-xs">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-culinary-primary border-t-transparent"></div>
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading waitstaff service metrics...
        </p>
      </div>
    );
  }

  if (filteredWaiters.length === 0) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
          <Users size={28} />
        </div>
        <h3 className="text-base font-bold text-gray-900 font-cormorant">No Waitstaff Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          {searchTerm
            ? `No waitstaff members match "${searchTerm}".`
            : "No waiters are registered in your restaurant roster yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {filteredWaiters.map((waiter) => (
        <WaiterCard
          key={waiter.id}
          waiter={waiter}
          onOpen={onOpenWaiter}
          onCall={onCallWaiter}
          isCalling={callingWaiterId === waiter.id}
        />
      ))}
    </div>
  );
}

interface WaiterDetailsDrawerProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly waiter: WaiterPerformance | null;
  readonly isCalling: boolean;
  readonly onCall: (id: string, name: string) => void;
  readonly onOpenHistory: (id: string, name: string) => void;
}

function WaiterDetailsDrawer({
  isOpen,
  onOpenChange,
  waiter,
  isCalling,
  onCall,
  onOpenHistory,
}: Readonly<WaiterDetailsDrawerProps>) {
  if (!waiter) return null;

  const initials = getInitials(waiter.name);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 font-sans">
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {waiter.image ? (
                    <Image
                      src={waiter.image}
                      alt={waiter.name}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold font-cormorant text-2xl flex items-center justify-center border-2 border-white/20 shadow-md">
                      {initials}
                    </div>
                  )}
                  {waiter.isOnline && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-gray-900 rounded-full"></span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold font-cormorant text-white">
                      {waiter.name}
                    </h2>
                    <Badge
                      className={`text-[10px] font-bold ${waiter.isOnline
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                        : "bg-gray-700 text-gray-300 border-gray-600"
                        }`}
                    >
                      {waiter.isOnline ? "🟢 Online" : "⚪ Offline"}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-300 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {waiter.phone || "No phone"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-gray-400" />
                      {waiter.email}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick KPI Strip inside header */}
            <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-white/10 text-center">
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Today Served</p>
                <p className="text-base font-bold text-amber-300 mt-0.5">
                  {waiter.tablesServedToday} <span className="text-[10px] font-normal">Tables</span>
                </p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Active Now</p>
                <p className="text-base font-bold text-emerald-300 mt-0.5">
                  {waiter.activeOrdersCount} <span className="text-[10px] font-normal">Orders</span>
                </p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Today Sales</p>
                <p className="text-base font-bold text-purple-300 mt-0.5">
                  ₹{waiter.revenueToday.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">All Time</p>
                <p className="text-base font-bold text-blue-300 mt-0.5">
                  {waiter.tablesServedTotal} <span className="text-[10px] font-normal">Tables</span>
                </p>
              </div>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Active Tables in Service */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 font-cormorant flex items-center gap-1.5">
                  <Flame size={16} className="text-orange-500" />
                  Active Dining Tables In Service ({waiter.activeTableNumbers.length})
                </h3>
              </div>

              {waiter.activeTableNumbers.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {waiter.activeTableNumbers.map((tableNum) => (
                    <div
                      key={tableNum}
                      className="bg-orange-50/70 border border-orange-200 p-3.5 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-orange-100 text-orange-700 rounded-xl font-bold text-xs">
                          <Armchair size={15} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-orange-950 font-cormorant">
                            Table {tableNum}
                          </p>
                          <p className="text-[10px] font-semibold text-orange-700">
                            In Kitchen / Service
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-orange-600 text-white text-[10px] font-bold">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-xs text-gray-500 font-medium">
                  No active orders assigned to {waiter.name} at this moment.
                </div>
              )}
            </div>

            {/* Complete Service History Log */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-bold text-gray-900 font-cormorant flex items-center gap-1.5">
                  <History size={16} className="text-culinary-primary" />
                  Recent Served Tables History ({waiter.recentServedOrders.length})
                </h3>

                <button
                  type="button"
                  onClick={() => onOpenHistory(waiter.id, waiter.name)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <History size={13} className="text-amber-700" />
                  <span>View Full History</span>
                </button>
              </div>

              {waiter.recentServedOrders.length === 0 ? (
                <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500">
                  No served orders logged yet for this waiter.
                </div>
              ) : (
                <div className="space-y-3">
                  {waiter.recentServedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:border-gray-300 transition-all space-y-2.5"
                    >
                      {/* Order Row Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200 text-xs flex items-center gap-1">
                            <Armchair size={12} /> Table {order.tableNumber}
                          </span>
                          <span className="font-mono text-xs text-gray-600 font-bold">
                            #{order.orderNumber}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-sm text-gray-900">
                            ₹{order.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Items Breakdown */}
                      <div className="bg-gray-50/80 p-2.5 rounded-xl text-xs space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Dishes Served:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((item) => (
                            <span
                              key={`${order.id}-${item.name}`}
                              className="bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700 text-[11px] font-medium"
                            >
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Timestamp and Status */}
                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-gray-400" />
                          {order.servedAt
                            ? `${format(new Date(order.servedAt), "hh:mm a, dd MMM yyyy")} (${formatDistanceToNow(new Date(order.servedAt), { addSuffix: true })})`
                            : "Recently"}
                        </span>

                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                          ✓ {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Lifetime Revenue Served:{" "}
              <strong className="text-gray-900">
                ₹{waiter.revenueAllTime.toLocaleString("en-IN")}
              </strong>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenHistory(waiter.id, waiter.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors"
              >
                <History size={13} className="text-amber-700" />
                <span>All History</span>
              </button>

              <button
                type="button"
                onClick={() => onCall(waiter.id, waiter.name)}
                disabled={isCalling}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 active:scale-95 transition-all"
              >
                <PhoneCall size={13} className={isCalling ? "animate-spin" : ""} />
                <span>{isCalling ? "Calling..." : "Call Waiter"}</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface WaiterPerformanceSectionProps {
  restaurantId?: string;
}

export function WaiterPerformanceSection({ restaurantId }: Readonly<WaiterPerformanceSectionProps> = {}) {
  const { socket } = useSocket();
  const [waiters, setWaiters] = useState<WaiterPerformance[]>([]);
  const [summary, setSummary] = useState<WaiterSummary>({
    totalWaiters: 0,
    onlineWaiters: 0,
    totalServedToday: 0,
    totalRevenueToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<WaiterFilterStatus>("ALL");

  // Selected Waiter for Details Drawer
  const [selectedWaiter, setSelectedWaiter] = useState<WaiterPerformance | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetWaiter, setHistoryTargetWaiter] = useState<{ id: string; name: string } | null>(null);
  const [callingWaiterId, setCallingWaiterId] = useState<string | null>(null);
  const [waiterAckData, setWaiterAckData] = useState<WaiterAckData | null>(null);
  const seenAckIdsRef = useRef<Set<string>>(new Set());

  const handleCallWaiter = async (waiterId: string, waiterName: string) => {
    setCallingWaiterId(waiterId);
    try {
      const res = await axios.post("/api/waiter/call", {
        waiterId,
        callerName: "Admin",
        message: "Admin is calling you! Please report to the counter or check floor station.",
      });
      if (res.data?.success) {
        toast.success(`📢 Alert chime sent to ${waiterName}!`, {
          icon: "🔔",
          duration: 4500,
        });
      }
    } catch (err) {
      console.error("Failed to call waiter:", err);
      toast.error(`Could not send alert to ${waiterName}.`);
    } finally {
      setCallingWaiterId(null);
    }
  };

  const fetchPerformance = useCallback(async () => {
    try {
      const url = restaurantId && restaurantId !== "all"
        ? `/api/waiter/performance?restaurantId=${restaurantId}`
        : "/api/waiter/performance";
      const res = await axios.get(url);
      if (res.data) {
        setWaiters(res.data.waiters || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }

        // Check if any recent call was acknowledged (works in polling without WebSockets)
        if (Array.isArray(res.data.recentCalls)) {
          for (const call of res.data.recentCalls) {
            if (call.status === "ACKNOWLEDGED" && call.id && !seenAckIdsRef.current.has(call.id)) {
              seenAckIdsRef.current.add(call.id);
              setWaiterAckData({
                id: call.id,
                waiterId: call.waiterId,
                waiterName: call.waiterName,
                message: `${call.waiterName} acknowledged your call and is on the way! 🏃`,
                timestamp: call.acknowledgedAt || call.timestamp,
              });
              toast.success(`🏃 ${call.waiterName} acknowledged your call and is on the way!`, {
                id: `ack-${call.id}`,
                duration: 5000,
                icon: "✅",
              });
            }
          }
        }

        // If drawer is open, keep selected waiter in sync
        setSelectedWaiter((prev) => {
          if (!prev) return null;
          return res.data.waiters.find((w: WaiterPerformance) => w.id === prev.id) || prev;
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to fetch waiter performance:", err);
      return false;
    }
  }, [restaurantId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const success = await fetchPerformance();
    setIsRefreshing(false);
    if (success) {
      toast.success("Waitstaff analytics updated");
    } else {
      toast.error("Failed to load waitstaff metrics");
    }
  };

  useEffect(() => {
    let ignore = false;

    async function init() {
      await fetchPerformance();
      if (!ignore) {
        setIsLoading(false);
      }
    }

    void init();

    // Auto poll every 10 seconds for live admin view
    const interval = setInterval(() => {
      void fetchPerformance();
    }, 10000);

    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchPerformance]);

  // Socket listener for real-time waiter call acknowledgment
  useEffect(() => {
    if (!socket) return;

    const handleWaiterAck = (data: WaiterAckData) => {
      setWaiterAckData(data);
    };

    socket.on("waiter:call:acknowledged", handleWaiterAck);

    return () => {
      socket.off("waiter:call:acknowledged", handleWaiterAck);
    };
  }, [socket]);

  const handleOpenWaiter = (waiter: WaiterPerformance) => {
    setSelectedWaiter(waiter);
    setIsDrawerOpen(true);
  };

  const handleOpenHistory = (id: string, name: string) => {
    setHistoryTargetWaiter({ id, name });
    setIsHistoryModalOpen(true);
  };

  const filteredWaiters = useMemo(() => {
    return waiters.filter((w) => matchesWaiterFilter(w, searchTerm, statusFilter));
  }, [waiters, searchTerm, statusFilter]);

  const onlineWaitersCount = useMemo(
    () => waiters.filter((w) => w.isOnline).length,
    [waiters]
  );

  const activeWaitersCount = useMemo(
    () => waiters.filter((w) => w.tablesServedToday > 0 || w.activeOrdersCount > 0).length,
    [waiters]
  );

  return (
    <div className="space-y-6 font-sans">
      <WaiterOverviewCards summary={summary} />

      <WaiterFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalWaitersCount={waiters.length}
        onlineWaitersCount={onlineWaitersCount}
        activeWaitersCount={activeWaitersCount}
        isRefreshing={isRefreshing}
        onRefresh={() => void handleRefresh()}
      />

      <WaiterListView
        isLoading={isLoading}
        filteredWaiters={filteredWaiters}
        searchTerm={searchTerm}
        onOpenWaiter={handleOpenWaiter}
        onCallWaiter={handleCallWaiter}
        callingWaiterId={callingWaiterId}
      />

      <WaiterDetailsDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        waiter={selectedWaiter}
        isCalling={callingWaiterId === selectedWaiter?.id}
        onCall={handleCallWaiter}
        onOpenHistory={handleOpenHistory}
      />

      {/* Interactive Waiter Full History Modal (Day-wise & Time-wise) */}
      <WaiterHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        waiterId={historyTargetWaiter?.id}
        waiterName={historyTargetWaiter?.name}
      />

      {/* Real-time Waiter Responded / On The Way Center Notification Modal */}
      <AdminWaiterAckModal
        ackData={waiterAckData}
        onDismiss={() => setWaiterAckData(null)}
      />
    </div>
  );
}
