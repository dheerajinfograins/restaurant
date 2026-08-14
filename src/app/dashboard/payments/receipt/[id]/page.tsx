import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function ReceiptPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      items: {
        include: { product: true }
      },
      restaurant: {
        include: { settings: true }
      }
    }
  });

  if (!order) {
    return <div className="text-center mt-20">Order not found.</div>;
  }

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const isPaid = order.status === "PAID";

  const settings = order.restaurant.settings;
  const serviceChargePct = settings?.serviceCharge || 0;
  const taxPct = settings?.taxPercentage || 0;

  const serviceChargeAmt = (subtotal * serviceChargePct) / 100;
  const taxAmt = ((subtotal + serviceChargeAmt) * taxPct) / 100;


  // Use DB totalAmount as the source of truth, but if we need to show breakdown, we use the calculated values.
  const displayTotal = Number(order.totalAmount);

  return (
    <div className="max-w-sm mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center print:hidden bg-card p-3 rounded-lg border shadow-sm">
        <Link href="/dashboard/payments">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Payments</Button>
        </Link>
        <PrintButton />
      </div>

      {/* Receipt container */}
      <div className="relative bg-white text-black font-mono text-sm shadow-xl print:shadow-none mx-auto w-full max-w-[320px]">
        {/* Top zigzag border effect using inline SVG or simple border, we'll just use a clean cut for modern look but add a slight texture */}
        <div className="p-8 pb-12">
          {isPaid && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none rotate-[-30deg]">
              <span className="text-6xl font-black tracking-widest text-green-700 border-8 border-green-700 px-4 py-2 rounded-lg inline-block uppercase">
                PAID
              </span>
            </div>
          )}

          <div className="text-center space-y-2 pb-6 border-b-2 border-dashed border-gray-300 mb-6">
            <h2 className="text-2xl font-black uppercase tracking-widest">{order.restaurant.name || "Culinary Ledger"}</h2>
            <div className="text-xs text-gray-600 space-y-1">
              <p>{order.restaurant.address || "123 Food Street, Tasty City"}</p>
              {order.restaurant.phone && <p>Tel: {order.restaurant.phone}</p>}
              {settings?.gstNumber && <p>GSTIN: {settings.gstNumber}</p>}
            </div>
          </div>

          <div className="space-y-2 text-xs pb-6 border-b-2 border-dashed border-gray-300 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Order No:</span>
              <span className="font-bold">#{order.orderNumber || id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span className="font-bold">{new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Table:</span>
              <span className="font-bold">{order.table.tableNumber}</span>
            </div>
            {order.customerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-bold">{order.customerName}</span>
              </div>
            )}
          </div>

          <table className="w-full text-xs mb-6">
            <thead>
              <tr className="border-b-2 border-dashed border-gray-300">
                <th className="py-2 text-left font-bold text-gray-500 w-1/2">Item</th>
                <th className="py-2 text-center font-bold text-gray-500 w-1/4">Qty</th>
                <th className="py-2 text-right font-bold text-gray-500 w-1/4">Amt</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 pr-2 leading-tight">{item.product.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right font-medium">{Number(item.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-2 text-xs border-t-2 border-dashed border-gray-300 pt-6 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>
            {serviceChargePct > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Service Charge ({serviceChargePct}%)</span>
                <span className="font-medium">{serviceChargeAmt.toFixed(2)}</span>
              </div>
            )}
            {taxPct > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({taxPct}%)</span>
                <span className="font-medium">{taxAmt.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-base font-black border-y-2 border-dashed border-gray-300 py-4 mb-8">
            <span>TOTAL</span>
            <span>{settings?.currency || "₹"} {displayTotal.toFixed(2)}</span>
          </div>

          {isPaid && (
            <div className="text-center text-xs font-bold text-green-700 bg-green-50 p-2 rounded-md mb-6 border border-green-200 print:border-none print:bg-transparent print:text-black">
              ✓ PAYMENT SUCCESSFUL (Online)
            </div>
          )}

          <div className="text-center space-y-2 mt-4 pt-4">
            <p className="font-black text-sm">THANK YOU</p>
            <p className="text-xs text-gray-500 pb-2">PLEASE VISIT AGAIN</p>
            {/* Removed the pipe-character barcode as it was rendering with huge vertical gaps */}
            <div className="flex justify-center items-center opacity-80 pt-2">
              <svg width="180" height="30" viewBox="0 0 180 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="4" height="30" fill="black" />
                <rect x="8" y="0" width="2" height="30" fill="black" />
                <rect x="14" y="0" width="6" height="30" fill="black" />
                <rect x="24" y="0" width="2" height="30" fill="black" />
                <rect x="30" y="0" width="8" height="30" fill="black" />
                <rect x="42" y="0" width="2" height="30" fill="black" />
                <rect x="48" y="0" width="4" height="30" fill="black" />
                <rect x="56" y="0" width="6" height="30" fill="black" />
                <rect x="66" y="0" width="2" height="30" fill="black" />
                <rect x="72" y="0" width="4" height="30" fill="black" />
                <rect x="80" y="0" width="8" height="30" fill="black" />
                <rect x="92" y="0" width="2" height="30" fill="black" />
                <rect x="98" y="0" width="6" height="30" fill="black" />
                <rect x="108" y="0" width="2" height="30" fill="black" />
                <rect x="114" y="0" width="4" height="30" fill="black" />
                <rect x="122" y="0" width="2" height="30" fill="black" />
                <rect x="128" y="0" width="8" height="30" fill="black" />
                <rect x="140" y="0" width="4" height="30" fill="black" />
                <rect x="148" y="0" width="2" height="30" fill="black" />
                <rect x="154" y="0" width="6" height="30" fill="black" />
                <rect x="164" y="0" width="2" height="30" fill="black" />
                <rect x="170" y="0" width="4" height="30" fill="black" />
                <rect x="178" y="0" width="2" height="30" fill="black" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
