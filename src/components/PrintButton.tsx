"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComponentProps } from "react";

interface PrintButtonProps extends ComponentProps<typeof Button> {
  label?: string;
}

export function PrintButton({ label = "Print", variant = "outline", size = "sm", className, ...props }: Readonly<PrintButtonProps>) {
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={() => window.print()} 
      className={className}
      {...props}
    >
      <Printer className="w-4 h-4 mr-2" /> 
      {label}
    </Button>
  );
}
