"use client";

import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { RestaurantTable } from "@prisma/client";
import { Download, Printer, ExternalLink, QrCode, Copy } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

import { copyToClipboard } from "@/lib/utils";

interface TableQrModalProps {
  readonly table: (RestaurantTable & { restaurant?: { name?: string; logo?: string | null } }) | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly restaurantName?: string;
}

export default function TableQrModal({ table, isOpen, onClose, restaurantName: propRestaurantName }: TableQrModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [fetchedRestaurantName, setFetchedRestaurantName] = useState<string>("");

  useEffect(() => {
    if (!propRestaurantName && !table?.restaurant?.name && isOpen) {
      axios
        .get("/api/restaurant")
        .then((res) => {
          if (res.data?.data?.name) {
            setFetchedRestaurantName(res.data.data.name);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch restaurant name", err);
        });
    }
  }, [propRestaurantName, table?.restaurant?.name, isOpen]);

  if (!table) return null;

  const activeRestaurantName =
    propRestaurantName || table.restaurant?.name || fetchedRestaurantName || "Restaurant Menu";

  const targetUrl = `${typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/menu/${table.id}`;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(targetUrl);
    if (ok) {
      toast.success("Table digital menu link copied!");
    } else {
      toast.error("Could not copy link to clipboard");
    }
  };

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
          }
          .container { 
            text-align: center; 
            padding: 40px 30px; 
            border: 3px solid #d4af37; 
            border-radius: 24px; 
            max-width: 380px;
            background-color: #ffffff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          }
          .brand {
            font-family: 'Cormorant Garamond', serif;
            font-size: 32px;
            font-weight: 700;
            color: #b7791f;
            margin-bottom: 4px;
          }
          h1 { 
            margin-top: 0;
            margin-bottom: 24px; 
            font-size: 24px; 
            color: #111827;
          }
          .qr-wrapper {
            background: white;
            padding: 16px;
            border-radius: 16px;
            display: inline-block;
            margin-bottom: 16px;
            border: 2px dashed #d4af37;
          }
          p { 
            margin: 6px 0;
            font-size: 15px; 
            color: #4b5563; 
            font-weight: 600;
          }
          .instruction {
            font-size: 12px;
            color: #9ca3af;
            font-weight: normal;
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
          <p>Scan to View Digital Menu & Order</p>
          <span class="instruction">Point camera at QR code • No App Required</span>
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
        canvas.width = 1080;
        canvas.height = 1080;

        if (ctx) {
          // Background
          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, "#FFF8F0");
          grad.addColorStop(1, "#FFFFFF");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Border
          ctx.strokeStyle = "#d4af37";
          ctx.lineWidth = 6;
          ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

          // Brand
          ctx.fillStyle = "#b7791f";
          ctx.font = "bold 72px serif";
          ctx.textAlign = "center";
          ctx.fillText(activeRestaurantName, canvas.width / 2, 160);

          // Table Number
          ctx.fillStyle = "#111827";
          ctx.font = "bold 64px sans-serif";
          ctx.fillText(`Table ${table.tableNumber}`, canvas.width / 2, 260);

          // QR Code
          const qrSize = 580;
          const xOffset = (canvas.width - qrSize) / 2;
          const yOffset = 320;
          ctx.drawImage(img, xOffset, yOffset, qrSize, qrSize);

          // Footer
          ctx.font = "bold 42px sans-serif";
          ctx.fillStyle = "#374151";
          ctx.fillText("Scan to View Menu & Order Food", canvas.width / 2, 980);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border border-gray-200">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-culinary-primary rounded-xl border border-amber-100">
              <QrCode size={18} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-cormorant text-gray-900">
                Table {table.tableNumber} QR Code
              </DialogTitle>
              <p className="text-xs text-gray-400">Digital menu & instant table ordering code</p>
            </div>
          </div>
        </DialogHeader>

        {/* QR Visual Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-50/50 to-gray-50/50 rounded-2xl border border-amber-100/70 my-2">
          <div className="text-center mb-4">
            <h4 className="font-bold text-lg text-culinary-primary font-cormorant">
              {activeRestaurantName}
            </h4>
            <p className="text-xs font-semibold text-gray-600">Table {table.tableNumber} • {table.capacity} Seats</p>
          </div>

          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl border-2 border-dashed border-culinary-primary/40 shadow-md transition-transform hover:scale-105 duration-300"
          >
            <QRCode value={targetUrl} size={180} level="H" fgColor="#b7791f" />
          </div>

          <p className="text-xs text-gray-500 font-medium mt-3">Scan to view digital menu & order food</p>
        </div>

        {/* Direct Link Copier */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-gray-500 font-medium">
            <span>Direct Public Menu URL</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-culinary-primary hover:underline flex items-center gap-1 font-bold"
            >
              <Copy size={11} /> Copy Link
            </button>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 truncate font-mono text-[11px] text-blue-600">
            {targetUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={handleDownload}
            className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
          >
            <Download size={14} /> Download PNG
          </Button>

          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-gray-200 hover:bg-gray-50 text-gray-800 font-bold rounded-xl text-xs h-10 gap-1.5"
          >
            <Printer size={14} /> Print Table Tent
          </Button>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-center text-gray-500 hover:text-culinary-primary transition-colors pt-1"
        >
          <span>Open Public Customer Menu</span>
          <ExternalLink size={12} />
        </a>
      </DialogContent>
    </Dialog>
  );
}
