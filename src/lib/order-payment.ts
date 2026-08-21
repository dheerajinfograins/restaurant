export interface OrderPaymentMeta {
  status?: string | null;
  notes?: string | null;
  paymentMethod?: string | null;
}

/**
 * Checks if an order has been paid (either marked as PAID, paid via Razorpay/UPI/Card online, or trace in notes)
 */
export function isOrderPaid(order?: OrderPaymentMeta | null): boolean {
  if (!order) return false;
  
  const status = order.status?.toUpperCase();
  if (status === "PAID") return true;

  const notes = order.notes || "";
  if (notes.includes("Razorpay Paid") || notes.includes("[UPI Payment:") || notes.includes("[Card Payment:")) {
    return true;
  }

  const paymentMethod = order.paymentMethod?.toUpperCase();
  if ((paymentMethod === "UPI" || paymentMethod === "CARD") && !notes.includes("Cash Payment")) {
    return true;
  }

  return false;
}

/**
 * Returns formatted payment method label
 */
export function getPaymentMethodLabel(order?: OrderPaymentMeta | null): string {
  if (!order) return "Counter / UPI";
  const method = order.paymentMethod?.toUpperCase();
  if (method === "UPI") return "UPI / QR";
  if (method === "CARD") return "Card Online";
  if (method === "CASH") return "Cash at Table";
  return "Pay at Table / Counter";
}
