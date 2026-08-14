import React from "react";
import { BookOpen, HelpCircle, FileText, Phone } from "lucide-react";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function DocumentationPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-cormorant font-bold text-culinary-text mb-2">Documentation & Help</h1>
        <p className="text-culinary-muted">Learn how to manage your restaurant using the Culinary Ledger dashboard.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-culinary-border/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-culinary-primary/10 rounded-xl flex items-center justify-center text-culinary-primary mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2 text-culinary-text">Getting Started</h3>
          <p className="text-sm text-culinary-muted mb-4">Learn the basics of setting up your restaurant profile, adding staff, and configuring your menu.</p>
          
          <Dialog>
            <DialogTrigger className="text-sm font-semibold text-culinary-primary hover:underline outline-none">
              Read Guide &rarr;
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-cormorant text-culinary-primary">Getting Started Guide</DialogTitle>
                <DialogDescription>Your quick start guide to setting up Culinary Ledger.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-culinary-text text-sm">
                <h4 className="font-bold text-lg border-b pb-2">1. Restaurant Profile</h4>
                <p>Go to the <strong>Restaurant</strong> page to update your name, address, and logo. This information is displayed to your customers on the digital menu.</p>
                
                <h4 className="font-bold text-lg border-b pb-2 mt-6">2. Menu & Categories</h4>
                <p>Start by creating <strong>Categories</strong> (e.g., Starters, Main Course, Beverages). Then, add <strong>Products</strong> to those categories. You can mark items as Veg/Non-Veg and set their prices.</p>
                
                <h4 className="font-bold text-lg border-b pb-2 mt-6">3. Managing Tables</h4>
                <p>Navigate to <strong>Tables</strong> to set up your floor plan. You can download a unique QR code for each table, which customers can scan to place orders directly from their phones!</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-culinary-border/50 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-culinary-secondary/10 rounded-xl flex items-center justify-center text-culinary-secondary mb-4">
            <FileText size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2 text-culinary-text">Order Management</h3>
          <p className="text-sm text-culinary-muted mb-4">Master the order workflow from receiving new orders to kitchen display and final payment.</p>
          
          <Dialog>
            <DialogTrigger className="text-sm font-semibold text-culinary-primary hover:underline outline-none">
              Read Guide &rarr;
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-cormorant text-culinary-primary">Order Management Flow</DialogTitle>
                <DialogDescription>Understanding how orders move through your kitchen.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4 text-culinary-text text-sm">
                <h4 className="font-bold text-lg border-b pb-2">1. Receiving Orders</h4>
                <p>When a customer scans a QR code and places an order, it will appear on your <strong>Orders</strong> dashboard as <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">PENDING</span>.</p>
                
                <h4 className="font-bold text-lg border-b pb-2 mt-6">2. Kitchen Display System (KDS)</h4>
                <p>Once you accept an order, it moves to the <strong>Kitchen Display</strong> screen. The chef will see the items and can mark them as <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">PREPARING</span>, and eventually <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">READY</span>.</p>
                
                <h4 className="font-bold text-lg border-b pb-2 mt-6">3. Serving & Payment</h4>
                <p>Waiters will be notified when food is ready. Once served, the order status becomes <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">SERVED</span>. Finally, use the <strong>Payments</strong> tab to process the bill and close the order.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-culinary-background rounded-2xl p-8 border border-culinary-border/50 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <HelpCircle size={32} className="text-culinary-primary" />
        </div>
        <h3 className="text-xl font-bold font-cormorant text-culinary-text mb-2">Still need help?</h3>
        <p className="text-culinary-muted mb-6 max-w-md mx-auto">
          If you can't find the answers you're looking for, our support team is ready to assist you with any issues.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-2.5 bg-culinary-primary text-white rounded-xl font-semibold shadow-md hover:bg-culinary-primary/90 transition-colors">
            Contact Support
          </button>
          <button className="px-6 py-2.5 bg-white border border-culinary-border text-culinary-text rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Phone size={16} />
            +91 1800 123 4567
          </button>
        </div>
      </div>
    </div>
  );
}
