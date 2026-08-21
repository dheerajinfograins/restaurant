import Razorpay from "razorpay";
import crypto from "node:crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_xU5aUKMAB361y0",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "uUT8INtIDZn3EwCgKuK1aKWY",
});

export function verifyRazorpaySignature({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "uUT8INtIDZn3EwCgKuK1aKWY";
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === razorpaySignature;
  } catch (err) {
    console.error("Razorpay signature verification error:", err);
    return false;
  }
}
