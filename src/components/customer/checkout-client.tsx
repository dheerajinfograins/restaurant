"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, FileText, Phone, QrCode, User, X, Banknote, CreditCard } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { createOrderAction } from "@/app/(customer)/checkout/actions";
import type { OrderStatus, PaymentMethod } from "@prisma/client";

export function CheckoutClient() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, restaurantId, tableId, setActiveOrderId } = useCartStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [showQR, setShowQR] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, setIsOrderPlaced] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold font-cormorant text-culinary-text mb-2">Your Cart is Empty</h1>
        <p className="text-gray-500 mb-6 text-sm">Add some delicious dishes from our menu first.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-culinary-primary text-white rounded-xl font-medium shadow-md shadow-culinary-primary/20"
        >
          Return to Menu
        </button>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const taxes = subtotal * 0.05;
  const total = subtotal + taxes;

  const handlePlaceOrder = async () => {
    if (!name || !phone) {
      alert("Please enter your name and phone number.");
      return;
    }

    if (paymentMethod === "UPI") {
      setShowQR(true);
      return;
    }

    // Direct checkout for Cash or Card at counter
    await executeOrderCreation(paymentMethod);
  };

  const executeOrderCreation = async (method: PaymentMethod) => {
    setIsLoading(true);

    const result = await createOrderAction({
      restaurantId: restaurantId!,
      tableId: tableId!,
      customerName: name,
      customerPhone: phone,
      notes: notes,
      items: items.map((i: CartItem) => ({ id: i.id, quantity: i.quantity, price: i.price })),
      totalAmount: total,
      status: "PENDING" as OrderStatus,
      paymentMethod: method,
    });

    setIsLoading(false);
    setShowQR(false);

    if (result.success && result.orderId) {
      setIsOrderPlaced(true);
      setActiveOrderId(result.orderId);
      clearCart();
      router.push(`/order/${result.orderId}`);
    } else {
      alert(result.error || "Failed to place order.");
    }
  };

  const handleUPISuccess = async () => {
    setIsLoading(true);
    // Simulate payment processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await executeOrderCreation("UPI");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      {/* Header */}
      <div className="flex items-center p-6 bg-white shadow-sm mb-6">
        <button type="button" onClick={() => router.back()} className="mr-4">
          <ArrowLeft size={24} className="text-culinary-text" />
        </button>
        <h1 className="text-2xl font-bold font-cormorant text-culinary-text">Checkout</h1>
      </div>

      <div className="px-6 space-y-6">
        {/* Contact Details */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-culinary-text mb-4">Contact Details</h2>
          <div className="space-y-4">
            <div className="relative flex items-center">
              <User className="absolute left-4 text-culinary-primary/70" size={18} />
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-culinary-primary rounded-xl text-sm outline-none transition-all"
              />
            </div>

            <div className="relative flex items-center">
              <Phone className="absolute left-4 text-culinary-primary/70" size={18} />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-culinary-primary rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-culinary-text mb-3">Payment Method</h2>
          <p className="text-xs text-gray-500 mb-4">Select how you would like to pay for your order:</p>

          <div className="grid grid-cols-3 gap-3">
            {/* UPI Option */}
            <button
              type="button"
              onClick={() => setPaymentMethod("UPI")}
              className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                paymentMethod === "UPI"
                  ? "border-purple-500 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20 font-bold"
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
              className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                paymentMethod === "CASH"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold"
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
              className={`p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                paymentMethod === "CARD"
                  ? "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 font-bold"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
              }`}
            >
              <CreditCard size={22} className={paymentMethod === "CARD" ? "text-blue-600" : "text-gray-400"} />
              <span className="text-xs">Card / POS</span>
            </button>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-culinary-text mb-4">Special Instructions</h2>
          <div className="relative flex items-start">
            <FileText className="absolute left-4 top-4 text-culinary-primary/70" size={18} />
            <textarea
              placeholder="E.g. Less spicy, extra cheese, no onion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 focus:border-culinary-primary rounded-xl text-sm min-h-[100px] resize-none outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Bottom Place Order Bar */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe">
        <div className="max-w-md mx-auto p-4 sm:p-6 flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-culinary-text/70 font-medium">To Pay</span>
            <span className="text-xl font-bold text-culinary-text">₹{total.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isLoading}
            className="flex-1 py-4 bg-black text-center text-white rounded-2xl font-bold text-lg shadow-lg shadow-black/20 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {isLoading ? "Placing Order..." : paymentMethod === "UPI" ? "Pay via UPI" : "Place Order"}
          </button>
        </div>
      </div>

      {/* UPI Payment QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-50 p-2 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6 mt-2">
              <h3 className="text-2xl font-bold font-cormorant text-culinary-text">Scan & Pay UPI</h3>
              <p className="text-sm text-gray-500 mt-1">Scan QR code using GPay, PhonePe, Paytm, etc.</p>
            </div>

            <div className="bg-[#F8F9FA] border-2 border-dashed border-gray-200 rounded-2xl p-8 flex items-center justify-center mb-8 mx-auto w-48 h-48 relative overflow-hidden">
              <QrCode size={120} className="text-gray-800 relative z-10" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-culinary-primary animate-[bounce_2s_infinite] shadow-[0_0_8px_rgba(212,175,55,0.8)] z-20"></div>
            </div>

            <div className="text-center mb-8">
              <p className="text-sm text-gray-500">Amount to pay</p>
              <p className="text-3xl font-bold text-culinary-primary mt-1">₹{total.toFixed(2)}</p>
            </div>

            <button
              type="button"
              onClick={handleUPISuccess}
              disabled={isLoading}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-green-600/30"
            >
              {isLoading ? (
                <span className="animate-pulse flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying Payment...
                </span>
              ) : (
                <>
                  <CheckCircle size={20} />
                  I have paid via UPI
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
