"use client";

import { useEffect, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, UtensilsCrossed, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { RestaurantTable } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";

const tableSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required").max(15, "Table number is too long"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1").max(50, "Capacity seems unusually high"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]).default("AVAILABLE"),
});

type TableFormValues = z.infer<typeof tableSchema>;

interface TableFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (data: TableFormValues) => Promise<void>;
  readonly initialData?: RestaurantTable | null;
  readonly isLoading?: boolean;
}

export default function TableFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: TableFormModalProps) {
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema) as unknown as Resolver<TableFormValues>,
    defaultValues: {
      tableNumber: "",
      capacity: 4,
      status: "AVAILABLE",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          tableNumber: initialData.tableNumber,
          capacity: initialData.capacity,
          status: initialData.status,
        });
      } else {
        form.reset({
          tableNumber: "",
          capacity: 4,
          status: "AVAILABLE",
        });
      }
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (values: TableFormValues) => {
    await onSubmit(values);
  };

  const submitButtonText = initialData ? "Update Table" : "Create Table";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[380px] sm:w-[460px] overflow-y-auto bg-white border-l border-gray-200 shadow-2xl p-0">
        <div className="p-6">
          <SheetHeader className="border-b border-gray-100 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-culinary-primary font-bold text-xl flex items-center justify-center border border-amber-200/60 shadow-sm shrink-0 font-cormorant">
                {form.watch("tableNumber") ? form.watch("tableNumber").slice(0, 2).toUpperCase() : "T"}
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold font-cormorant text-gray-900">
                  {initialData ? `Edit Table ${initialData.tableNumber}` : "Add Dining Table"}
                </SheetTitle>
                <p className="text-xs text-gray-400 mt-0.5">
                  {initialData
                    ? "Update table seating capacity and operational status"
                    : "Register a dining table and auto-generate QR menu"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 text-xs">
              
              {/* Table Name / Number */}
              <FormField
                control={form.control}
                name="tableNumber"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-bold text-gray-700">
                      Table Number / Label *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Table 1, T-4, VIP Balcony"
                        className="rounded-xl border-gray-200 text-xs py-2.5 bg-white font-semibold"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-gray-400">
                      Shown to guests upon scanning QR and printed on invoices.
                    </p>
                    <FormMessage className="text-rose-500 text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Seating Capacity */}
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Users size={12} className="text-gray-400" /> Guest Capacity *
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="4"
                          className="rounded-xl border-gray-200 text-xs py-2.5 bg-white font-semibold"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />

                {/* Initial Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-xs font-bold text-gray-700">
                        Operational Status *
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-gray-200 text-xs bg-white py-2.5">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-gray-200 text-xs">
                          <SelectItem value="AVAILABLE" className="font-semibold text-emerald-700">
                            🟢 Available
                          </SelectItem>
                          <SelectItem value="OCCUPIED" className="font-semibold text-rose-700">
                            🔴 Occupied
                          </SelectItem>
                          <SelectItem value="RESERVED" className="font-semibold text-amber-700">
                            🟡 Reserved
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-rose-500 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* QR Auto-Generation Banner */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-culinary-primary rounded-xl shrink-0 mt-0.5">
                  <Sparkles size={16} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-amber-950">Instant Digital QR Menu</h4>
                  <p className="text-[11px] text-amber-800/80">
                    A unique QR code is generated instantly. Guests can scan to view food items and place dine-in orders.
                  </p>
                </div>
              </div>

              <SheetFooter className="mt-8 border-t border-gray-100 pt-5 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="w-full text-xs rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="w-full bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs py-2.5"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving Table...</>
                  ) : (
                    submitButtonText
                  )}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
