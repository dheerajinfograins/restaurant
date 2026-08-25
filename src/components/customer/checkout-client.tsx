"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  FileText,
  QrCode,
  User,
  Banknote,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Receipt,
  Utensils,
  ArrowRight,
  ScanLine,
  Smartphone,
  TicketPercent,
  Tag,
  Loader2,
  Check,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useCartStore, type CartItem } from "@/store/cart-store";
import {
  createOrderAction,
  createRazorpayOrderAction,
  verifyAndCreateRazorpayOrderAction,
} from "@/app/(customer)/checkout/actions";
import type { PaymentMethod } from "@prisma/client";
import toast from "react-hot-toast";

export interface AppliedCouponInfo {
  couponId: string;
  code: string;
  discountAmount: number;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  couponType: string;
  message: string;
}

export interface PublicCouponItem {
  id: string;
  code: string;
  description?: string | null;
  couponType: string;
  discountType: string;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayOptions {
  key?: string;
  amount?: string | number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function EmptyCartView({ onReturn }: Readonly<{ onReturn: () => void }>) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center animate-in fade-in-50 duration-300">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200/80 rounded-3xl flex items-center justify-center text-amber-800 mb-4 border border-amber-300 shadow-sm">
        <Sparkles size={36} />
      </div>
      <h1 className="text-2xl font-bold font-cormorant text-stone-900 mb-2">
        Your Cart is Empty
      </h1>
      <p className="text-stone-500 mb-6 text-xs max-w-xs leading-relaxed">
        Please choose some delicious dishes from our menu before proceeding to checkout.
      </p>
      <button
        type="button"
        onClick={onReturn}
        className="px-8 py-3.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-amber-900/20 active:scale-95 transition-all cursor-pointer"
      >
        Explore Menu
      </button>
    </div>
  );
}



function FoodTypeDot({ foodType }: Readonly<{ foodType?: string }>) {
  if (foodType === "VEG") {
    return (
      <div className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Pure Veg">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      </div>
    );
  }
  if (foodType === "NON_VEG") {
    return (
      <div className="w-3.5 h-3.5 border border-rose-600 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Non-Veg">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
      </div>
    );
  }
  return (
    <div className="w-3.5 h-3.5 border border-amber-600 flex items-center justify-center rounded-xs shrink-0 bg-white" title="Egg">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-600" />
    </div>
  );
}

function UpiPaymentView({
  upiQrPayload,
  total,
  restaurantName,
}: Readonly<{
  upiQrPayload: string;
  total: number;
  restaurantName?: string | null;
}>) {
  return (
    <div className="pt-2 animate-in fade-in zoom-in-95 duration-200 space-y-4">
      <div className="bg-gradient-to-b from-purple-50 via-white to-purple-50/40 border-2 border-purple-300/80 rounded-3xl p-5 text-center shadow-md relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 border border-purple-200 text-purple-900 rounded-full text-xs font-bold mb-3 shadow-2xs">
          <ScanLine size={13} className="text-purple-600" />
          <span>Scan QR Code to Pay</span>
        </div>

        <p className="text-xs font-bold text-stone-800 mb-3">
          Scan via Google Pay, PhonePe, Paytm, BHIM or any UPI App
        </p>

        <div className="bg-white p-4.5 rounded-3xl border-2 border-dashed border-purple-300 shadow-lg mx-auto w-[220px] h-[220px] flex flex-col items-center justify-center relative transition-transform hover:scale-[1.02]">
          <QRCode
            value={upiQrPayload}
            size={180}
            level="H"
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>

        <div className="mt-3.5 space-y-1">
          <div className="font-mono text-xl font-black text-purple-950">
            ₹{total.toFixed(2)}
          </div>
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            {restaurantName || "The Daily Grind & Gather"}
          </p>
        </div>

        <div className="pt-3 border-t border-purple-100 flex items-center justify-center gap-2 text-[10px] text-stone-500 font-semibold flex-wrap">
          <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">GPay</span>
          <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">PhonePe</span>
          <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">Paytm</span>
          <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">BHIM UPI</span>
        </div>
      </div>

      <div className="p-3 bg-purple-100/70 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs text-purple-950">
        <Smartphone size={18} className="text-purple-700 shrink-0" />
        <span className="leading-tight text-[11px]">
          Ordering from this phone? Tap <strong>&quot;Pay ₹{total.toFixed(2)} via UPI&quot;</strong> below to pay directly in your UPI app!
        </span>
      </div>
    </div>
  );
}

