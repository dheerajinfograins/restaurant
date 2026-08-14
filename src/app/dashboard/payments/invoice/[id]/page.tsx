import { Download, ArrowLeft, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function InvoicePage({ params }: { readonly params: Promise<{ id: string }> }) {
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
  

  const displayTotal = Number(order.totalAmount);
  const currency = settings?.currency || "₹";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center print:hidden bg-card p-4 rounded-xl border shadow-sm">
        <Link href="/dashboard/payments">
          <Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2"/> Back to Payments</Button>
        </Link>
        <div className="flex gap-3">
          <PrintButton variant="outline" label="Print Invoice" />
          {/* Using PrintButton for PDF as browsers natively support 'Save as PDF' in the print dialog */}
          <PrintButton variant="default" label="Save as PDF">
            <Download className="w-4 h-4 mr-2" /> Save as PDF
          </PrintButton>
        </div>
      </div>
      
      <div className="bg-white text-black p-12 rounded-2xl shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-800 to-gray-600 print:hidden" />
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-8 h-8 text-gray-800" />
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">INVOICE</h1>
            </div>
            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md inline-block font-mono text-sm mt-2">
              # {order.orderNumber || id.slice(-8).toUpperCase()}
            </div>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">{order.restaurant.name || "Culinary Ledger"}</h2>
            <p className="text-gray-500 text-sm">{order.restaurant.address || "123 Food Street, Tasty City"}</p>
            <p className="text-gray-500 text-sm">{order.restaurant.email || "contact@culinaryledger.com"}</p>
            {settings?.gstNumber && <p className="text-gray-500 text-sm">GSTIN: {settings.gstNumber}</p>}
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="flex justify-between py-10 border-b border-gray-100">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Billed To</p>
              <p className="text-gray-900 font-bold text-lg">{order.customerName || "Walk-in Guest"}</p>
              <p className="text-gray-600">Table {order.table.tableNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Payment Status</p>
              <div className="mt-1">
                {isPaid ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">
                    ✓ PAID (Online)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    {order.status} (Awaiting)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right space-y-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Date of Issue</p>
              <p className="text-gray-900 font-semibold">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Time</p>
              <p className="text-gray-900 font-semibold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="py-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">Item Description</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Unit Price</th>
                <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-4 text-gray-900 font-medium">{item.product.name}</td>
                  <td className="py-5 px-4 text-gray-700 text-center">{item.quantity}</td>
                  <td className="py-5 px-4 text-gray-700 text-right">{currency}{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-5 px-4 text-gray-900 font-semibold text-right">{currency}{Number(item.totalPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end pt-6 pb-12">
          <div className="w-80 space-y-4">
            <div className="flex justify-between text-gray-600 px-4">
              <span className="font-medium">Subtotal</span>
              <span className="font-semibold">{currency}{subtotal.toFixed(2)}</span>
            </div>
            {serviceChargePct > 0 && (
              <div className="flex justify-between text-gray-600 px-4">
                <span className="font-medium">Service Charge ({serviceChargePct}%)</span>
                <span className="font-semibold">{currency}{serviceChargeAmt.toFixed(2)}</span>
              </div>
            )}
            {taxPct > 0 && (
              <div className="flex justify-between text-gray-600 px-4">
                <span className="font-medium">Tax ({taxPct}%)</span>
                <span className="font-semibold">{currency}{taxAmt.toFixed(2)}</span>
              </div>
            )}
            
            {/* Grand Total */}
            <div className="flex justify-between items-center text-xl font-black text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
              <span>Grand Total</span>
              <span className="text-2xl text-blue-600">{currency}{displayTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer */}
        <div className="text-center pt-8 border-t border-gray-200 text-gray-500">
          <p className="font-bold text-gray-900 text-lg">Thank You For Dining With Us!</p>
          <p className="text-sm mt-1">If you have any questions about this invoice, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
