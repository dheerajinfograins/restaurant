"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { IProduct } from "@/modules/product/types";
import { Loader2 } from "lucide-react";

interface DeleteProductDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly product: IProduct | null;
  readonly onSuccess: () => void;
}

export function DeleteProductDialog({
  isOpen,
  onClose,
  product,
  onSuccess,
}: DeleteProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function onDelete() {
    if (!product) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`/api/products/${product.id}`);
      toast.success("Product deleted successfully");
      onSuccess();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "An error occurred. Please try again."
        );
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-cormorant text-2xl">Delete Product?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure? This action cannot be undone. This will permanently delete the product{' '}
              <strong className="text-culinary-text ml-1">{product?.name}</strong>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }} 
            className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