function CashPaymentView({ total }: Readonly<{ total: number }>) {
  return (
    <div className="pt-2 animate-in fade-in duration-200">
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 text-center space-y-2.5 shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-2xl">
          💵
        </div>
        <h3 className="text-base font-bold text-emerald-950 font-cormorant">
          Pay Cash at Table / Counter
        </h3>
        <p className="text-xs text-emerald-800/80 max-w-xs mx-auto leading-relaxed">
          No online transaction needed. Place your order now and hand cash to the waiter or cashier.
        </p>
        <div className="pt-1">
          <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-full border border-emerald-200 shadow-2xs inline-block font-mono">
            Payable: ₹{total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CardPaymentView({ total }: Readonly<{ total: number }>) {
  return (
    <div className="pt-2 animate-in fade-in duration-200 space-y-3">
      <div className="bg-gradient-to-tr from-stone-900 via-slate-900 to-stone-950 text-white rounded-3xl p-5 border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
              Razorpay Secured Card
            </span>
            <h4 className="text-sm font-bold font-cormorant mt-0.5">
              Debit / Credit Card (Visa, Mastercard, RuPay)
            </h4>
          </div>
          <div className="w-9 h-6 rounded-md bg-amber-400/80 border border-amber-300/60 flex items-center justify-center">
            <span className="text-[9px] font-black text-stone-900 tracking-tighter">CHIP</span>
          </div>
        </div>

        <div className="text-base font-mono tracking-widest text-stone-300 mb-4">
          •••• •••• •••• ••••
        </div>

        <div className="flex justify-between items-end text-xs">
          <div>
            <span className="text-[9px] text-stone-400 block uppercase">Gateway</span>
            <span className="font-bold tracking-wider text-amber-300">RAZORPAY 256-BIT</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-stone-400 block uppercase">Total</span>
            <span className="font-mono font-bold text-sm text-white">₹{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-[11px] text-blue-950 flex items-center gap-2">
        <ShieldCheck size={16} className="text-blue-600 shrink-0" />
        <span>Card payments are securely processed via Razorpay RBI-compliant gateway.</span>
      </div>
    </div>
  );
}

function getButtonThemeClass(paymentMethod: PaymentMethod): string {
  if (paymentMethod === "UPI") {
    return "bg-gradient-to-r from-purple-700 via-indigo-800 to-purple-900 hover:from-purple-600 hover:to-purple-800 text-white shadow-purple-900/25";
  }
  if (paymentMethod === "CASH") {
    return "bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 hover:from-emerald-600 hover:to-emerald-800 text-white shadow-emerald-900/25";
  }
  return "bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 hover:from-blue-600 hover:to-blue-800 text-white shadow-blue-900/25";
}

function ButtonContent({
  isLoading,
  paymentMethod,
  total,
}: Readonly<{
  isLoading: boolean;
  paymentMethod: PaymentMethod;
  total: number;
}>) {
  if (isLoading) {
    return (
      <span className="flex items-center gap-2">
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>Processing Order...</span>
      </span>
    );
  }

  if (paymentMethod === "UPI") {
    return (
      <>
        <Zap size={16} className="text-amber-300" />
        <span>Pay ₹{total.toFixed(2)} via UPI</span>
        <ArrowRight size={15} />
      </>
    );
  }

  if (paymentMethod === "CARD") {
    return (
      <>
        <CreditCard size={16} />
        <span>Pay via Card (Razorpay)</span>
        <ArrowRight size={15} />
      </>
    );
  }

  return (
    <>
      <Banknote size={16} />
      <span>Place Order (Cash)</span>
      <ArrowRight size={15} />
    </>
  );
}

function validateCustomerDetails(name: string, phone: string): string | null {
  if (!name.trim()) {
    return "Please enter your name";
  }
  const cleanPhone = phone.trim().replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    return "Please enter a valid 10-digit mobile number";
  }
  return null;
}

interface ProcessRazorpayParams {
  total: number;
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
  restaurantName?: string | null;
  name: string;
  cleanPhone: string;
  notes: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  restaurantId: string;
  tableId: string;
  setActiveOrderId: (id: string) => void;
  clearCart: () => void;
  onSuccess: (targetUrl: string) => void;
  onError: (msg: string) => void;
  onFinish: () => void;
}

async function processRazorpayPayment(params: ProcessRazorpayParams) {
  try {
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded || !window.Razorpay) {
      params.onError("Failed to load payment window. Please check your internet.");
      params.onFinish();
      return;
    }

    const razorpayOrder = await createRazorpayOrderAction(params.total);
    if (!razorpayOrder.success || !razorpayOrder.orderId) {
      params.onError(razorpayOrder.error || "Failed to initialize payment gateway.");
      params.onFinish();
      return;
    }

    const options: RazorpayOptions = {
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: params.restaurantName || "The Daily Grind & Gather",
      description: `Dining Order for ${params.name.trim()}`,
      image: "/images/logo.png",
      order_id: razorpayOrder.orderId,
      prefill: {
        name: params.name.trim(),
        contact: params.cleanPhone,
      },
      theme: {
        color: "#92400e",
      },
      handler: async (response: RazorpayResponse) => {
        toast.loading("Verifying your payment...", { id: "razorpay-verify" });
        const result = await verifyAndCreateRazorpayOrderAction({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          restaurantId: params.restaurantId,
          tableId: params.tableId,
          customerName: params.name.trim(),
          customerPhone: params.cleanPhone,
          notes: params.notes.trim(),
          items: params.items.map((i: CartItem) => ({
            id: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
          totalAmount: params.total,
          discountAmount: params.discountAmount,
          couponCode: params.couponCode,
          couponId: params.couponId,
          paymentMethod: params.paymentMethod,
        });

        toast.dismiss("razorpay-verify");

        if (result.success && result.orderId) {
          params.setActiveOrderId(result.orderId);
          params.clearCart();
          toast.success("Payment Received & Order Placed Successfully! 🎉", {
            id: "razorpay-success",
            duration: 5000,
          });
          const targetMenuUrl = params.tableId ? `/menu/${params.tableId}` : "/";
          params.onSuccess(targetMenuUrl);
        } else {
          params.onError(
            result.error || "Payment verification failed. Please check with staff."
          );
          params.onFinish();
        }
      },
      modal: {
        ondismiss: () => {
          params.onFinish();
          toast("Payment window closed.", { icon: "ℹ️" });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: RazorpayFailureResponse) => {
      params.onFinish();
      params.onError(
        response.error?.description || "Payment failed. Please try again."
      );
    });
    rzp.open();
  } catch (err) {
    console.error("Razorpay Flow Error:", err);
    params.onError("Failed to initiate online payment.");
    params.onFinish();
  }
}

interface ProcessCashParams {
  restaurantId: string;
  tableId: string;
  name: string;
  cleanPhone: string;
  notes: string;
  items: CartItem[];
  total: number;
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
  setActiveOrderId: (id: string) => void;
  clearCart: () => void;
  onSuccess: (targetUrl: string) => void;
  onError: (msg: string) => void;
  onFinish: () => void;
}

async function processCashPayment(params: ProcessCashParams) {
  try {
    let formattedNotes = params.notes.trim()
      ? `${params.notes.trim()} | [Payment: Cash at Table/Counter]`
      : `[Payment: Cash at Table/Counter]`;

    if (params.couponCode) {
      formattedNotes += ` | [Coupon: ${params.couponCode} (-₹${(params.discountAmount || 0).toFixed(2)})]`;
    }

    const result = await createOrderAction({
      restaurantId: params.restaurantId,
      tableId: params.tableId,
      customerName: params.name.trim(),
      customerPhone: params.cleanPhone,
      notes: formattedNotes,
      items: params.items.map((i: CartItem) => ({
        id: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
      totalAmount: params.total,
      discountAmount: params.discountAmount,
      couponCode: params.couponCode,
      couponId: params.couponId,
      status: "PENDING",
      paymentMethod: "CASH",
    });

    params.onFinish();

    if (result.success && result.orderId) {
      params.setActiveOrderId(result.orderId);
      params.clearCart();
      toast.success("Order Placed Successfully! 🎉 Pay cash to waiter.", {
        duration: 5000,
      });
      const targetMenuUrl = params.tableId ? `/menu/${params.tableId}` : "/";
      params.onSuccess(targetMenuUrl);
    } else {
      params.onError(result.error || "Failed to place order.");
    }
  } catch (err) {
    console.error("Cash Order Error:", err);
    params.onFinish();
    params.onError("Something went wrong while placing your order.");
  }
}

export function CheckoutClient() {
  const router = useRouter();
  const {
    items,
    getTotalPrice,
    clearCart,
    restaurantId,
    tableId,
    restaurantName,
    setActiveOrderId,
  } = useCartStore();

  // Contact Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponInfo | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<PublicCouponItem[]>([]);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [showAvailableOffers, setShowAvailableOffers] = useState(false);

  // Payment Method: UPI (Razorpay), CASH, CARD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Cooking Request Chips
  const quickNotesSuggestions = [
    "🌶️ Extra Spicy",
    "🌿 Less Spicy",
    "🥄 Bring Cutlery",
    "🧈 Less Oil / Butter",
    "🧊 Less Ice in Drinks",
  ];

  // Pre-load Razorpay script on mount
  useEffect(() => {
    void loadRazorpayScript();
  }, []);

  // Fetch Available Public Coupons for this Restaurant
  useEffect(() => {
    if (restaurantId) {
      axios
        .get(`/api/coupons?restaurantId=${restaurantId}&public=true`)
        .then((res) => {
          setAvailableCoupons(res.data?.data || []);
        })
        .catch((err) => console.error("Failed to load available coupons:", err));
    }
  }, [restaurantId]);

  if (items.length === 0) {
    return (
      <EmptyCartView
        onReturn={() => router.push(tableId ? `/menu/${tableId}` : "/")}
      />
    );
  }

  const subtotal = getTotalPrice();
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxes = discountedSubtotal * 0.05;
  const total = discountedSubtotal + taxes;
  const totalItemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Apply Coupon Handler
  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!targetCode) {
      toast.error("Please enter a coupon code");
      return;
    }

    if (!restaurantId) {
      toast.error("Restaurant context is missing");
      return;
    }

    setIsValidatingCoupon(true);

    try {
      const res = await axios.post("/api/coupons/validate", {
        code: targetCode,
        restaurantId,
        subtotal,
        items: items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
      });

      const couponData = res.data?.data;
      if (couponData?.isValid) {
        setAppliedCoupon({
          couponId: couponData.couponId,
          code: couponData.code,
          discountAmount: couponData.discountAmount,
          discountType: couponData.discountType,
          discountValue: couponData.discountValue,
          couponType: couponData.couponType,
          message: couponData.message,
        });
        setCouponCodeInput(targetCode);
        toast.success(`🎉 ${couponData.message}`, { duration: 4000 });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Invalid coupon code for this order.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    toast("Coupon removed", { icon: "ℹ️" });
  };

  // Dynamic UPI Intent string for QR code
  const upiQrPayload = `upi://pay?pa=dailygrind.rzp@icici&pn=${encodeURIComponent(
    restaurantName || "The Daily Grind & Gather"
  )}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order for ${name || "Guest"}`
  )}`;

  const handleAddQuickNote = (suggestion: string) => {
    if (!notes.includes(suggestion)) {
      setNotes((prev) => (prev ? `${prev}, ${suggestion}` : suggestion));
    }
  };

  const handlePlaceOrder = async () => {
    const validationError = validateCustomerDetails(name, phone);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, "");
    setIsLoading(true);

    const commonParams = {
      restaurantId: restaurantId!,
      tableId: tableId!,
      name,
      cleanPhone,
      notes,
      items,
      total,
      discountAmount,
      couponCode: appliedCoupon?.code,
      couponId: appliedCoupon?.couponId,
      setActiveOrderId,
      clearCart,
      onSuccess: (url: string) => router.push(url),
      onError: (msg: string) => toast.error(msg),
      onFinish: () => setIsLoading(false),
    };

    if (paymentMethod === "CASH") {
      await processCashPayment(commonParams);
      return;
    }

    await processRazorpayPayment({
      ...commonParams,
      restaurantName,
      paymentMethod,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pb-36 animate-in fade-in-50 duration-300">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200 transition-all active:scale-95 shrink-0 cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold font-cormorant text-stone-900 leading-tight">
              Checkout & Payment
            </h1>
            <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              {restaurantName || "The Daily Grind & Gather"}
            </p>
          </div>
        </div>

        <div className="bg-amber-100/80 border border-amber-200/90 px-2.5 py-1 rounded-full text-xs font-bold text-amber-900 flex items-center gap-1 shadow-2xs shrink-0">
          <Receipt size={12} className="text-amber-700" />
          <span>{totalItemCount} {totalItemCount === 1 ? "item" : "items"}</span>
        </div>
      </header>

      {/* Progress Stepper Bar */}
      <div className="bg-white/80 border-b border-stone-200/60 px-4 py-2.5 flex items-center justify-between text-[11px] font-medium text-stone-400">
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <CheckCircle2 size={13} />
          <span>1. Cart</span>
        </div>
        <span className="text-stone-300">──</span>
        <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
          <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-bold">2</span>
          <span>Payment</span>
        </div>
        <span className="text-stone-300">──</span>
        <div className="flex items-center gap-1 text-stone-400">
          <span>3. Live Kitchen</span>
        </div>
      </div>

      {/* Main Content Stack */}
      <div className="p-4 space-y-4">
        {/* ================================================================= */}
        {/* 1. CUSTOMER INFORMATION CARD */}
        {/* ================================================================= */}
        <section className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <User size={15} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-stone-900 font-cormorant leading-none">
                1. Customer Details
              </h2>
              <p className="text-[10px] text-stone-400">For table service & order tracking</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="mobile-customer-name" className="text-xs font-bold text-stone-700 block mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User size={15} className="absolute left-3.5 text-stone-400" />
                <input
                  id="mobile-customer-name"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-600 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mobile-customer-phone" className="text-xs font-bold text-stone-700 block mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-stone-600 border-r border-stone-300 pr-2">
                  <span>🇮🇳 +91</span>
                </div>
                <input
                  id="mobile-customer-phone"
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-20 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-600 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mobile-customer-notes" className="text-xs font-bold text-stone-700 block mb-1">
                Special Cooking Instructions (Optional)
              </label>
              <div className="relative flex items-center mb-2">
                <FileText size={15} className="absolute left-3.5 text-stone-400" />
                <input
                  id="mobile-customer-notes"
                  type="text"
                  placeholder="e.g. Extra spicy, less oil, bring spoons"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-600 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400 font-medium"
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickNotesSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleAddQuickNote(suggestion)}
                    className="text-[10px] font-semibold text-stone-600 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 px-2 py-1 rounded-lg border border-stone-200 transition-all cursor-pointer active:scale-95"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* 2. PROMOTIONS & COUPONS CARD */}
        {/* ================================================================= */}
        <section className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <TicketPercent size={15} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-stone-900 font-cormorant leading-none">
                  Coupons & Offers
                </h2>
                <p className="text-[10px] text-stone-400">Apply promo codes for extra savings</p>
              </div>
            </div>

            {appliedCoupon ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check size={11} /> Saved ₹{appliedCoupon.discountAmount.toFixed(2)}
              </span>
            ) : availableCoupons.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowAvailableOffers(!showAvailableOffers)}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
              >
                <span>{availableCoupons.length} Offers Available</span>
                {showAvailableOffers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            ) : null}
          </div>

          {/* Applied Coupon Display */}
          {appliedCoupon ? (
            <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-emerald-950">
                      {appliedCoupon.code}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-white px-1.5 py-0.2 rounded border border-emerald-200">
                      Applied
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    You saved ₹{appliedCoupon.discountAmount.toFixed(2)} on this order!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            /* Input Box to Apply Coupon */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. FEAST1200)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono tracking-wider outline-none focus:border-amber-600 focus:bg-white transition-all text-stone-900 font-bold"
                  />
                </div>
                <button
                  type="button"
                  disabled={isValidatingCoupon || !couponCodeInput.trim()}
                  onClick={() => handleApplyCoupon()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-amber-300 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {isValidatingCoupon ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
                </button>
              </div>

              {/* Available Coupons Dropdown / List */}
              {showAvailableOffers && availableCoupons.length > 0 && (
                <div className="pt-2 space-y-1.5 border-t border-stone-100 max-h-48 overflow-y-auto pr-1 animate-in fade-in duration-200">
                  <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Tap to apply offer:
                  </p>
                  {availableCoupons.map((c) => {
                    const isMinThresholdNotMet = (c.minOrderAmount || 0) > subtotal;
                    const shortfall = ((c.minOrderAmount || 0) - subtotal).toFixed(2);

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleApplyCoupon(c.code)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${isMinThresholdNotMet
                          ? "bg-stone-50 border-stone-200 opacity-75 hover:opacity-100"
                          : "bg-amber-50/50 border-amber-200 hover:bg-amber-100/60"
                          }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-amber-950 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                              {c.code}
                            </span>
                            <span className="text-[11px] font-bold text-stone-800">
                              {c.discountType === "PERCENTAGE" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            {c.description || (c.minOrderAmount ? `Min order ₹${c.minOrderAmount}` : "Special discount")}
                          </p>
                          {isMinThresholdNotMet && (
                            <p className="text-[9px] text-amber-700 font-semibold mt-0.5">
                              ⚠️ Add ₹{shortfall} more to unlock
                            </p>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-amber-800 underline">
                          Apply
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* 3. ORDER ITEMS & BILL BREAKDOWN */}
        {/* ================================================================= */}
        <section className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
          <button
            type="button"
            onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
            className="w-full flex items-center justify-between pb-2.5 border-b border-stone-100 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Utensils size={15} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-stone-900 font-cormorant leading-none">
                  3. Order Summary ({items.length})
                </h2>
                <p className="text-[10px] text-stone-400">Click to {isOrderSummaryOpen ? "hide" : "view"} bill breakdown</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="font-mono font-bold text-xs text-stone-900">
                ₹{total.toFixed(2)}
              </span>
              {isOrderSummaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {isOrderSummaryOpen && (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
              {/* Item Rows */}
              <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <FoodTypeDot foodType={item.foodType} />
                      <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md text-[11px] shrink-0">
                        {item.quantity}x
                      </span>
                      <span className="font-medium text-stone-800 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-stone-900 shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bill Breakdown */}
              <div className="pt-3 border-t border-stone-200/80 space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="font-mono text-stone-900">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-1 rounded-lg">
                    <span className="flex items-center gap-1">
                      <span>🎟️ Coupon ({appliedCoupon.code})</span>
                    </span>
                    <span className="font-mono font-bold">-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-500">GST Taxes (5%)</span>
                  <span className="font-mono text-stone-800">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold text-stone-950">
                  <span className="text-stone-900">Grand Total</span>
                  <span className="font-mono text-base text-amber-900 font-bold">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* 3. SELECT PAYMENT METHOD & BIG CENTERED QR CODE */}
        {/* ================================================================= */}
        <section className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <CreditCard size={15} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-stone-900 font-cormorant leading-none">
                  3. Select Payment Mode
                </h2>
                <p className="text-[10px] text-stone-400">Choose your preferred payment method</p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={11} /> Razorpay Safe
            </span>
          </div>

          {/* 3 Payment Mode Tabs */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("UPI")}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === "UPI"
                ? "bg-purple-50/90 border-purple-600 text-purple-950 shadow-xs ring-2 ring-purple-600/20"
                : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
            >
              <QrCode
                size={20}
                className={paymentMethod === "UPI" ? "text-purple-600" : "text-stone-400"}
              />
              <span className="text-xs font-bold leading-tight">UPI / QR</span>
              <span className="text-[9px] text-purple-700 font-bold bg-purple-100 px-1.5 rounded-sm">Instant</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === "CASH"
                ? "bg-emerald-50/90 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-600/20"
                : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
            >
              <Banknote
                size={20}
                className={paymentMethod === "CASH" ? "text-emerald-600" : "text-stone-400"}
              />
              <span className="text-xs font-bold leading-tight">Pay Cash</span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100 px-1.5 rounded-sm">At Table</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${paymentMethod === "CARD"
                ? "bg-blue-50/90 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-600/20"
                : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
            >
              <CreditCard
                size={20}
                className={paymentMethod === "CARD" ? "text-blue-600" : "text-stone-400"}
              />
              <span className="text-xs font-bold leading-tight">Card</span>
              <span className="text-[9px] text-blue-700 font-bold bg-blue-100 px-1.5 rounded-sm">Online</span>
            </button>
          </div>

          {paymentMethod === "UPI" && (
            <UpiPaymentView
              upiQrPayload={upiQrPayload}
              total={total}
              restaurantName={restaurantName}
            />
          )}

          {paymentMethod === "CASH" && <CashPaymentView total={total} />}

          {paymentMethod === "CARD" && <CardPaymentView total={total} />}
        </section>
      </div>

      {/* ================================================================= */}
      {/* 4. FIXED BOTTOM ACTION BAR */}
      {/* ================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-2xl p-3.5">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] text-stone-400 font-bold uppercase block tracking-wider leading-none">
              To Pay
            </span>
            <span className="text-lg font-bold font-mono text-stone-950 leading-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handlePlaceOrder}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${getButtonThemeClass(
              paymentMethod
            )}`}
          >
            <ButtonContent
              isLoading={isLoading}
              paymentMethod={paymentMethod}
              total={total}
            />
          </button>
        </div>

        <div className="max-w-md mx-auto text-center pt-1.5">
          <span className="text-[10px] text-stone-400 flex items-center justify-center gap-1 font-medium">
            <Lock size={10} className="text-emerald-600" />
            <span>Secure 256-Bit Encrypted • Powered by Razorpay</span>
          </span>
        </div>
      </div>
    </div>
  );
}
