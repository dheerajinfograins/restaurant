"use client";

import { useEffect, useState, useRef, use, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { RestaurantTable } from "@prisma/client";
import { Download, Printer, ArrowLeft, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";

export default function QrPreviewPage({ params }: Readonly<{ params: Promise<{ tableId: string }> }>) {
  const router = useRouter();
  const { tableId } = use(params);
  
  const [table, setTable] = useState<(RestaurantTable & { restaurant?: { name?: string; logo?: string | null } }) | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"
  );

  useEffect(() => {
    const fetchTable = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`/api/tables/${tableId}`);
        if (res.data.success) {
          setTable(res.data.data);
          if (res.data.data?.restaurant?.name) {
            setRestaurantName(res.data.data.restaurant.name);
          }
        }

        // Fetch restaurant directly to ensure latest name
        try {
          const restRes = await axios.get("/api/restaurant");
          if (restRes.data?.data?.name) {
            setRestaurantName(restRes.data.data.name);
          }
        } catch {
          // Ignore if already have restaurant from table
        }
      } catch (error) {
        console.error("Failed to fetch table details", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTable();
  }, [tableId]);

  const activeRestaurantName = restaurantName || table?.restaurant?.name || "Restaurant Menu";

  const handlePrint = () => {
    if (!qrRef.current || !table) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.documentElement.innerHTML = `
      <head>
        <title>Print QR Code - Table ${table.tableNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap');
          body { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            font-family: 'Inter', sans-serif;
            background-color: #FFF8F0;
            background-image: linear-gradient(135deg, #FFF8F0 0%, #fdfbf7 100%);
          }
          .container { 
            text-align: center; 
            padding: 50px 40px; 
            border: 2px solid #E6D9C8; 
            border-radius: 24px; 
            max-width: 400px;
            background-color: rgba(255, 255, 255, 0.7);
            box-shadow: 0 15px 30px rgba(183, 121, 31, 0.1);
          }
          .brand {
            font-family: 'Cormorant Garamond', serif;
            font-size: 32px;
            font-weight: 700;
            color: #B7791F;
            margin-bottom: 8px;
          }
          h1 { 
            margin-top: 0;
            margin-bottom: 30px; 
            font-size: 24px; 
            color: #334155;
          }
          .qr-wrapper {
            background: white;
            padding: 20px;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            display: inline-block;
            margin-bottom: 20px;
            border: 2px solid #E6D9C8;
          }
          p { 
            margin-top: 10px; 
            font-size: 16px; 
            color: #64748b; 
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">${activeRestaurantName}</div>
          <h1>Table ${table.tableNumber}</h1>
          <div class="qr-wrapper">
            ${qrRef.current.innerHTML}
          </div>
          <p>Scan to View Digital Menu</p>
        </div>
      </body>
    `;

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    if (!qrRef.current || !table) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        // 1080x1080 instagram post size for great quality
        canvas.width = 1080;
        canvas.height = 1080;
        
        if (ctx) {
          // Background Gradient
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, "#FFF8F0"); // culinary-card
          grad.addColorStop(1, "#FDFBF7"); // culinary-background
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add a subtle border inside
          ctx.strokeStyle = "#E6D9C8";
          ctx.lineWidth = 4;
          ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
          
          // Brand Name
          ctx.fillStyle = "#B7791F";
          ctx.font = "bold 80px serif"; // Simulating Cormorant Garamond
          ctx.textAlign = "center";
          ctx.fillText(activeRestaurantName, canvas.width / 2, 180);

          // Table Number
          ctx.fillStyle = "#334155";
          ctx.font = "bold 60px sans-serif";
          ctx.fillText(`Table ${table.tableNumber}`, canvas.width / 2, 280);
          
          // Draw QR (Scale it up)
          const qrSize = 600;
          const xOffset = (canvas.width - qrSize) / 2;
          const yOffset = 340;
          ctx.drawImage(img, xOffset, yOffset, qrSize, qrSize);
          
          // Footer text
          ctx.font = "bold 40px sans-serif";
          ctx.fillStyle = "#64748b";
          ctx.fillText("Scan to View Digital Menu", canvas.width / 2, 1020);
        }

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `table-${table.tableNumber}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.src = url;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-culinary-primary mb-4" />
        <p className="text-culinary-muted animate-pulse">Loading QR Code...</p>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-cormorant font-bold text-culinary-text">Table not found</h2>
        <Button onClick={() => router.push("/dashboard/tables")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tables
        </Button>
      </div>
    );
  }

  const targetUrl = `${origin}/menu/${table.id}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          onClick={() => router.push("/dashboard/tables")} 
          variant="ghost" 
          className="rounded-full w-10 h-10 p-0 text-culinary-muted hover:text-culinary-text hover:bg-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-cormorant font-bold text-culinary-text">QR Preview</h1>
          <p className="text-culinary-muted mt-1 text-sm">
            Download or print the QR code for Table {table.tableNumber}.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Preview Card */}
        <div className="bg-gradient-to-br from-culinary-card via-white to-culinary-primary/10 border-2 border-culinary-border/50 rounded-3xl p-10 flex flex-col items-center justify-center shadow-xl shadow-culinary-primary/10">
          <div className="text-center space-y-8 w-full">
            <div>
              <h2 className="font-cormorant text-4xl font-bold text-culinary-primary tracking-tight">
                {activeRestaurantName}
              </h2>
              <p className="text-xl font-semibold text-culinary-muted mt-2">
                Table {table.tableNumber}
              </p>
            </div>

            <div 
              ref={qrRef} 
              className="bg-white p-6 rounded-2xl border-2 border-dashed border-culinary-primary/40 shadow-sm inline-block mx-auto transition-transform hover:scale-105 duration-300"
            >
              <QRCode value={targetUrl} size={250} level="H" fgColor="#B7791F" />
            </div>

            <p className="text-lg font-medium text-culinary-muted/80">
              Scan to View Digital Menu
            </p>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white/90 backdrop-blur-md border border-culinary-border/50 rounded-3xl p-8 shadow-sm flex flex-col justify-center space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-culinary-text mb-2">QR Code Actions</h3>
            <p className="text-sm text-culinary-muted">
              You can print this QR code directly or download a high-quality image to place on your tables.
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleDownload} 
              className="w-full py-8 text-lg rounded-2xl bg-culinary-primary hover:bg-culinary-secondary text-white shadow-lg shadow-culinary-primary/20 transition-all hover:-translate-y-1"
            >
              <Download className="mr-3 h-6 w-6" /> Download High-Res QR
            </Button>
            
            <Button 
              onClick={handlePrint} 
              variant="outline" 
              className="w-full py-8 text-lg rounded-2xl border-2 border-culinary-border/60 hover:bg-culinary-primary/5 hover:text-culinary-primary hover:border-culinary-primary/30 transition-all"
            >
              <Printer className="mr-3 h-6 w-6" /> Print QR Code
            </Button>
          </div>

          <div className="pt-6 border-t border-culinary-border/50">
            <h4 className="text-sm font-semibold text-culinary-text mb-2">Target URL</h4>
            <div className="bg-culinary-background/50 p-4 rounded-xl border border-culinary-border/30 overflow-x-auto">
              <code className="text-xs text-blue-600 font-mono whitespace-nowrap">
                {targetUrl}
              </code>
            </div>
            <p className="text-xs text-culinary-muted mt-2">
              This URL is public and allows customers to view the menu without logging in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
