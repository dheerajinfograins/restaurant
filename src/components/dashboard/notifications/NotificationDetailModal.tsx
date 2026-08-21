"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Receipt,
  ChefHat,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Armchair,
  User,
  Phone,
  ArrowRight,
  ExternalLink,
  Clock,
  Check,
  RotateCcw,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  Loader2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { isOrderPaid } from "@/lib/order-payment";

export type NotificationType =
  | "ORDER_NEW"
  | "ORDER_READY"
  | "ORDER_SERVED"
  | "ORDER_CANCELLED"
  | "ORDER_UPDATED"
  | "WAITER_CALL"
  | "WAITER_CALL_ACK"
  | "STAFF_STATUS";

export interface NotificationMetadata {
  orderId?: string;
  orderNumber?: string;
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  paymentMethod?: string | null;
  status?: string;
  itemsCount?: number;
  items?: Array<{
    id?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    foodType?: string;
  }>;
  notes?: string;
  waiterId?: string;
  waiterName?: string;
  staffId?: string;
  staffName?: string;
  role?: string;
  isActive?: boolean;
  reason?: string;
  actionUrl?: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string; // ISO string
  isRead: boolean;
  metadata?: NotificationMetadata;
}

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRead: (id: string) => void;
  onOrderUpdated?: (orderId: string, updatedFields: Partial<NotificationMetadata>) => void;
}

export type PaymentMethodOption = "CASH" | "UPI" | "CARD";

const PAYMENT_METHODS = [
  { key: "UPI", label: "📱 UPI" },
  { key: "CASH", label: "💵 Cash" },
  { key: "CARD", label: "💳 Card" },
] as const;

function getInitialPaymentMethod(method?: string | null): PaymentMethodOption {
  if (method === "CASH" || method === "CARD") {
    return method;
  }
  return "UPI";
}

function NotificationTypeIcon({ type }: Readonly<{ type: NotificationType }>) {
  switch (type) {
    case "ORDER_NEW":
      return <Receipt className="text-amber-700" size={22} />;
    case "ORDER_READY":
      return <ChefHat className="text-emerald-600" size={22} />;
    case "ORDER_SERVED":
      return <CheckCircle2 className="text-indigo-600" size={22} />;
    case "ORDER_CANCELLED":
      return <AlertCircle className="text-red-600" size={22} />;
    case "WAITER_CALL":
      return <BellRing className="text-amber-600 animate-bounce" size={22} />;
    case "WAITER_CALL_ACK":
      return <CheckCircle2 className="text-emerald-600" size={22} />;
    case "STAFF_STATUS":
      return <User className="text-stone-700" size={22} />;
    default:
      return <Receipt className="text-amber-700" size={22} />;
  }
}

function StatusBadge({ status }: Readonly<{ status?: string }>) {
  if (!status) return null;

  switch (status.toUpperCase()) {
    case "PENDING":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">⏳ Order Pending</span>;
    case "ACCEPTED":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">👍 Accepted</span>;
    case "PREPARING":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">👨‍🍳 In Kitchen</span>;
    case "READY":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">✨ Ready to Serve</span>;
    case "SERVED":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🍽️ Served</span>;
    case "PAID":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ Completed & Paid</span>;
    case "CANCELLED":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">❌ Cancelled</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700">{status}</span>;
  }
}

function PaymentMethodBadge({ method }: Readonly<{ method?: string | null }>) {
  switch (method?.toUpperCase()) {
    case "UPI":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <QrCode size={13} className="text-purple-600" /> UPI / QR Scan
        </span>
      );
    case "CASH":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Banknote size={13} className="text-emerald-600" /> Cash at Counter
        </span>
      );
    case "CARD":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <CreditCard size={13} className="text-blue-600" /> Card Payment
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-stone-100 text-stone-700 border border-stone-200">
          <Wallet size={13} className="text-stone-500" /> Pay at Counter / UPI
        </span>
      );
  }
}

interface PaymentSectionProps {
  metadata?: NotificationMetadata;
  isPaid: boolean;
  selectedPayMethod: PaymentMethodOption;
  onSelectPayMethod: (method: PaymentMethodOption) => void;
  isMarkingPaid: boolean;
  onMarkAsPaid: () => void;
}

