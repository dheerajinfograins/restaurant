"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  UtensilsCrossed,
  QrCode,
  ChefHat,
  Receipt,
  Users,
  HelpCircle,
  Phone,
  MessageSquare,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Store,
  Clock,
  Printer,
  X,
  Radio,
  Trash2,
  DollarSign,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { copyToClipboard } from "@/lib/utils";

// ==========================================
// GUIDES DATA
// ==========================================

interface GuideStep {
  title: string;
  desc: string;
  tip?: string;
  badge?: string;
}

interface Guide {
  id: string;
  title: string;
  shortDesc: string;
  category: "setup" | "menu" | "tables" | "orders" | "billing" | "staff";
  readTime: string;
  icon: React.ElementType;
  colorClass: {
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
    gradient: string;
  };
  linkUrl: string;
  linkLabel: string;
  highlights: string[];
  steps: GuideStep[];
  proTips: string[];
  importantNotice?: string;
  statusBadges?: { label: string; color: string; desc: string }[];
}

const GUIDES: Guide[] = [
  {
    id: "getting-started",
    title: "Getting Started & Profile Setup",
    shortDesc: "Complete your restaurant profile, customize your logo, currency, GST tax rates, and operating hours.",
    category: "setup",
    readTime: "3 min read",
    icon: Store,
    colorClass: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-200",
      badgeBg: "bg-amber-100 text-amber-800",
      gradient: "from-amber-500/10 via-amber-500/5 to-transparent",
    },
    linkUrl: "/dashboard/restaurant",
    linkLabel: "Open Restaurant Settings",
    highlights: [
      "Upload high-resolution logo & banner",
      "Set your default currency (INR ₹, USD $, etc.)",
      "Configure automated GST percentage & tax rules",
      "Define operating hours for online/offline ordering",
    ],
    steps: [
      {
        title: "Step 1: Restaurant Profile & Branding",
        desc: "Go to the Restaurant page to update your brand name, phone number, address, and upload your restaurant's logo. This information will appear prominently on customer digital menus and printed tax invoices.",
        tip: "Square logos (512x512 PNG/WEBP) look best on digital headers and receipt printouts.",
        badge: "Branding",
      },
      {
        title: "Step 2: Taxes & Invoice Prefix",
        desc: "Under Settings > Tax & Billing, configure your GST/Tax percentage (e.g. 5% for restaurants, 18% for alcohol/beverages) and set your custom invoice prefix like 'INV-2026-'.",
        tip: "Tax rates are automatically calculated on every checkout itemized bill.",
        badge: "Accounting",
      },
      {
        title: "Step 3: Operating Hours & Auto-Accept",
        desc: "Set weekly opening and closing schedules so that customers scanning QR codes outside operating hours are politely informed. You can also toggle Auto-Accept Orders for peak rush hours.",
        badge: "Operations",
      },
    ],
    proTips: [
      "Keep your phone number and address accurate as customers can click to call your restaurant directly from the digital menu.",
      "You can toggle the Master Restaurant Status (Open/Closed) anytime with a single click in Settings.",
    ],
  },
  {
    id: "menu-management",
    title: "Menu Engineering & Categories",
    shortDesc: "Organize dishes into vibrant categories, upload mouth-watering images, and set dietary tags & pricing.",
    category: "menu",
    readTime: "4 min read",
    icon: UtensilsCrossed,
    colorClass: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      badgeBg: "bg-emerald-100 text-emerald-800",
      gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    },
    linkUrl: "/dashboard/categories",
    linkLabel: "Manage Menu Categories",
    highlights: [
      "Create category hierarchy (Starters, Mains, Desserts)",
      "Set dietary classifications (Veg, Non-Veg, Egg)",
      "Add discounts, special tags & prep time estimates",
      "Safe Archiving / Inactive toggle for seasonal items",
    ],
    steps: [
      {
        title: "Step 1: Create Categories First",
        desc: "Always create your Categories before adding dishes. For example: Soups & Salads, Wood-fired Pizzas, Artisanal Pastas, Mocktails & Desserts. You can upload custom category header photos.",
        badge: "Structure",
      },
      {
        title: "Step 2: Add Products & Upload Media",
        desc: "Navigate to Products > Add Product. Fill in the dish title, description, price, preparation time, and upload photos. You can also define special ingredient highlights and chef recipe notes.",
        tip: "High-quality dish images increase average customer cart values by up to 28%.",
        badge: "Products",
      },
      {
        title: "Step 3: Dietary Badges & Availability Toggle",
        desc: "Mark items as VEG (🟢), NON_VEG (🔴), or EGG (🟡). If an item runs out of stock mid-shift, simply toggle the 'Available' switch to immediately disable ordering without deleting the dish.",
        badge: "Controls",
      },
    ],
    importantNotice:
      "Why can't I delete certain categories or products? When an item has historical orders attached, the database protects your sales records and financial audit trails. To remove it from the customer menu, simply change its status to INACTIVE or mark Available as OFF.",
    proTips: [
      "Use 'Featured Item' toggle for chef specials to pin them to the top of the customer's digital menu.",
      "Sort orders can be adjusted so high-margin appetizers always appear first.",
    ],
  },
  {
    id: "tables-qr",
    title: "Smart QR Codes & Dine-In Tables",
    shortDesc: "Set up your restaurant floor plan, generate high-resolution printable table QR codes for instant ordering.",
    category: "tables",
    readTime: "3 min read",
    icon: QrCode,
    colorClass: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-200",
      badgeBg: "bg-indigo-100 text-indigo-800",
      gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent",
    },
    linkUrl: "/dashboard/tables",
    linkLabel: "View Tables & QR Codes",
    highlights: [
      "Add tables with capacities & section identifiers",
      "Instant printable QR standee generation",
      "Contactless dine-in ordering without app downloads",
      "Live table occupancy status (Available, Occupied, Reserved)",
    ],
    steps: [
      {
        title: "Step 1: Add Tables & Capacity",
        desc: "Go to Tables and click 'Add Table'. Enter the table number or name (e.g. Table 1, T-04, Rooftop-A) and specify the guest seating capacity.",
        badge: "Floor Plan",
      },
      {
        title: "Step 2: Download & Print Table QR Codes",
        desc: "Each table automatically receives a permanent, secure QR code. Click the QR icon on any table card to view, download as high-res PNG, or print branded acrylic standees.",
        tip: "Table QR codes are permanent. You never need to reprint them even if you change your entire menu!",
        badge: "QR Printing",
      },
      {
        title: "Step 3: Customer Scan Experience",
        desc: "Guests point their smartphone camera at the table QR code. It instantly opens your interactive digital menu in their browser with their table number pre-selected. They can browse, filter, add to cart, and place orders directly.",
        badge: "Guest Flow",
      },
    ],
    proTips: [
      "Place QR standees in well-lit areas of the table for seamless scanning.",
      "You can monitor live table states (Available vs Occupied) in real-time on your dashboard.",
    ],
  },
  {
    id: "orders-kds",
    title: "Live Orders & Kitchen Display (KDS)",
    shortDesc: "Master real-time order lifecycle with instant audio alerts, kitchen tickets, and waiter service notifications.",
    category: "orders",
    readTime: "5 min read",
    icon: ChefHat,
    colorClass: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      border: "border-rose-200",
      badgeBg: "bg-rose-100 text-rose-800",
      gradient: "from-rose-500/10 via-rose-500/5 to-transparent",
    },
    linkUrl: "/dashboard/orders",
    linkLabel: "Open Orders Dashboard",
    highlights: [
      "Instant WebSocket live sync across all devices",
      "Audible chimes on new incoming guest orders",
      "Interactive Kitchen Display System (KDS) screen",
      "Step-by-step order progression from kitchen to table",
    ],
    statusBadges: [
      { label: "PENDING", color: "bg-amber-100 text-amber-800 border-amber-300", desc: "Customer placed order; awaiting manager/cashier acceptance." },
      { label: "ACCEPTED", color: "bg-blue-100 text-blue-800 border-blue-300", desc: "Order confirmed and routed to the kitchen screen." },
      { label: "PREPARING", color: "bg-orange-100 text-orange-800 border-orange-300", desc: "Chefs actively cooking the items on the line." },
      { label: "READY", color: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Food plated; waiter alerted for table pickup." },
      { label: "SERVED", color: "bg-purple-100 text-purple-800 border-purple-300", desc: "Dishes delivered to the table; dining in progress." },
      { label: "PAID", color: "bg-teal-100 text-teal-800 border-teal-300", desc: "Bill settled and closed." },
    ],
    steps: [
      {
        title: "Step 1: Order Notification & Acceptance",
        desc: "When an order arrives, an audible chime sounds on your POS and a glowing notification appears. Click 'Accept' to assign the order to the kitchen line.",
        badge: "Incoming",
      },
      {
        title: "Step 2: Chef Workflow on KDS Screen",
        desc: "Kitchen staff open `/kitchen` on an iPad or touch monitor. Orders appear as clear recipe tickets with dish counts, customer notes (e.g. 'extra spicy', 'no onions'), and elapsed preparation timers.",
        badge: "Kitchen Display",
      },
      {
        title: "Step 3: Food Dispatch & Service",
        desc: "When food is cooked, the chef taps 'Mark Ready'. Waiters receive a real-time push notification specifying the table number to expedite hot food to guests.",
        badge: "Service",
      },
    ],
    proTips: [
      "Use Chrome or Edge on full-screen mode for the Kitchen Display screen (`F11` key).",
      "Customer notes entered at checkout are highlighted in bold red text on kitchen tickets.",
    ],
  },
  {
    id: "billing-invoices",
    title: "Billing, Tax & Payment Invoicing",
    shortDesc: "Process payments via Cash, UPI, or Card, print thermal POS receipts, and generate GST-compliant invoices.",
    category: "billing",
    readTime: "3 min read",
    icon: Receipt,
    colorClass: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-200",
      badgeBg: "bg-cyan-100 text-cyan-800",
      gradient: "from-cyan-500/10 via-cyan-500/5 to-transparent",
    },
    linkUrl: "/dashboard/payments",
    linkLabel: "Open Payments & Invoicing",
    highlights: [
      "Multi-mode settlements (Cash, Dynamic UPI, Card)",
      "Instant 80mm & 58mm thermal receipt printing",
      "Itemized GST breakdown and service charges",
      "One-click printable PDF tax invoices",
    ],
    steps: [
      {
        title: "Step 1: Settle Table Bill",
        desc: "Navigate to Payments or open the active table. Review ordered items, applied discounts, and automated tax calculations.",
        badge: "Checkout",
      },
      {
        title: "Step 2: Select Payment Method",
        desc: "Select the payment channel: Cash, UPI (shows interactive QR code for customer phone scan), or Debit/Credit Card.",
        badge: "Payment",
      },
      {
        title: "Step 3: Print Receipt or Share Invoice",
        desc: "Click 'Print Receipt' for standard thermal ESC/POS printers (58mm/80mm) or generate a formal PDF Tax Invoice with your GST number and restaurant details.",
        badge: "Invoicing",
      },
    ],
    proTips: [
      "Thermal receipts automatically optimize typography and margins for standard receipt printers without cutting off text.",
      "All historical paid invoices are securely archived and queryable under Payments for sales reconciliation.",
    ],
  },
  {
    id: "staff-roles",
    title: "Staff Management & Security Roles",
    shortDesc: "Manage staff accounts, assign granular role permissions (Super Admin, Manager, Waiter, Kitchen, Cashier).",
    category: "staff",
    readTime: "3 min read",
    icon: Users,
    colorClass: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      border: "border-violet-200",
      badgeBg: "bg-violet-100 text-violet-800",
      gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    },
    linkUrl: "/dashboard/staff",
    linkLabel: "Manage Staff Members",
    highlights: [
      "Role-Based Access Control (RBAC) security",
      "Dedicated portal views for Waiters and Kitchen Chefs",
      "One-click account activation / deactivation",
      "Strict data isolation and security",
    ],
    steps: [
      {
        title: "Step 1: Invite Staff Members",
        desc: "Go to Staff Management and click 'Add Staff'. Enter their full name, email, phone number, and secure password.",
        badge: "Accounts",
      },
      {
        title: "Step 2: Assign Granular Roles",
        desc: "Choose the appropriate role: SUPER_ADMIN (Full system access), OWNER/MANAGER (Menu, reports, staff), WAITER (Table ordering & order serving), KITCHEN (KDS screen only), or CASHIER (Payments & checkout).",
        badge: "Permissions",
      },
      {
        title: "Step 3: Staff Login & Shift Access",
        desc: "Staff log in with their credentials. The system automatically restricts their sidebar navigation to only permitted screens matching their role.",
        badge: "Security",
      },
    ],
    proTips: [
      "Waiters have a streamlined mobile-friendly view at `/waiter` to take orders directly at the guest table.",
      "If a staff member is reassigned or leaves, deactivate their account with the Active switch to preserve past order audit trails.",
    ],
  },
];

