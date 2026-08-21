"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Staff } from "../types";

interface StaffDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff | null;
  onConfirmDelete: () => Promise<void>;
  isSubmitting: boolean;
}

export function StaffDeleteDialog({
  isOpen,
  onOpenChange,
  staff,
  onConfirmDelete,
  isSubmitting,
}: Readonly<StaffDeleteDialogProps>) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 font-cormorant">
            Delete Staff Member
          </DialogTitle>
        </DialogHeader>
        <p className="py-2 text-xs text-gray-600">
          Are you sure you want to delete <b className="text-gray-900">{staff?.name}</b>? They will lose all access to
          the system.
        </p>
        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl"
            onClick={onConfirmDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
