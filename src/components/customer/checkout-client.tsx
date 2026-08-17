"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle, 
  FileText, 
  Phone, 
  QrCode, 
  User, 
  X, 
  Banknote, 
  CreditCard, 
  Lock, 
  Calendar, 
  ShieldCheck, 
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { createOrderAction } from "@/app/(customer)/checkout/actions";
import type { OrderStatus, PaymentMethod } from "@prisma/client";
import toast from "react-hot-toast";

export function CheckoutClient() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, restaurantId, tableId, restaurantName, setActiveOrderId } = useCartStore();

  // Contact Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");

  // UPI Specific State
  const [upiIdOrNumber, setUpiIdOrNumber] = useState("");

  // Card Specific State
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center animate-in fade-in-50 duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold font-cormorant text-culinary-text mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6 text-xs sm:text-sm">Add some delicious dishes from our menu first.</p>
        <button
          type="button"
          onClick={() => router.push(tableId ? `/menu/${tableId}` : "/")}
          className="px-8 py-3.5 bg-culinary-primary hover:bg-culinary-primary/90 text-white rounded-2xl font-bold text-sm shadow-md shadow-culinary-primary/25 active:scale-95 transition-all"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const taxes = subtotal * 0.05;
  const total = subtotal + taxes;

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  // Format Expiry Date (MM/YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setCardExpiry(raw);
  };

  // Format CVC
  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvc(raw);
  };

  const handlePlaceOrder = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // UPI Validation
    if (paymentMethod === "UPI") {
      if (!upiIdOrNumber.trim()) {
        toast.error("Please enter your UPI ID or Mobile number");
        return;
      }
    }

    // Card Validation
    if (paymentMethod === "CARD") {
      if (!cardHolder.trim()) {
        toast.error("Please enter the cardholder name");
        return;
      }
      const rawDigits = cardNumber.replace(/\s/g, "");
      if (rawDigits.length < 15) {
        toast.error("Please enter a valid 16-digit card number");
        return;
      }
      if (cardExpiry.length < 5) {
        toast.error("Please enter card expiry date (MM/YY)");
        return;
      }
      if (cardCvc.length < 3) {
        toast.error("Please enter 3-digit CVV/CVC");
        return;
      }
    }

    setIsLoading(true);

    // Build structured payment notes for Admin & Kitchen
    let structuredNotes = notes.trim();
    if (paymentMethod === "UPI") {
      const upiNote = `[UPI Payment: ${upiIdOrNumber.trim()}]`;
      structuredNotes = structuredNotes ? `${structuredNotes} | ${upiNote}` : upiNote;
    } else if (paymentMethod === "CARD") {
      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      const cardNote = `[Card Payment: Holder ${cardHolder.trim()} (Ending ****${last4}) Exp ${cardExpiry}]`;
      structuredNotes = structuredNotes ? `${structuredNotes} | ${cardNote}` : cardNote;
    } else if (paymentMethod === "CASH") {
      const cashNote = `[Cash Payment: Pay at Table / Counter]`;
      structuredNotes = structuredNotes ? `${structuredNotes} | ${cashNote}` : cashNote;
    }

    // Status: If UPI or Card paid -> MARK AS "PAID" or "PENDING"
    const orderStatus: OrderStatus = paymentMethod === "CASH" ? "PENDING" : "PAID";

    const result = await createOrderAction({
      restaurantId: restaurantId!,
      tableId: tableId!,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      notes: structuredNotes,
      items: items.map((i: CartItem) => ({ id: i.id, quantity: i.quantity, price: i.price })),
      totalAmount: total,
      status: orderStatus,
      paymentMethod: paymentMethod,
    });

    setIsLoading(false);

    if (result.success && result.orderId) {
      toast.success(
        paymentMethod === "CASH"
          ? "Order placed! You can pay cash at table."
          : "Payment verified! Order placed successfully."
      );
      setActiveOrderId(result.orderId);
      clearCart();
      router.push(`/order/${result.orderId}`);
    } else {
      toast.error(result.error || "Failed to place order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-36 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-2xl bg-amber-50 hover:bg-amber-100 text-culinary-primary flex items-center justify-center border border-amber-200/70 transition-all active:scale-95 shadow-2xs"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold font-cormorant text-culinary-text leading-tight">Checkout</h1>
            <p className="text-[11px] text-gray-500 font-medium">Select payment & finalize order</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Bill</span>
          <span className="text-base font-black text-culinary-primary font-cormorant">
            ₹{total.toFixed(2)}
          </span>
        </div>
      </header>

      <main className="px-5 pt-5 space-y-5">
        {/* Customer Details */}
        <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-100 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-culinary-text text-xs sm:text-sm uppercase tracking-wider text-gray-700">
              Customer Details
            </h2>
            <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              Required
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative flex items-center">
              <User className="absolute left-4 text-amber-700/60" size={17} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200/80 focus:border-culinary-primary focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900"
              />
            </div>

            <div className="relative flex items-center">
              <Phone className="absolute left-4 text-amber-700/60" size={17} />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200/80 focus:border-culinary-primary focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900"
              />
            </div>
          </div>
        </section>

        {/* Payment Method Selector */}
        <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-culinary-text text-xs sm:text-sm uppercase tracking-wider text-gray-700">
              Choose Payment Method
            </h2>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              Instant Sync
            </span>
          </div>

          {/* 3 Payment Tabs: UPI, Cash, Card */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* UPI Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("UPI")}
              className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "UPI"
                  ? "border-purple-500 bg-purple-50/70 text-purple-950 ring-2 ring-purple-500/20 font-bold shadow-xs scale-[1.02]"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <QrCode size={22} className={paymentMethod === "UPI" ? "text-purple-600" : "text-gray-400"} />
              <span className="text-xs">UPI QR</span>
            </button>

            {/* Cash Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "CASH"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs scale-[1.02]"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <Banknote size={22} className={paymentMethod === "CASH" ? "text-emerald-600" : "text-gray-400"} />
              <span className="text-xs">Pay Cash</span>
            </button>

            {/* Card Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD")}
              className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                paymentMethod === "CARD"
                  ? "border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 font-bold shadow-xs scale-[1.02]"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <CreditCard size={22} className={paymentMethod === "CARD" ? "text-blue-600" : "text-gray-400"} />
              <span className="text-xs">Debit / Card</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB CONTENT 1: UPI PAYMENT (QR CODE + UPI NUMBER/ID INPUT) */}
          {/* ========================================================================= */}
          {paymentMethod === "UPI" && (
            <div className="pt-2 space-y-4 animate-in fade-in duration-200">
              <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-1 text-purple-900 text-xs font-bold">
                  <QrCode size={14} className="text-purple-600" />
                  <span>Scan QR & Enter UPI ID</span>
                </div>

                {/* QR Code Container */}
                <div className="bg-white border-2 border-dashed border-purple-300 rounded-2xl p-4 flex flex-col items-center justify-center mx-auto w-40 h-40 relative shadow-xs">
                  <QrCode size={96} className="text-gray-900" />
                  <span className="text-[10px] font-bold text-purple-700 mt-1 uppercase tracking-wider">
                    {restaurantName || "Daily Grind"}
                  </span>
                </div>

                <p className="text-[11px] text-purple-800/80 font-medium">
                  Scan via GPay, PhonePe, Paytm, BHIM or any UPI App
                </p>
              </div>

              {/* UPI ID / Mobile Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span>Enter UPI ID or Mobile Number</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <QrCode className="absolute left-4 text-purple-600" size={17} />
                  <input
                    type="text"
                    placeholder="e.g. yourname@okaxis or 9876543210"
                    value={upiIdOrNumber}
                    onChange={(e) => setUpiIdOrNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/80 border border-gray-200/80 focus:border-purple-500 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900 font-medium"
                  />
                </div>
                <p className="text-[10px] text-gray-400">
                  This transaction ID/number is sent directly to the Admin payments dashboard.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB CONTENT 2: CASH PAYMENT (SIMPLE AT TABLE/COUNTER) */}
          {/* ========================================================================= */}
          {paymentMethod === "CASH" && (
            <div className="pt-2 animate-in fade-in duration-200">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-2xl">
                  💵
                </div>
                <h3 className="text-base font-bold text-emerald-950 font-cormorant">
                  Pay Cash at Table / Counter
                </h3>
                <p className="text-xs text-emerald-800/80 max-w-xs mx-auto leading-relaxed">
                  No online transaction needed. Place your order now and hand cash to the waiter or cashier when your meal arrives.
                </p>
                <div className="pt-2">
                  <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1 rounded-full border border-emerald-200 shadow-2xs inline-block">
                    Payable Amount: ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB CONTENT 3: CARD PAYMENT (CARDHOLDER, NUMBER, EXPIRY, CVC) */}
          {/* ========================================================================= */}
          {paymentMethod === "CARD" && (
            <div className="pt-2 space-y-4 animate-in fade-in duration-200">
              {/* Virtual Credit Card Preview */}
              <div className="rounded-2xl p-5 bg-gradient-to-tr from-stone-900 via-gray-900 to-slate-800 text-white shadow-md border border-gray-700 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                      Debit / Credit Card
                    </span>
                    <h4 className="text-sm font-bold font-cormorant mt-0.5">
                      {restaurantName || "The Culinary Ledger"}
                    </h4>
                  </div>
                  <div className="w-9 h-6 rounded bg-amber-400/80 border border-amber-300/60 flex items-center justify-center">
                    <span className="text-[9px] font-black text-stone-900 tracking-tighter">CHIP</span>
                  </div>
                </div>

                <div className="text-lg font-mono tracking-widest mb-4">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                <div className="flex justify-between items-end text-xs">
                  <div>
                    <span className="text-[9px] text-gray-400 block uppercase">Card Holder</span>
                    <span className="font-bold tracking-wider uppercase">
                      {cardHolder || "YOUR NAME"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 block uppercase">Expires</span>
                    <span className="font-mono font-bold">{cardExpiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>

              {/* Card Inputs Form */}
              <div className="space-y-3">
                {/* Holder Name */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Cardholder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Name printed on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200/80 focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900 uppercase font-medium"
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Card Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-4 text-blue-600" size={17} />
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900 font-mono tracking-wider font-semibold"
                    />
                  </div>
                </div>

                {/* Expiry Date & CVC / CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="absolute left-3.5 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        className="w-full pl-10 pr-3 py-3 bg-gray-50/80 border border-gray-200/80 focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900 font-mono text-center font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      CVV / CVC <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-3.5 text-gray-400" size={16} />
                      <input
                        type="password"
                        placeholder="123"
                        value={cardCvc}
                        onChange={handleCardCvcChange}
                        className="w-full pl-10 pr-3 py-3 bg-gray-50/80 border border-gray-200/80 focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-stone-900 font-mono text-center font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>256-bit encrypted card verification with instant admin sync.</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Special Cooking Instructions */}
        <section className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-gray-100 space-y-3">
          <h2 className="font-bold text-culinary-text text-xs sm:text-sm uppercase tracking-wider text-gray-700">
            Special Instructions (Optional)
          </h2>
          <div className="relative flex items-start">
            <FileText className="absolute left-4 top-3.5 text-amber-700/60" size={17} />
            <textarea
              placeholder="E.g. Less spicy, extra cheese, no onion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50/80 border border-gray-200/80 focus:border-culinary-primary focus:bg-white rounded-2xl text-sm min-h-[85px] resize-none outline-none transition-all placeholder:text-gray-400 text-stone-900"
            />
          </div>
        </section>
      </main>

      {/* Bottom Place Order Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-md mx-auto p-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-400 font-medium">Grand Total</span>
            <span className="text-xl font-black text-culinary-primary font-cormorant leading-tight">
              ₹{total.toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className={`flex-1 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${
              paymentMethod === "UPI"
                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/25"
                : paymentMethod === "CARD"
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing Order...
              </span>
            ) : paymentMethod === "UPI" ? (
              <>
                <QrCode size={16} />
                <span>Pay via UPI & Order</span>
              </>
            ) : paymentMethod === "CARD" ? (
              <>
                <CreditCard size={16} />
                <span>Pay via Card & Order</span>
              </>
            ) : (
              <>
                <Banknote size={16} />
                <span>Place Order with Cash</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
