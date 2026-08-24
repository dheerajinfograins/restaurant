"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  QrCode,
  Banknote,
  CreditCard,
  Receipt,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Bell
} from "lucide-react";
import { OrderCountdown } from "./order-countdown";
import type { OrderStatus, PaymentMethod } from "@prisma/client";
import toast from "react-hot-toast";

import { copyToClipboard } from "@/lib/utils";

interface OrderItemData {
  id: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    image?: string | null;
    foodType?: string;
  };
}

interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
  createdAt: Date;
  tableId?: string;
  tableNumber: string;
  restaurantName?: string;
  restaurantLogo?: string | null;
  items: OrderItemData[];
  totalAmount: number;
}

export function OrderTrackerClient({ initialOrder }: { readonly initialOrder: OrderData }) {
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  useEffect(() => {
    // Poll every 3 seconds for real-time status updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder((prev) => ({
            ...prev,
            status: data.status,
            paymentMethod: data.paymentMethod || prev.paymentMethod,
            totalAmount: Number(data.totalAmount || prev.totalAmount),
            createdAt: new Date(data.createdAt || prev.createdAt),
          }));
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order.id]);

  const handleCopyOrderNumber = async () => {
    const ok = await copyToClipboard(order.orderNumber);
    if (ok) {
      setCopied(true);
      toast.success("Order # copied to clipboard!", { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCallWaiter = () => {
    setWaiterCalled(true);
    toast.success(`Server alerted for Table ${order.tableNumber}! A staff member will assist you shortly.`, {
      icon: "🛎️",
      duration: 4000,
      style: {
        borderRadius: "16px",
        background: "#1c1917",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
      },
    });
  };

  // 4 Main Culinary Stages
  const steps = [
    {
      id: "RECEIVED",
      title: "Order Received",
      desc: "Order has been registered in the system",
      icon: Clock,
      activeFor: ["PENDING"],
      completedFor: ["ACCEPTED", "PREPARING", "READY", "SERVED", "PAID"],
    },
    {
      id: "PREPARING",
      title: "Kitchen Preparing",
      desc: "Chef is cooking your fresh dishes",
      icon: ChefHat,
      activeFor: ["ACCEPTED", "PREPARING"],
      completedFor: ["READY", "SERVED", "PAID"],
    },
    {
      id: "READY",
      title: "Ready to Serve",
      desc: "Food is plated & ready for delivery",
      icon: BellRing,
      activeFor: ["READY"],
      completedFor: ["SERVED", "PAID"],
    },
    {
      id: "SERVED",
      title: "Served at Table",
      desc: "Delivered to your table. Enjoy your meal!",
      icon: UtensilsCrossed,
      activeFor: ["SERVED", "PAID"],
      completedFor: ["PAID"],
    },
  ];

  // Helper for active hero banner
  const getHeroStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return {
          badgeText: "Order Received",
          badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
          title: "Waiting for Confirmation",
          description: "Your order is being reviewed by the kitchen desk.",
          emoji: "⏳",
          showTimer: false,
          bgColor: "from-amber-500/15 via-orange-50/80 to-amber-50/30",
          borderColor: "border-amber-200",
        };
      case "ACCEPTED":
      case "PREPARING":
        return {
          badgeText: "Cooking in Progress",
          badgeColor: "bg-amber-500 text-white border-amber-600",
          title: "Chef is Preparing Your Food",
          description: "Fresh ingredients are sizzling in the kitchen right now.",
          emoji: "👨‍🍳",
          showTimer: true,
          bgColor: "from-amber-500/20 via-orange-50/90 to-amber-50/40",
          borderColor: "border-amber-300",
        };
      case "READY":
        return {
          badgeText: "Food is Ready!",
          badgeColor: "bg-emerald-600 text-white border-emerald-700 animate-pulse",
          title: "On Its Way to Your Table",
          description: `Dishes are plated and the waiter is bringing them to Table ${order.tableNumber}.`,
          emoji: "🛎️",
          showTimer: false,
          bgColor: "from-emerald-500/20 via-emerald-50/90 to-teal-50/30",
          borderColor: "border-emerald-300",
        };
      case "SERVED":
        return {
          badgeText: "Order Served",
          badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
          title: "Bon Appétit! Enjoy Your Meal",
          description: `Served at Table ${order.tableNumber}. Need extra sauces or drinks? Call your waiter anytime.`,
          emoji: "🍽️",
          showTimer: false,
          bgColor: "from-emerald-500/15 via-lime-50/80 to-emerald-50/30",
          borderColor: "border-emerald-200",
        };
      case "PAID":
        return {
          badgeText: "Payment Settled",
          badgeColor: "bg-emerald-600 text-white border-emerald-700",
          title: "Thank You for Dining With Us!",
          description: "Your bill has been settled. We look forward to serving you again.",
          emoji: "✨",
          showTimer: false,
          bgColor: "from-stone-900 via-gray-900 to-black text-white",
          borderColor: "border-gray-800",
        };
      case "CANCELLED":
        return {
          badgeText: "Order Cancelled",
          badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
          title: "This Order Was Cancelled",
          description: "Please speak with your restaurant staff for details.",
          emoji: "❌",
          showTimer: false,
          bgColor: "from-rose-500/15 via-red-50/80 to-rose-50/30",
          borderColor: "border-rose-200",
        };
      default:
        return {
          badgeText: "Processing",
          badgeColor: "bg-gray-100 text-gray-800 border-gray-300",
          title: "Order Update",
          description: "Tracking order progress...",
          emoji: "📋",
          showTimer: false,
          bgColor: "from-amber-500/10 via-stone-50 to-amber-50/20",
          borderColor: "border-gray-200",
        };
    }
  };

  const getPaymentDetails = (method?: PaymentMethod | null) => {
    if (method === "CARD") {
      return {
        icon: <CreditCard size={20} className="text-blue-600" />,
        label: "Debit / Credit Card",
      };
    }
    if (method === "CASH") {
      return {
        icon: <Banknote size={20} className="text-emerald-600" />,
        label: "Cash at Table",
      };
    }
    return {
      icon: <QrCode size={20} className="text-purple-600" />,
      label: "UPI QR Payment",
    };
  };

  const heroInfo = getHeroStatusInfo(order.status);
  const isDarkHero = order.status === "PAID";
  const paymentDetails = getPaymentDetails(order.paymentMethod);

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* Top Header Card */}
      <header className="bg-white rounded-b-3xl shadow-sm border-b border-amber-100/70 p-5 pt-7 mb-2">
        <div className="flex items-center justify-between">
          {/* Back to Menu Link */}
          {order.tableId ? (
            <Link
              href={`/menu/${order.tableId}`}
              className="flex items-center gap-1 text-xs font-bold text-culinary-primary bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200/80 transition-all shadow-2xs active:scale-95"
            >
              <ArrowLeft size={14} />
              <span>Menu</span>
            </Link>
          ) : (
            <div />
          )}

          {/* Table Indicator */}
          <div className="bg-amber-100/80 border border-amber-300 px-3.5 py-1 rounded-full text-xs font-black text-amber-950 flex items-center gap-1 shadow-2xs">
            <span>Table {order.tableNumber}</span>
            <span className="text-amber-400">•</span>
            <span className="font-semibold text-[11px] text-amber-800">Dine-in</span>
          </div>
        </div>

        {/* Restaurant Title & Order Number */}
        <div className="text-center mt-3">
          <h1 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text tracking-tight">
            {order.restaurantName || "The Culinary Ledger"}
          </h1>

          <div className="inline-flex items-center gap-1.5 mt-1 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-xs text-gray-600 font-mono">
            <span className="text-[11px] font-bold text-gray-400">Order:</span>
            <span className="font-bold text-stone-900">{order.orderNumber}</span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="text-gray-400 hover:text-gray-700 ml-0.5 p-0.5"
              title="Copy Order ID"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="px-5 space-y-5">
        {/* ========================================================================= */}
        {/* HERO LIVE STATUS BANNER */}
        {/* ========================================================================= */}
        <section
          className={`p-6 rounded-3xl bg-gradient-to-br ${heroInfo.bgColor} border-2 ${heroInfo.borderColor} shadow-sm relative overflow-hidden text-center space-y-3 transition-all duration-300`}
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl pointer-events-none" />

          {/* Animated Emoji Icon */}
          <div className="w-16 h-16 rounded-3xl bg-white shadow-md border border-white/80 flex items-center justify-center text-3xl mx-auto animate-bounce-short">
            {heroInfo.emoji}
          </div>

          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full border shadow-2xs inline-block mb-1.5 ${heroInfo.badgeColor}`}
            >
              {heroInfo.badgeText}
            </span>

            <h2
              className={`text-xl sm:text-2xl font-bold font-cormorant leading-tight ${isDarkHero ? "text-white" : "text-stone-900"
                }`}
            >
              {heroInfo.title}
            </h2>

            <p
              className={`text-xs mt-1 max-w-xs mx-auto ${isDarkHero ? "text-gray-300" : "text-gray-600"
                }`}
            >
              {heroInfo.description}
            </p>
          </div>

          {/* Countdown Timer (during preparation) */}
          {heroInfo.showTimer && (
            <div className="pt-2 flex justify-center">
              <div className="bg-white/90 backdrop-blur-xs px-4 py-2 rounded-2xl border border-amber-200 shadow-sm flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-800">Estimated Prep Time:</span>
                <OrderCountdown createdAt={order.createdAt} />
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* STEP-BY-STEP PROGRESS TIMELINE */}
        {/* ========================================================================= */}
        <section className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles size={14} className="text-culinary-primary" />
              <span>Live Order Tracker</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-updating</span>
            </span>
          </div>

          <div className="space-y-4 pt-1">
            {steps.map((step, index) => {
              const isCompleted = step.completedFor.includes(order.status);
              const isActive = step.activeFor.includes(order.status) && !isCompleted;
              const Icon = step.icon;

              let iconStyle = "bg-gray-50 border-gray-200 text-gray-400";
              if (isCompleted) {
                iconStyle = "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20";
              } else if (isActive) {
                iconStyle = "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/30 scale-105 animate-pulse";
              }

              let cardStyle = "bg-gray-50/50 border-gray-100 opacity-70";
              if (isActive) {
                cardStyle = "bg-amber-50/70 border-amber-200 shadow-2xs";
              } else if (isCompleted) {
                cardStyle = "bg-emerald-50/30 border-emerald-100";
              }

              let titleStyle = "text-gray-400";
              if (isActive) {
                titleStyle = "text-amber-950 font-cormorant text-base";
              } else if (isCompleted) {
                titleStyle = "text-emerald-950 font-medium";
              }

              let descStyle = "text-gray-400";
              if (isActive) {
                descStyle = "text-amber-900/80 font-medium";
              } else if (isCompleted) {
                descStyle = "text-gray-500";
              }

              return (
                <div key={step.id} className="relative flex items-start gap-4 group">
                  {/* Vertical Connecting Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 bottom-0 w-0.5 -translate-x-1/2 transition-colors duration-300 ${isCompleted ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                    />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-300 z-10 ${iconStyle}`}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>

                  {/* Step Title & Details Card */}
                  <div className={`flex-1 p-3 rounded-2xl border transition-all ${cardStyle}`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold leading-tight ${titleStyle}`}>
                        {step.title}
                      </h4>

                      {isActive && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                          In Progress
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          Done ✓
                        </span>
                      )}
                    </div>

                    <p className={`text-xs mt-0.5 ${descStyle}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PAYMENT STATUS & METHOD BADGE */}
        {/* ========================================================================= */}
        <section className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-culinary-primary">
              {paymentDetails.icon}
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Payment Method
              </span>
              <span className="text-sm font-bold text-stone-900">
                {paymentDetails.label}
              </span>
            </div>
          </div>

          <div>
            {(order.status === "PAID" || order.notes?.includes("Razorpay Paid") || (order.paymentMethod && order.paymentMethod !== "CASH")) ? (
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <CheckCircle2 size={13} />
                <span>Paid Online</span>
              </span>
            ) : (
              <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200 flex items-center gap-1 shadow-2xs">
                <Clock size={13} />
                <span>Pay Cash to Server</span>
              </span>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ORDERED DISHES SUMMARY */}
        {/* ========================================================================= */}
        <section className="bg-white p-6 rounded-3xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Receipt size={14} className="text-culinary-primary" />
              <span>Ordered Dishes ({order.items.length})</span>
            </h3>
            <span className="text-xs font-bold text-culinary-primary font-cormorant text-base">
              ₹{Number(order.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm py-1">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-50 text-culinary-primary text-xs font-bold flex items-center justify-center border border-amber-200/60 shrink-0">
                    {item.quantity}x
                  </span>
                  <span className="font-semibold text-stone-800 truncate text-xs sm:text-sm">
                    {item.product.name}
                  </span>
                </div>
                <span className="font-bold text-stone-900 text-xs sm:text-sm font-mono shrink-0">
                  ₹{Number(item.totalPrice || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer Cooking Notes if present */}
          {order.notes && (
            <div className="pt-3 border-t border-dashed border-gray-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                Special Instructions:
              </span>
              <p className="text-xs text-stone-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 italic">
                &ldquo;{order.notes}&rdquo;
              </p>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ACTION BUTTONS (ORDER MORE & CALL WAITER) */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 gap-3 pt-1">
          {/* Order More Dishes */}
          {order.tableId && (
            <Link
              href={`/menu/${order.tableId}`}
              className="py-3.5 px-4 bg-white border-2 border-culinary-primary text-culinary-primary hover:bg-amber-50 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all text-center"
            >
              <UtensilsCrossed size={16} />
              <span>Order More</span>
            </Link>
          )}

          {/* Call Waiter Button */}
          <button
            type="button"
            onClick={handleCallWaiter}
            disabled={waiterCalled}
            className={`py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all text-center ${waiterCalled
              ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
              : "bg-gray-900 hover:bg-black text-white shadow-gray-900/10"
              }`}
          >
            <Bell size={16} />
            <span>{waiterCalled ? "Staff Alerted" : "Call Waiter"}</span>
          </button>
        </section>
      </main>
    </div>
  );
}
