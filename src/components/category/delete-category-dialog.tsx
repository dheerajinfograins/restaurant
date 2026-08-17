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
import { ICategory } from "@/modules/category/types";
import { Loader2 } from "lucide-react";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: ICategory | null;
  onSuccess: () => void;
}

export function DeleteCategoryDialog({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<DeleteCategoryDialogProps>) {
  const [isLoading, setIsLoading] = useState(false);

  async function onDelete() {
    if (!category) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`/api/categories/${category.id}`);
      toast.success("Category deleted successfully");
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
          <AlertDialogTitle className="font-cormorant text-2xl">Delete Category?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure? This action cannot be undone. This will permanently delete the category{' '}
              <strong className="text-culinary-text ml-1">{category?.name}</strong>.
            </p>
            <div className="bg-red-50 text-red-800 p-3 rounded-md border border-red-100 flex items-center justify-between font-medium mt-2">
              <span>This category contains</span>
              <span>0 Products</span>
            </div>
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
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Category"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
