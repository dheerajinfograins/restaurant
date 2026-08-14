"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Clock, ChefHat, BellRing } from "lucide-react";
import { OrderCountdown } from "./order-countdown";
import type { OrderStatus } from "@prisma/client";

interface OrderData {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: Date;
  table: { tableNumber: string };
  items: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    product: { name: string };
  }>;
  totalAmount: number;
}

export function OrderTrackerClient({ initialOrder }: { readonly initialOrder: OrderData }) {
  const [order, setOrder] = useState<OrderData>(initialOrder);

  useEffect(() => {
    // Poll every 3 seconds for updates
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          // We need to parse dates since JSON returns strings
          data.createdAt = new Date(data.createdAt);
          setOrder(data);
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [order.id]);

  const statuses = [
    { key: "PENDING", label: "Order Received", icon: Clock },
    { key: "ACCEPTED", label: "Order Accepted", icon: CheckCircle2 },
    { key: "PREPARING", label: "Preparing", icon: ChefHat },
    { key: "READY", label: "Ready to Serve", icon: BellRing },
    { key: "SERVED", label: "Served", icon: CheckCircle2 },
    { key: "PAID", label: "Paid", icon: CheckCircle2 },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.key === order.status);

  return (
    <>
      <div className="text-center mt-6 mb-10">
        <h1 className="text-3xl font-bold font-cormorant text-culinary-text mb-2">Order Status</h1>
        <p className="text-sm text-culinary-text/70 mb-1">{order.orderNumber}</p>
        <p className="text-xs text-culinary-primary font-bold">Table {order.table.tableNumber}</p>
        
        {/* Global Timer that stays visible until Served */}
        {["ACCEPTED", "PREPARING", "READY"].includes(order.status) && (
          <div className="mt-6 flex justify-center">
            <OrderCountdown createdAt={order.createdAt} />
          </div>
        )}
      </div>
      
      {/* Status Tracker */}
      <div className="w-full max-w-xs mx-auto space-y-6 mb-12 relative">
        {/* Vertical Line */}
        <div className="absolute left-[1.125rem] top-4 bottom-8 w-0.5 bg-gray-100 -z-10"></div>
        
        {statuses.map((status, index) => {
          // PAID is always active since they pay at checkout via QR
          const isCompleted = index <= currentStatusIndex || status.key === "PAID";
          const isCurrent = index === currentStatusIndex;
          const Icon = status.icon;
          
          return (
            <div key={status.key} className="flex items-center space-x-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] bg-white transition-colors duration-500 ${
                isCompleted ? 'border-culinary-primary text-culinary-primary' : 'border-gray-200 text-gray-300'
              }`}>
                <Icon size={18} className={isCurrent ? 'animate-pulse' : ''} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${isCompleted ? 'text-culinary-text' : 'text-gray-400'}`}>
                  {status.label}
                </h3>
                {isCurrent && status.key === "PENDING" && (
                  <p className="text-xs text-orange-500 font-medium mt-1 animate-pulse">Waiting for restaurant to confirm...</p>
                )}
                {isCurrent && status.key === "ACCEPTED" && (
                  <p className="text-xs text-culinary-primary font-medium mt-1">Order accepted! Starting preparations...</p>
                )}
                {isCurrent && status.key === "PREPARING" && (
                  <p className="text-xs text-culinary-primary font-medium mt-1">We are currently working on this</p>
                )}
                {status.key === "PAID" && (
                  <p className="text-xs text-culinary-primary font-medium mt-1">Payment Successful</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-culinary-text mb-4 font-cormorant text-xl">Order Items</h3>
        <div className="space-y-3 mb-6">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div className="flex items-start gap-2">
                <span className="font-bold text-culinary-primary">{item.quantity}x</span>
                <span className="font-medium text-culinary-text">{item.product.name}</span>
              </div>
              <span className="font-bold text-culinary-text">₹{Number(item.totalPrice).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-lg text-culinary-text">
          <span>Total Paid</span>
          <span>₹{Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}
