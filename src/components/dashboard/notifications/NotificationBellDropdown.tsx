"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Receipt,
  ChefHat,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Armchair,
  Volume2,
  VolumeX,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/components/providers/socket-provider";
import toast from "react-hot-toast";
import { isOrderPaid } from "@/lib/order-payment";
import NotificationDetailModal, {
  AppNotification,
  NotificationMetadata,
  NotificationType,
} from "./NotificationDetailModal";

const STORAGE_KEY = "restaurant_notifications_history_v2";

type FilterTab = "ALL" | "UNREAD" | "ORDERS" | "ALERTS";

interface OrderItemPayload {
  id?: string;
  quantity?: number;
  unitPrice?: number | string;
  product?: {
    name?: string;
    foodType?: string;
  };
}

interface OrderPayload {
  id: string;
  orderNumber?: string;
  status?: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number | string;
  notes?: string;
  paymentMethod?: string | null;
  createdAt?: string;
  table?: {
    tableNumber?: string | number;
  } | null;
  waiter?: {
    id?: string;
    name?: string;
    email?: string;
  } | null;
  items?: OrderItemPayload[];
}

interface WaiterCallPayload {
  tableNumber?: string | number;
  waiterId?: string;
  waiterName?: string;
  reason?: string;
}

interface StaffStatusPayload {
  userId?: string;
  role?: string;
  isActive?: boolean;
}

function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
}

// Synthesize pleasant ambient chime sound without external asset dependencies
function playChimeTone() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  } catch {
    // ignore audio context errors if not allowed yet
  }
}

function calculateOrderItemsCount(items?: OrderItemPayload[]): number {
  return (items || []).reduce(
    (sum: number, it: OrderItemPayload) => sum + (it.quantity || 1),
    0
  );
}

function mapOrderItems(items?: OrderItemPayload[]) {
  return (items || []).map((it: OrderItemPayload) => ({
    name: it.product?.name || "Dish Item",
    quantity: it.quantity || 1,
    unitPrice: Number(it.unitPrice || 0),
    foodType: it.product?.foodType,
  }));
}

function buildInitialOrderNotification(
  order: OrderPayload,
  notifId: string
): AppNotification {
  const tableNumber = order.table?.tableNumber
    ? String(order.table.tableNumber)
    : "";
  const tableLabel = tableNumber ? `Table ${tableNumber}` : "Takeaway";
  const itemsCount = calculateOrderItemsCount(order.items);

  let notifType: NotificationType = "ORDER_NEW";
  let notifTitle = `Order #${order.orderNumber || ""} Placed`;

  if (order.status === "READY") {
    notifType = "ORDER_READY";
    notifTitle = `Order #${order.orderNumber || ""} Ready`;
  } else if (order.status === "SERVED") {
    notifType = "ORDER_SERVED";
    notifTitle = `Order #${order.orderNumber || ""} Served`;
  }

  return {
    id: notifId,
    type: notifType,
    title: notifTitle,
    message: `${tableLabel} • ${order.customerName || "Guest"} • ${itemsCount} items (₹${Number(
      order.totalAmount || 0
    ).toFixed(2)})`,
    timestamp: order.createdAt || new Date().toISOString(),
    isRead: true, // initial backfill is marked read
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount || 0),
      status: order.status,
      notes: order.notes,
      paymentMethod: order.paymentMethod,
      itemsCount,
      waiterName: order.waiter?.name,
      items: mapOrderItems(order.items),
    },
  };
}

function createInitialOrderNotifications(
  orders: OrderPayload[],
  existingList: AppNotification[]
): AppNotification[] {
  const existingOrderIds = new Set(
    existingList
      .filter((n) => n.metadata?.orderId)
      .map((n) => n.metadata?.orderId)
  );
  const existingIds = new Set(existingList.map((n) => n.id));
  const converted: AppNotification[] = [];

  for (const order of orders.slice(0, 20)) {
    const notifId = `order-init-${order.id}`;
    if (
      !existingIds.has(notifId) &&
      !existingIds.has(`order-${order.id}`) &&
      !existingOrderIds.has(order.id)
    ) {
      converted.push(buildInitialOrderNotification(order, notifId));
    }
  }

  return converted;
}