// ==========================================
// RICH FAQS DATA
// ==========================================

interface FAQItem {
  id: string;
  question: string;
  category: string;
  categorySlug: "menu" | "tables" | "orders" | "billing" | "settings" | "staff";
  icon: React.ElementType;
  colorClass: {
    bg: string;
    text: string;
    badge: string;
  };
  summary: string;
  steps: string[];
  tip?: string;
  actionUrl?: string;
  actionLabel?: string;
}

const FAQS: FAQItem[] = [
  {
    id: "faq-delete-error",
    question: "Why do I get an error when deleting a Category or Product?",
    category: "Menu & Database",
    categorySlug: "menu",
    icon: Trash2,
    colorClass: {
      bg: "bg-red-50",
      text: "text-red-600",
      badge: "bg-red-100 text-red-800 border-red-200",
    },
    summary:
      "When a dish or category has past order records, the database prevents hard deletion to safeguard your historical sales data, accounting ledger, and tax invoices from becoming corrupted.",
    steps: [
      "Click Edit on the Category or Product card.",
      "Change the Status to INACTIVE (or toggle Available to OFF).",
      "Save changes — the item immediately disappears from customer QR menus while preserving full financial records.",
    ],
    tip: "If a category or dish was created by mistake and has 0 orders placed, it can be permanently deleted with 1 click.",
    actionUrl: "/dashboard/categories",
    actionLabel: "Manage Categories",
  },
  {
    id: "faq-qr-app",
    question: "Do customers need to download an app to view the menu and order?",
    category: "QR Codes & Tables",
    categorySlug: "tables",
    icon: Smartphone,
    colorClass: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    },
    summary:
      "No app download is required! Customers simply open their regular smartphone camera (iPhone or Android) and scan the table QR code.",
    steps: [
      "Scanning opens a responsive Web App directly in the customer's phone browser.",
      "The customer's table number is automatically identified and locked in.",
      "Guests can browse categories, filter Veg/Non-Veg, add notes, and submit orders instantly.",
    ],
    tip: "You can laminate and print table QR standees once; they never need reprinting even if you update your entire menu daily.",
    actionUrl: "/dashboard/tables",
    actionLabel: "View Table QR Codes",
  },
  {
    id: "faq-kds-sync",
    question: "How do live orders sync between customer phones and the Kitchen screen?",
    category: "Orders & Kitchen",
    categorySlug: "orders",
    icon: ChefHat,
    colorClass: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      badge: "bg-rose-100 text-rose-800 border-rose-200",
    },
    summary:
      "Our system uses real-time WebSockets (Socket.io) ensuring zero-delay order dispatch across the customer's phone, cashier POS, and kitchen screens.",
    steps: [
      "Customer hits 'Place Order' on their smartphone.",
      "A loud chime sounds on the POS and Kitchen Display Screen in under 150ms.",
      "Kitchen chefs mark items PREPARING and READY, instantly updating the waiter's handheld device.",
    ],
    tip: "Keep `/kitchen` open on a wall-mounted tablet or monitor in full screen (`F11`) for the best kitchen line experience.",
    actionUrl: "/dashboard/orders",
    actionLabel: "Open Live Orders",
  },
  {
    id: "faq-thermal-printing",
    question: "Can I print thermal KOT tickets and 80mm/58mm customer receipts?",
    category: "Billing & POS",
    categorySlug: "billing",
    icon: Printer,
    colorClass: {
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      badge: "bg-cyan-100 text-cyan-800 border-cyan-200",
    },
    summary:
      "Yes! Culinary Ledger supports all standard USB, Bluetooth, and Network ESC/POS thermal receipt printers (both 80mm and 58mm roll sizes).",
    steps: [
      "Click 'Print Receipt' on any active order or invoice.",
      "The layout is auto-formatted for thermal paper with your logo, GST breakdown, and table number.",
      "You can also generate formal A4/A5 PDF Tax Invoices for corporate or banquet clients.",
    ],
    tip: "Set paper width to '80mm' or '58mm' in your browser print dialog and enable 'Silent Printing' for instant 1-click receipts.",
    actionUrl: "/dashboard/payments",
    actionLabel: "View Invoices & Receipts",
  },
  {
    id: "faq-gst-settings",
    question: "How do I configure GST rates, Service Charges, and Invoice Prefixes?",
    category: "Tax & Settings",
    categorySlug: "settings",
    icon: Receipt,
    colorClass: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-800 border-amber-200",
    },
    summary:
      "Tax rules, invoice sequences, and service charges can be configured in a few clicks under Restaurant Settings.",
    steps: [
      "Go to Settings > Tax & Billing.",
      "Enter your Tax Percentage (e.g. 5% for food, 18% for bar) and optional Service Charge.",
      "Add your official GSTIN / Tax ID and set your invoice prefix (e.g. 'INV-2026-').",
    ],
    tip: "Taxes are computed transparently on checkout so customers see the itemized base total and tax split.",
    actionUrl: "/dashboard/settings",
    actionLabel: "Open Tax Settings",
  },
  {
    id: "faq-price-changes",
    question: "Can I change dish prices without altering past orders and reports?",
    category: "Menu & Pricing",
    categorySlug: "menu",
    icon: DollarSign,
    colorClass: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    summary:
      "Yes! Every order record saves an immutable financial snapshot of item prices, discounts, and taxes at the exact time of order placement.",
    steps: [
      "Update any product price in Products > Edit Product.",
      "The new price immediately takes effect for all future customer orders.",
      "All historical sales reports and previous invoices retain their original purchase price.",
    ],
    tip: "You can also set promotional discount percentages that display a strikethrough price on the customer digital menu.",
    actionUrl: "/dashboard/products",
    actionLabel: "Manage Menu Prices",
  },
  {
    id: "faq-staff-roles",
    question: "How do different Staff Roles (Manager, Waiter, Kitchen, Cashier) work?",
    category: "Staff & Security",
    categorySlug: "staff",
    icon: ShieldCheck,
    colorClass: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      badge: "bg-violet-100 text-violet-800 border-violet-200",
    },
    summary:
      "Role-Based Access Control (RBAC) ensures employees only see what they need for their specific job shift.",
    steps: [
      "SUPER_ADMIN / OWNER: Full access to financial reports, settings, staff, and menus.",
      "MANAGER: Manage daily orders, menu item availability, and floor plan tables.",
      "WAITER & CASHIER: Mobile table ordering view at `/waiter` and payment checkout.",
      "KITCHEN: Dedicated KDS cooking screen at `/kitchen`.",
    ],
    tip: "Staff accounts can be deactivated in 1 click when an employee's shift ends or when they leave.",
    actionUrl: "/dashboard/staff",
    actionLabel: "Manage Staff Roles",
  },
  {
    id: "faq-offline-handling",
    question: "What happens if our restaurant internet connection drops temporarily?",
    category: "System & Offline",
    categorySlug: "settings",
    icon: Radio,
    colorClass: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      badge: "bg-blue-100 text-blue-800 border-blue-200",
    },
    summary:
      "Local state caching and automatic background reconnection ensure you never lose active order data during brief connection drops.",
    steps: [
      "Active orders on screen remain viewable and interactive.",
      "The app automatically reconnects WebSockets in the background as soon as Wi-Fi returns.",
      "Pending status changes sync automatically with the central database.",
    ],
    tip: "Using a dedicated 5GHz Wi-Fi router for POS and Kitchen tablets guarantees optimal local performance.",
    actionUrl: "/dashboard/restaurant",
    actionLabel: "System Diagnostics",
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function DocsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>("all");
  const [activeGuide, setActiveGuide] = useState<Guide | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq-delete-error");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter categories for guides
  const guideCategories = [
    { id: "all", label: "All Guides" },
    { id: "setup", label: "🚀 Getting Started" },
    { id: "menu", label: "🍽️ Menu & Dishes" },
    { id: "tables", label: "🪑 Tables & QR" },
    { id: "orders", label: "⚡ Orders & KDS" },
    { id: "billing", label: "💳 Billing & Tax" },
    { id: "staff", label: "👥 Staff & Roles" },
  ];

  // Filter categories for FAQs
  const faqCategories = [
    { id: "all", label: "All Questions", count: FAQS.length },
    { id: "menu", label: "🍽️ Menu & Deletion", count: FAQS.filter((f) => f.categorySlug === "menu").length },
    { id: "tables", label: "🪑 QR & Tables", count: FAQS.filter((f) => f.categorySlug === "tables").length },
    { id: "orders", label: "⚡ Orders & KDS", count: FAQS.filter((f) => f.categorySlug === "orders").length },
    { id: "billing", label: "💳 Billing & Thermal", count: FAQS.filter((f) => f.categorySlug === "billing").length },
    { id: "settings", label: "⚙️ Tax & System", count: FAQS.filter((f) => f.categorySlug === "settings").length },
    { id: "staff", label: "👥 Staff & Roles", count: FAQS.filter((f) => f.categorySlug === "staff").length },
  ];

  // Filtered guides
  const filteredGuides = useMemo(() => {
    return GUIDES.filter((guide) => {
      const matchesCategory =
        selectedCategory === "all" || guide.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.highlights.some((h) =>
          h.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedFaqCategory === "all" || faq.categorySlug === selectedFaqCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.steps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedFaqCategory]);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedText(text);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-white to-[#F5F2EC] text-culinary-text pb-20">
      {/* ==========================================
          HERO BANNER
      ========================================== */}
      <section className="relative overflow-hidden pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-culinary-border/40">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-gradient-to-r from-culinary-primary/10 via-amber-400/10 to-culinary-secondary/10 blur-3xl -z-10 pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-culinary-primary/10 border border-culinary-primary/20 text-culinary-primary text-xs font-semibold tracking-wide uppercase mb-4 shadow-xs">
            <Sparkles size={14} className="animate-pulse" />
            Culinary Ledger Knowledge Hub
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-cormorant font-bold text-culinary-text tracking-tight mb-3">
            Documentation & Interactive Guides
          </h1>
          <p className="text-sm sm:text-base text-culinary-muted max-w-2xl mx-auto font-sans leading-relaxed mb-8">
            Master every aspect of your restaurant: from configuring menu categories and printing table QR codes to managing live kitchen orders and GST invoicing.
          </p>

          {/* SEARCH BAR */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search
                size={18}
                className="absolute left-4 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search guides, setup tutorials, FAQs, and features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-md shadow-black/5 focus:outline-none focus:ring-2 focus:ring-culinary-primary/30 focus:border-culinary-primary transition-all text-sm placeholder:text-gray-400 text-gray-800"
              />
              {searchQuery && (
                <button type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* QUICK STATS PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs text-culinary-muted font-medium">
            <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs">
              <BookOpen size={13} className="text-culinary-primary" />
              <span>6 Core Guides</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs">
              <HelpCircle size={13} className="text-amber-600" />
              <span>8 In-Depth Solutions</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 px-3.5 py-1.5 rounded-full border border-gray-200/60 shadow-2xs">
              <Phone size={13} className="text-indigo-600" />
              <span>Priority Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CATEGORY FILTER TABS FOR GUIDES
      ========================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {guideCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive
                  ? "bg-culinary-primary text-white shadow-md shadow-culinary-primary/20 scale-[1.02]"
                  : "bg-white text-culinary-muted hover:text-culinary-text hover:bg-gray-50 border border-gray-200/70"
                  }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ==========================================
          GUIDE CARDS GRID
      ========================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-cormorant font-bold text-culinary-text flex items-center gap-2">
            <Layers size={18} className="text-culinary-primary" />
            Explore Interactive Guides
          </h2>
          <span className="text-xs text-culinary-muted font-medium">
            Showing {filteredGuides.length} of {GUIDES.length} Modules
          </span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-sm max-w-lg mx-auto">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search size={22} />
            </div>
            <h3 className="font-cormorant font-bold text-lg text-gray-800 mb-1">
              No matching guides found
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Try searching for categories, QR codes, KDS, or billing.
            </p>
            <button type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-culinary-primary text-white text-xs font-semibold rounded-xl hover:bg-culinary-primary/90 transition-colors shadow-sm"
            >
              Reset Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => {
              const IconComp = guide.icon;
              return (
                <div
                  key={guide.id}
                  className="group relative bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  {/* Top Subtle Gradient Accents */}
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${guide.colorClass.gradient} rounded-bl-full pointer-events-none -z-0`}
                  />

                  <div className="relative z-10">
                    {/* Header Row: Icon + Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${guide.colorClass.bg} flex items-center justify-center ${guide.colorClass.text} shadow-xs group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComp size={24} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                          <Clock size={11} />
                          {guide.readTime}
                        </span>
                      </div>
                    </div>

                    {/* Title & Short Description */}
                    <h3 className="font-cormorant font-bold text-xl text-culinary-text mb-2 group-hover:text-culinary-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-culinary-muted leading-relaxed mb-4 line-clamp-2">
                      {guide.shortDesc}
                    </p>

                    {/* Highlights List */}
                    <div className="space-y-2 mb-6">
                      {guide.highlights.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 text-xs text-gray-600 font-sans"
                        >
                          <CheckCircle2
                            size={13}
                            className="text-emerald-500 mt-0.5 shrink-0"
                          />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
                    <button
                      type="button"
                      onClick={() => setActiveGuide(guide)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-culinary-primary hover:text-culinary-secondary transition-colors cursor-pointer group/btn"
                    >
                      <span>Read Guide</span>
                      <ArrowRight
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>

                    <Link
                      href={guide.linkUrl}
                      className="text-[11px] font-medium text-gray-400 hover:text-gray-700 flex items-center gap-1 hover:underline"
                    >
                      <span>Quick Link</span>
                      <ExternalLink size={10} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          REDESIGNED FREQUENTLY ASKED QUESTIONS (FAQS)
      ========================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        {/* Header with badge */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3 shadow-xs">
            <HelpCircle size={14} className="text-amber-600" />
            Troubleshooting & Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-cormorant font-bold text-culinary-text tracking-tight">
            Clear Answers to Common Operations
          </h2>
          <p className="text-xs sm:text-sm text-culinary-muted mt-2 leading-relaxed">
            Detailed solutions for menu archiving, QR code workflow, POS thermal printing, kitchen display alerts, and GST billing.
          </p>

          {/* FAQ Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {faqCategories.map((cat) => {
              const isActive = selectedFaqCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedFaqCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${isActive
                    ? "bg-culinary-text text-white shadow-sm scale-[1.03]"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                    }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Cards Grid */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-sm max-w-md mx-auto">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No questions found for this topic
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Try selecting &quot;All Questions&quot; or clearing your search.
            </p>
            <button type="button"
              onClick={() => {
                setSelectedFaqCategory("all");
                setSearchQuery("");
              }}
              className="text-xs font-bold text-culinary-primary hover:underline"
            >
              Show all FAQs &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              const IconComp = faq.icon;

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${isExpanded
                    ? "border-culinary-primary/40 shadow-lg ring-1 ring-culinary-primary/15 bg-white"
                    : "border-gray-200/80 shadow-xs hover:border-gray-300 hover:shadow-md"
                    }`}
                >
                  {/* Card Header (Clickable Accordion Trigger) */}
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-2xl ${faq.colorClass.bg} ${faq.colorClass.text} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}
                      >
                        <IconComp size={20} />
                      </div>

                      {/* Category Badge + Question */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${faq.colorClass.badge}`}
                          >
                            {faq.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-culinary-text leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    {/* Chevron Toggle Button */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isExpanded
                        ? "bg-culinary-primary text-white rotate-180 shadow-xs"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  {/* Expanded Content Area */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 border-t border-gray-100 bg-[#FCFBF8]/60 space-y-4 animate-in fade-in-50 duration-200">
                      {/* Summary Box */}
                      <div className="p-3.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs">
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                          {faq.summary}
                        </p>
                      </div>

                      {/* Step by Step Actionable List */}
                      {faq.steps && faq.steps.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Recommended Steps:
                          </h4>
                          <div className="space-y-1.5">
                            {faq.steps.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2.5 text-xs text-gray-600 font-sans"
                              >
                                <span className="w-4 h-4 rounded-full bg-culinary-primary/10 text-culinary-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tip Callout */}
                      {faq.tip && (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
                          <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Tip:</strong> {faq.tip}
                          </span>
                        </div>
                      )}

                      {/* Action Button */}
                      {faq.actionUrl && (
                        <div className="pt-2 flex justify-end">
                          <Link
                            href={faq.actionUrl}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-culinary-primary hover:text-culinary-secondary bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs hover:bg-gray-50 transition-colors"
                          >
                            <span>{faq.actionLabel || "Open Section"}</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ==========================================
          SUPPORT & CONTACT CALLOUT BANNER
      ========================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="relative rounded-3xl bg-gradient-to-br from-culinary-text via-gray-900 to-black text-white p-8 sm:p-10 shadow-xl overflow-hidden border border-gray-800">
          {/* Decorative glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-culinary-primary/20 rounded-full blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none -z-0" />

          <div className="relative z-10 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-300 border border-white/10 shadow-md">
              <HelpCircle size={28} />
            </div>

            <h3 className="text-2xl sm:text-3xl font-cormorant font-bold tracking-tight text-white mb-2">
              Still have questions or need setup help?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6 font-sans">
              Our restaurant implementation team is ready to help you configure your digital menu, POS printers, kitchen screens, or staff roles.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button type="button"
                onClick={() => setIsSupportOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-culinary-primary to-culinary-secondary text-white text-xs sm:text-sm font-bold rounded-2xl hover:opacity-95 shadow-lg shadow-culinary-primary/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <MessageSquare size={16} />
                <span>Contact Dedicated Support</span>
              </button>

              <a
                href="tel:+9118001234567"
                className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-2xl border border-white/20 transition-colors backdrop-blur-sm flex items-center gap-2"
              >
                <Phone size={15} className="text-amber-300" />
                <span>+91 1800 123 4567</span>
              </a>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
              <span>Cloud Services, Socket Servers & Database: <strong>All Systems Operational</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          INTERACTIVE GUIDE READER MODAL
      ========================================== */}
      {activeGuide && (
        <Dialog
          open={!!activeGuide}
          onOpenChange={(open) => !open && setActiveGuide(null)}
        >
          <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0 rounded-3xl border-0 shadow-2xl bg-white">
            {/* Modal Header Banner */}
            <div className={`p-6 sm:p-8 bg-gradient-to-br ${activeGuide.colorClass.bg} border-b ${activeGuide.colorClass.border} relative`}>
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-white shadow-xs flex items-center justify-center ${activeGuide.colorClass.text}`}
                >
                  {React.createElement(activeGuide.icon, { size: 20 })}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activeGuide.colorClass.badgeBg}`}
                  >
                    {activeGuide.category}
                  </span>
                  <span className="text-xs text-gray-500 font-medium ml-2">
                    {activeGuide.readTime}
                  </span>
                </div>
              </div>

              <DialogTitle className="text-2xl sm:text-3xl font-cormorant font-bold text-culinary-text mb-2">
                {activeGuide.title}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-culinary-muted leading-relaxed">
                {activeGuide.shortDesc}
              </DialogDescription>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Important Alert Notice if present */}
              {activeGuide.importantNotice && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle
                    size={20}
                    className="text-amber-600 shrink-0 mt-0.5"
                  />
                  <div className="text-xs text-amber-900 leading-relaxed font-sans">
                    <strong className="font-bold block mb-0.5 text-amber-950">
                      Important Relational Rule:
                    </strong>
                    {activeGuide.importantNotice}
                  </div>
                </div>
              )}

              {/* Status Badges Matrix if present (e.g. Orders flow) */}
              {activeGuide.statusBadges && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3">
                    Order Status Progression Flow
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeGuide.statusBadges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 flex items-start gap-2.5"
                      >
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-600">
                          {badge.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-4">
                  Step-by-Step Walkthrough
                </h4>
                <div className="space-y-4">
                  {activeGuide.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-culinary-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-bold text-sm text-culinary-text flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-culinary-primary/10 text-culinary-primary text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          {step.title}
                        </h5>
                        {step.badge && (
                          <span className="text-[10px] font-semibold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-md">
                            {step.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pl-8">
                        {step.desc}
                      </p>

                      {step.tip && (
                        <div className="mt-3 ml-8 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                          <Sparkles size={14} className="shrink-0 text-emerald-600" />
                          <span><strong>Tip:</strong> {step.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips Section */}
              {activeGuide.proTips.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-culinary-border/50">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-culinary-primary mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Pro Implementation Best Practices
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-700">
                    {activeGuide.proTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-culinary-primary font-bold">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setActiveGuide(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-200/60 transition-colors"
              >
                Close Guide
              </button>

              <Link
                href={activeGuide.linkUrl}
                onClick={() => setActiveGuide(null)}
                className="px-5 py-2.5 bg-culinary-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-culinary-primary/90 transition-all flex items-center gap-1.5"
              >
                <span>{activeGuide.linkLabel}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ==========================================
          INTERACTIVE SUPPORT MODAL
      ========================================== */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="max-w-md sm:max-w-md p-6 sm:p-8 rounded-3xl bg-white shadow-2xl border-0">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-culinary-primary flex items-center justify-center mb-3">
              <MessageSquare size={24} />
            </div>
            <DialogTitle className="text-2xl font-cormorant font-bold text-culinary-text">
              Contact Implementation Support
            </DialogTitle>
            <DialogDescription className="text-xs text-culinary-muted">
              Choose your preferred communication channel to speak with an onboarding engineer.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-3">
            {/* WhatsApp Support Option */}
            <a
              href="https://wa.me/9118001234567?text=Hello%20Culinary%20Ledger%20Team%2C%20I%20need%20help%20with%20my%20restaurant%20setup"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl border border-gray-200/90 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-emerald-700 transition-colors">
                    Instant WhatsApp Support
                  </h4>
                  <p className="text-xs text-gray-500">Live chat & screenshot sharing</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Direct Phone Call */}
            <a
              href="tel:+9118001234567"
              className="p-4 rounded-2xl border border-gray-200/90 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-indigo-700 transition-colors">
                    Toll-Free Helpline
                  </h4>
                  <p className="text-xs text-gray-500">+91 1800 123 4567 (Mon-Sat, 9AM-10PM)</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Email Support Ticket */}
            <div className="p-4 rounded-2xl border border-gray-200/90 hover:border-amber-500 hover:bg-amber-50/40 transition-all flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800 group-hover:text-amber-700 transition-colors">
                    Email Desk
                  </h4>
                  <p className="text-xs text-gray-500">support@culinaryledger.com</p>
                </div>
              </div>
              <button type="button"
                onClick={() => handleCopy("support@culinaryledger.com")}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white shadow-2xs transition-colors"
                title="Copy Email Address"
              >
                {copiedText === "support@culinaryledger.com" ? (
                  <Check size={14} className="text-emerald-600" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsSupportOpen(false)}
              className="w-full py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