function PaymentSection({
  metadata,
  isPaid,
  selectedPayMethod,
  onSelectPayMethod,
  isMarkingPaid,
  onMarkAsPaid,
}: Readonly<PaymentSectionProps>) {
  if (!metadata?.orderNumber && metadata?.totalAmount === undefined) {
    return null;
  }

  const containerBgClass = isPaid
    ? "bg-emerald-50/70 border-emerald-200/90 shadow-xs"
    : "bg-amber-50/70 border-amber-200/90 shadow-xs";

  const iconBgClass = isPaid ? "bg-emerald-600 text-white" : "bg-amber-600 text-white";
  const statusTextClass = isPaid ? "text-emerald-900" : "text-amber-950";
  const statusLabel = isPaid ? "Payment Received (PAID)" : "Payment Due (UNPAID)";

  return (
    <div className={`p-4 rounded-2xl border transition-all ${containerBgClass}`}>
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBgClass}`}>
            {isPaid ? <CheckCircle2 size={16} /> : <Wallet size={16} />}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block">
              Payment Status
            </span>
            <span className={`text-sm font-bold ${statusTextClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-stone-500 block">Bill Amount</span>
          <span className="font-mono font-bold text-base text-stone-900">
            ₹{Number(metadata?.totalAmount || 0).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-medium">Selected Payment Mode:</span>
          <PaymentMethodBadge method={metadata?.paymentMethod} />
        </div>

        {isPaid && (
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-lg">
            ✨ Transaction Settled
          </span>
        )}
      </div>

      {!isPaid && (
        <div className="mt-3.5 pt-3 border-t border-amber-200/70 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900">
              Receive Payment Now:
            </span>
            <div className="flex items-center gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => onSelectPayMethod(m.key)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all ${
                    selectedPayMethod === m.key
                      ? "bg-amber-700 text-white border-amber-700 shadow-2xs"
                      : "bg-white text-stone-700 border-stone-300 hover:bg-stone-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isMarkingPaid}
            onClick={onMarkAsPaid}
            className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white font-bold text-xs rounded-xl h-9 gap-1.5 shadow-sm active:scale-[0.99] transition-all"
          >
            {isMarkingPaid ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Updating Payment...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Mark Order as PAID ({selectedPayMethod})</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderDetailsSection({ metadata }: Readonly<{ metadata?: NotificationMetadata }>) {
  if (!metadata?.orderNumber) return null;

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Order ID</span>
          <p className="font-mono font-bold text-base text-stone-900">{metadata.orderNumber}</p>
        </div>
        <div>
          <StatusBadge status={metadata.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          <span className="text-stone-400 flex items-center gap-1 text-[11px]">
            <Armchair size={12} className="text-amber-700" /> Table
          </span>
          <p className="font-bold text-stone-800 mt-0.5">
            {metadata.tableNumber ? `Table ${metadata.tableNumber}` : "Takeaway / Self"}
          </p>
        </div>

        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          <span className="text-stone-400 flex items-center gap-1 text-[11px]">
            <User size={12} className="text-amber-700" /> Customer
          </span>
          <p className="font-bold text-stone-800 mt-0.5 truncate" title={metadata.customerName || "Guest"}>
            {metadata.customerName || "Guest"}
          </p>
        </div>

        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 col-span-2 sm:col-span-1">
          <span className="text-stone-400 flex items-center gap-1 text-[11px]">
            <Phone size={12} className="text-amber-700" /> Phone
          </span>
          <p className="font-bold text-stone-800 mt-0.5 truncate">
            {metadata.customerPhone || "N/A"}
          </p>
        </div>
      </div>

      {metadata.waiterName && (
        <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-xl text-xs">
          <span className="text-amber-800 font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-600" /> Assigned Server:
          </span>
          <span className="font-bold text-amber-950">{metadata.waiterName}</span>
        </div>
      )}

      {metadata.items && metadata.items.length > 0 && (
        <div className="pt-2">
          <span className="text-[11px] uppercase font-bold text-stone-500 tracking-wider block mb-2">
            Ordered Dishes ({metadata.items.length})
          </span>
          <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
            {metadata.items.map((item) => (
              <div
                key={item.id ?? `${item.name}-${item.unitPrice}`}
                className="flex items-center justify-between p-2.5 text-xs bg-white hover:bg-stone-50/80"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-700 w-5 text-center">{item.quantity}x</span>
                  <span className="font-medium text-stone-800">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-stone-900">
                  ₹{(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StaffDetailsSection({ metadata }: Readonly<{ metadata?: NotificationMetadata }>) {
  if (!metadata?.staffName) return null;

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2 text-xs">
      <div className="flex justify-between items-center">
        <span className="text-stone-500 font-medium">Staff Member:</span>
        <span className="font-bold text-stone-900 text-sm">{metadata.staffName}</span>
      </div>
      {metadata.role && (
        <div className="flex justify-between items-center">
          <span className="text-stone-500 font-medium">Role:</span>
          <span className="font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">
            {metadata.role}
          </span>
        </div>
      )}
      {metadata.isActive !== undefined && (
        <div className="flex justify-between items-center">
          <span className="text-stone-500 font-medium">Account Status:</span>
          <span className={`font-bold px-2 py-0.5 rounded-md ${metadata.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
            {metadata.isActive ? "Active (Can Log In)" : "Inactive (Access Revoked)"}
          </span>
        </div>
      )}
    </div>
  );
}

function ActionNavigationButton({
  metadata,
  onNavigate,
}: Readonly<{
  metadata?: NotificationMetadata;
  onNavigate: (url: string) => void;
}>) {
  if (metadata?.actionUrl) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onNavigate(metadata.actionUrl!)}
        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
      >
        <span>Open Section</span>
        <ArrowRight size={13} />
      </Button>
    );
  }

  if (metadata?.orderId || metadata?.orderNumber) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onNavigate("/dashboard/orders")}
        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
      >
        <span>View Live Orders</span>
        <ExternalLink size={13} />
      </Button>
    );
  }

  if (metadata?.tableNumber) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onNavigate("/dashboard/floor")}
        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
      >
        <span>View Floor</span>
        <ExternalLink size={13} />
      </Button>
    );
  }

  if (metadata?.staffId) {
    return (
      <Button
        type="button"
        size="sm"
        onClick={() => onNavigate("/dashboard/staff")}
        className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-xl gap-1.5 shadow-sm"
      >
        <span>Staff Management</span>
        <ExternalLink size={13} />
      </Button>
    );
  }

  return null;
}

export default function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onToggleRead,
  onOrderUpdated,
}: Readonly<NotificationDetailModalProps>) {
  const router = useRouter();
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [prevNotificationId, setPrevNotificationId] = useState<string | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMethodOption>("UPI");
  const [orderOverride, setOrderOverride] = useState<Partial<NotificationMetadata> | null>(null);

  // Sync state during render when notification changes without triggering cascading effects
  if (notification && notification.id !== prevNotificationId) {
    setPrevNotificationId(notification.id);
    setOrderOverride(null);
    setSelectedPayMethod(getInitialPaymentMethod(notification.metadata?.paymentMethod));
  } else if (!notification && prevNotificationId !== null) {
    setPrevNotificationId(null);
    setOrderOverride(null);
  }

  if (!notification) return null;

  const metadata = {
    ...notification.metadata,
    ...orderOverride,
  };
  const { type, title, message, timestamp, isRead } = notification;
  const isPaid = isOrderPaid(metadata);

  const formattedDate = new Date(timestamp).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleMarkAsPaid = async () => {
    const orderIdentifier = metadata?.orderId || metadata?.orderNumber;
    if (!orderIdentifier) return;
    setIsMarkingPaid(true);

    try {
      const res = await fetch(`/api/orders/${orderIdentifier}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: selectedPayMethod,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update payment status");
      }

      setOrderOverride((prev) => ({
        ...prev,
        status: "PAID",
        paymentMethod: selectedPayMethod,
      }));

      if (onOrderUpdated && metadata.orderId) {
        onOrderUpdated(metadata.orderId, {
          status: "PAID",
          paymentMethod: selectedPayMethod,
        });
      }

      toast.success(`Order #${metadata.orderNumber || ""} marked as PAID (${selectedPayMethod})! 💳`, {
        id: "mark-paid-success",
      });
    } catch (err) {
      console.error("Payment update error:", err);
      toast.error("Failed to update payment status. Please try again.");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full bg-white rounded-3xl p-0 overflow-hidden border border-stone-200/90 shadow-2xl">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-6 pb-5 relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md shrink-0">
              <NotificationTypeIcon type={type} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {type.replaceAll("_", " ")}
                </span>
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <Clock size={11} /> {formattedDate}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold font-cormorant text-white tracking-wide mt-1">
                {title}
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Main notification description */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4 text-stone-700 text-sm leading-relaxed">
            {message}
          </div>

          {/* 💳 DEDICATED PAYMENT STATUS SECTION */}
          <PaymentSection
            metadata={metadata}
            isPaid={isPaid}
            selectedPayMethod={selectedPayMethod}
            onSelectPayMethod={setSelectedPayMethod}
            isMarkingPaid={isMarkingPaid}
            onMarkAsPaid={handleMarkAsPaid}
          />

          {/* If Order Information exists */}
          <OrderDetailsSection metadata={metadata} />

          {/* If Staff Change */}
          <StaffDetailsSection metadata={metadata} />
        </div>

        {/* Modal Footer / Navigation Buttons */}
        <div className="p-4 bg-stone-50/80 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleRead(notification.id)}
            className="text-xs text-stone-600 hover:text-stone-900 border-stone-200 rounded-xl"
          >
            {isRead ? (
              <>
                <RotateCcw size={13} className="mr-1" /> Mark as unread
              </>
            ) : (
              <>
                <Check size={13} className="mr-1 text-emerald-600" /> Mark as read
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("/dashboard/payments")}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded-xl gap-1"
            >
              <DollarSign size={13} />
              <span>Payments Desk</span>
            </Button>

            <ActionNavigationButton metadata={metadata} onNavigate={handleNavigate} />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