export default function NotificationBellDropdown() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Clean up existing duplicates from storage
          const unique: AppNotification[] = [];
          for (const item of parsed) {
            const isDup = unique.some(
              (u) =>
                u.id === item.id ||
                (u.type === item.type &&
                  u.title === item.title &&
                  u.message === item.message &&
                  Math.abs(new Date(u.timestamp).getTime() - new Date(item.timestamp).getTime()) < 30000) ||
                (Boolean(u.metadata?.orderId) &&
                  Boolean(item.metadata?.orderId) &&
                  u.metadata?.orderId === item.metadata?.orderId &&
                  u.type === item.type)
            );
            if (!isDup) {
              unique.push(item);
            }
          }
          return unique;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch initial orders on mount to ensure recent notifications exist
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) return;
        const orders = (await res.json()) as OrderPayload[];
        if (Array.isArray(orders) && orders.length > 0) {
          setNotifications((prev) => {
            const converted = createInitialOrderNotifications(orders, prev);
            if (converted.length === 0) return prev;

            const combined = [...prev, ...converted].sort(
              (a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            const limited = combined.slice(0, 100);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
            return limited;
          });
        }
      } catch (err) {
        console.error("Failed to load initial order notifications:", err);
      }
    };

    void fetchRecentOrders();
  }, []);

  // Save to localStorage whenever notifications change
  const saveNotifications = useCallback((newNotifs: AppNotification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifs.slice(0, 100)));
    } catch {
      // ignore
    }
  }, []);

  const addNotification = useCallback(
    (notif: Omit<AppNotification, "id" | "isRead">) => {
      let wasAdded = false;

      setNotifications((prev) => {
        // Deduplicate checks:
        // 1) Same orderId + same notification type
        // 2) Exact same type + title + message within 15 seconds
        // 3) Same waiter call/ack within 15 seconds
        const isDuplicate = prev.some((existing) => {
          if (
            notif.metadata?.orderId &&
            existing.metadata?.orderId === notif.metadata.orderId &&
            existing.type === notif.type
          ) {
            return true;
          }

          if (
            existing.type === notif.type &&
            existing.title === notif.title &&
            existing.message === notif.message
          ) {
            const timeDiff = Math.abs(
              new Date(existing.timestamp).getTime() -
                new Date(notif.timestamp).getTime()
            );
            if (timeDiff < 15000) return true;
          }

          if (
            (notif.type === "WAITER_CALL" || notif.type === "WAITER_CALL_ACK") &&
            existing.type === notif.type &&
            existing.metadata?.waiterId === notif.metadata?.waiterId &&
            existing.metadata?.tableNumber === notif.metadata?.tableNumber
          ) {
            const timeDiff = Math.abs(
              new Date(existing.timestamp).getTime() -
                new Date(notif.timestamp).getTime()
            );
            if (timeDiff < 15000) return true;
          }

          return false;
        });

        if (isDuplicate) {
          return prev;
        }

        const fullNotif: AppNotification = {
          ...notif,
          id: `notif-${Date.now()}-${typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Date.now().toString(36)}`,
          isRead: false,
        };

        wasAdded = true;
        const next = [fullNotif, ...prev].slice(0, 100);
        saveNotifications(next);
        return next;
      });

      if (wasAdded && soundEnabled) {
        playChimeTone();
      }
    },
    [soundEnabled, saveNotifications]
  );

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (order: OrderPayload) => {
      const tableNumber = order.table?.tableNumber ? String(order.table.tableNumber) : "";
      const tableLabel = tableNumber ? `Table ${tableNumber}` : "Takeaway";
      const itemsCount = calculateOrderItemsCount(order.items);

      addNotification({
        type: "ORDER_NEW",
        title: `New Order #${order.orderNumber || ""}`,
        message: `${tableLabel} • ${order.customerName || "Customer"
          } ordered ${itemsCount} items (₹${Number(order.totalAmount || 0).toFixed(2)})`,
        timestamp: new Date().toISOString(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          totalAmount: Number(order.totalAmount || 0),
          status: order.status || "PENDING",
          notes: order.notes,
          paymentMethod: order.paymentMethod,
          itemsCount,
          waiterName: order.waiter?.name,
          items: mapOrderItems(order.items),
        },
      });

      toast.success(`🛎️ New Order #${order.orderNumber || ""} received!`, {
        id: `order-new-${order.id}`,
      });
    };

    const handleOrderReady = (order: OrderPayload) => {
      const locationLabel = order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Takeaway";
      addNotification({
        type: "ORDER_READY",
        title: `Order #${order.orderNumber || ""} Ready to Serve!`,
        message: `Kitchen marked dishes ready for ${locationLabel}.`,
        timestamp: new Date().toISOString(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.table?.tableNumber ? String(order.table.tableNumber) : undefined,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes,
          paymentMethod: order.paymentMethod,
          status: "READY",
          totalAmount: Number(order.totalAmount || 0),
        },
      });

      toast(`👨‍🍳 Order #${order.orderNumber || ""} is ready to serve!`, {
        icon: "✨",
        id: `order-ready-${order.id}`,
      });
    };

    const handleOrderServed = (order: OrderPayload) => {
      const recipientLabel = order.table?.tableNumber ? `Table ${order.table.tableNumber}` : "Guest";
      addNotification({
        type: "ORDER_SERVED",
        title: `Order #${order.orderNumber || ""} Served`,
        message: `Delivered to ${recipientLabel}.`,
        timestamp: new Date().toISOString(),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableNumber: order.table?.tableNumber ? String(order.table.tableNumber) : undefined,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes,
          paymentMethod: order.paymentMethod,
          status: "SERVED",
          totalAmount: Number(order.totalAmount || 0),
        },
      });
    };

    const handleWaiterCall = (data: WaiterCallPayload & { message?: string }) => {
      const hasTable = Boolean(data.tableNumber);
      const title = hasTable
        ? `Table #${data.tableNumber} Calling Waiter`
        : `Waiter Call Alert`;
      const fallbackMessage = hasTable
        ? `Customer at Table ${data.tableNumber} requested assistance (${data.reason || "Assistance"}).`
        : `Admin/Manager called for waiter assistance (${data.reason || "Report to counter"}).`;
      const message = data.message || fallbackMessage;

      addNotification({
        type: "WAITER_CALL",
        title,
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          tableNumber: data.tableNumber ? String(data.tableNumber) : undefined,
          waiterId: data.waiterId,
          waiterName: data.waiterName,
          reason: data.reason || data.message,
          actionUrl: "/dashboard/floor",
        },
      });

      if (hasTable) {
        toast.error(`🚨 Table ${data.tableNumber} is calling for service!`, {
          id: `table-call-${data.tableNumber}`,
        });
      } else {
        toast(`🚨 Waiter call alert sent to ${data.waiterName || "Staff"}!`, {
          icon: "🛎️",
          id: `waiter-call-${data.waiterId || "alert"}`,
        });
      }
    };

    const handleWaiterCallAck = (data: WaiterCallPayload & { message?: string }) => {
      const hasTable = Boolean(data.tableNumber);
      const title = hasTable
        ? `Table #${data.tableNumber} Call Attended`
        : `Waiter Call Acknowledged`;
      const waiterLabel = data.waiterName || "Staff";
      const fallbackMessage = hasTable
        ? `Waiter ${waiterLabel} acknowledged Table ${data.tableNumber}.`
        : `Waiter ${waiterLabel} acknowledged the call and is on the way to the counter.`;
      const message = data.message || fallbackMessage;

      addNotification({
        type: "WAITER_CALL_ACK",
        title,
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          tableNumber: data.tableNumber ? String(data.tableNumber) : undefined,
          waiterId: data.waiterId,
          waiterName: data.waiterName,
          actionUrl: "/dashboard/floor",
        },
      });

      toast.success(`✅ ${waiterLabel} acknowledged the call!`, {
        id: `waiter-ack-${data.waiterId || data.tableNumber || "call"}`,
      });
    };

    const handleStaffStatusChanged = (data: StaffStatusPayload) => {
      addNotification({
        type: "STAFF_STATUS",
        title: `Staff Status Changed`,
        message: `Account status updated to ${data.isActive ? "Active (Can Log In)" : "Inactive (Deactivated)"
          }.`,
        timestamp: new Date().toISOString(),
        metadata: {
          staffId: data.userId,
          role: data.role,
          isActive: data.isActive,
          actionUrl: "/dashboard/staff",
        },
      });
    };

    socket.on("order:new", handleNewOrder);
    socket.on("order:ready", handleOrderReady);
    socket.on("order:served", handleOrderServed);
    socket.on("waiter:call", handleWaiterCall);
    socket.on("waiter:call:acknowledged", handleWaiterCallAck);
    socket.on("staff:status_changed", handleStaffStatusChanged);

    return () => {
      socket.off("order:new", handleNewOrder);
      socket.off("order:ready", handleOrderReady);
      socket.off("order:served", handleOrderServed);
      socket.off("waiter:call", handleWaiterCall);
      socket.off("waiter:call:acknowledged", handleWaiterCallAck);
      socket.off("staff:status_changed", handleStaffStatusChanged);
    };
  }, [socket, addNotification]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "UNREAD":
        return notifications.filter((n) => !n.isRead);
      case "ORDERS":
        return notifications.filter((n) =>
          ["ORDER_NEW", "ORDER_READY", "ORDER_SERVED", "ORDER_CANCELLED", "ORDER_UPDATED"].includes(
            n.type
          )
        );
      case "ALERTS":
        return notifications.filter((n) =>
          ["WAITER_CALL", "WAITER_CALL_ACK", "STAFF_STATUS"].includes(n.type)
        );
      case "ALL":
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      saveNotifications(next);
      return next;
    });
    toast.success("All notifications marked as read", { id: "mark-all-read" });
  };

  const handleClearHistory = () => {
    setNotifications([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Notification history cleared", { id: "clear-notifs" });
  };

  const handleNotificationClick = (notif: AppNotification) => {
    // Mark clicked notification as read
    if (!notif.isRead) {
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n));
        saveNotifications(next);
        return next;
      });
    }

    // Open detail modal with notification details
    setSelectedNotification({ ...notif, isRead: true });
    setIsDetailModalOpen(true);
    setIsOpen(false);
  };

  const handleOrderUpdated = (orderId: string, updatedFields: Partial<NotificationMetadata>) => {
    setNotifications((prev) => {
      const next = prev.map((n) => {
        if (n.metadata?.orderId === orderId || n.metadata?.orderNumber === orderId) {
          const newStatus = updatedFields?.status || n.metadata?.status;
          return {
            ...n,
            metadata: {
              ...n.metadata,
              ...updatedFields,
            },
            title: newStatus === "PAID" ? `Order #${n.metadata?.orderNumber} (PAID)` : n.title,
          };
        }
        return n;
      });
      saveNotifications(next);
      return next;
    });
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n));
      saveNotifications(next);
      return next;
    });

    if (selectedNotification?.id === id) {
      setSelectedNotification((prev) =>
        prev ? { ...prev, isRead: !prev.isRead } : null
      );
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "ORDER_NEW":
        return <Receipt size={16} className="text-amber-700" />;
      case "ORDER_READY":
        return <ChefHat size={16} className="text-emerald-600" />;
      case "ORDER_SERVED":
        return <CheckCircle2 size={16} className="text-indigo-600" />;
      case "ORDER_CANCELLED":
        return <AlertCircle size={16} className="text-red-600" />;
      case "WAITER_CALL":
        return <BellRing size={16} className="text-amber-600" />;
      case "WAITER_CALL_ACK":
        return <CheckCircle2 size={16} className="text-emerald-600" />;
      case "STAFF_STATUS":
        return <User size={16} className="text-stone-700" />;
      default:
        return <Receipt size={16} className="text-amber-700" />;
    }
  };

  const getTypeBackground = (type: NotificationType, isRead: boolean) => {
    if (isRead) return "bg-stone-100 text-stone-600";
    switch (type) {
      case "ORDER_NEW":
        return "bg-amber-100/80 text-amber-900 border border-amber-200/80";
      case "ORDER_READY":
        return "bg-emerald-100/80 text-emerald-900 border border-emerald-200/80";
      case "ORDER_SERVED":
        return "bg-indigo-100/80 text-indigo-900 border border-indigo-200/80";
      case "ORDER_CANCELLED":
        return "bg-red-100/80 text-red-900 border border-red-200/80";
      case "WAITER_CALL":
        return "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse";
      default:
        return "bg-amber-100/80 text-amber-900";
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className="relative p-2.5 rounded-2xl text-stone-600 hover:text-stone-900 hover:bg-amber-500/10 focus:outline-none transition-all duration-300 group cursor-pointer"
          title="Activity Notifications"
          aria-label="Activity Notifications"
        >
          <Bell
            size={20}
            className={`transition-transform duration-300 ${unreadCount > 0
              ? "group-hover:rotate-12 text-amber-800"
              : "text-stone-500"
              }`}
          />

          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center px-1 border-2 border-white shadow-md animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[340px] sm:w-[420px] rounded-3xl p-0 bg-white/95 backdrop-blur-xl border border-stone-200/90 shadow-2xl shadow-stone-900/15 overflow-hidden z-50 animate-in fade-in-50 zoom-in-95"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-4 px-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="font-bold font-cormorant text-lg text-white leading-none">
                    Notifications Center
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Live restaurant activity & alerts
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "Mute notification sounds" : "Enable notification sounds"}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-white/10 transition-colors"
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/60 hover:bg-amber-950/90 px-2.5 py-1 rounded-lg border border-amber-500/30 transition-colors"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-stone-950/60 rounded-xl border border-stone-700/50 text-[11px]">
              {(
                [
                  { id: "ALL", label: `All (${notifications.length})` },
                  { id: "UNREAD", label: `Unread (${unreadCount})` },
                  { id: "ORDERS", label: "Orders" },
                  { id: "ALERTS", label: "Alerts" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold transition-all text-center ${activeTab === tab.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-stone-400 hover:text-stone-200"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification List Container */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100 bg-white">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
                  <Sparkles size={20} />
                </div>
                <p className="font-bold text-stone-800 text-sm">No notifications found</p>
                <p className="text-stone-400 text-xs mt-0.5">
                  {activeTab === "UNREAD"
                    ? "You're all caught up! No unread alerts."
                    : "Live orders and floor alerts will appear here."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3.5 px-4.5 flex items-start gap-3 cursor-pointer transition-all duration-200 group ${notif.isRead
                    ? "bg-white hover:bg-stone-50/90 opacity-90"
                    : "bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-amber-600"
                    }`}
                >
                  {/* Left Avatar / Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${getTypeBackground(
                      notif.type,
                      notif.isRead
                    )}`}
                  >
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Body details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${notif.isRead
                          ? "font-semibold text-stone-800"
                          : "font-bold text-stone-950"
                          }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-stone-400 font-medium shrink-0">
                        {formatRelativeTime(notif.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Metadata tags: Table, Amount & Payment Status */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                      {notif.metadata?.tableNumber && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-md">
                          <Armchair size={10} /> Table {notif.metadata.tableNumber}
                        </span>
                      )}
                      {notif.metadata?.totalAmount !== undefined && (
                        <span className="text-[10px] font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded-md">
                          ₹{Number(notif.metadata.totalAmount).toFixed(2)}
                        </span>
                      )}
                      {/* Payment Status Pill */}
                      {notif.metadata?.orderNumber && (() => {
                        const paid = isOrderPaid(notif.metadata);
                        return (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${paid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100/90 text-amber-800 border border-amber-200"
                            }`}>
                            {paid ? (
                              <>💳 Paid {notif.metadata?.paymentMethod ? `(${notif.metadata.paymentMethod})` : ""}</>
                            ) : (
                              <>⏳ Unpaid</>
                            )}
                          </span>
                        );
                      })()}
                      <span className="text-[10px] text-amber-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        Click to view →
                      </span>
                    </div>
                  </div>

                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-600 shrink-0 mt-1 shadow-xs"
                      title="Unread"
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 px-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span>{notifications.length} notifications saved in history</span>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-stone-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                title="Clear notification history"
              >
                <Trash2 size={12} />
                <span>Clear history</span>
              </button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Details Modal for Clicked Notification */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNotification(null);
        }}
        onToggleRead={handleToggleRead}
        onOrderUpdated={handleOrderUpdated}
      />
    </>
  );
}
