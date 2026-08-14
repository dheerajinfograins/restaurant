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

interface DeleteTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableNumber: string;
  isDeleting: boolean;
}

export default function DeleteTableDialog({
  isOpen,
  onClose,
  onConfirm,
  tableNumber,
  isDeleting,
}: Readonly<DeleteTableDialogProps>) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent className="bg-white border-culinary-border/50 shadow-xl rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-cormorant text-2xl text-culinary-text">
            Delete Table {tableNumber}?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-culinary-muted text-base">
            Are you sure you want to delete this table? This action cannot be undone, 
            and it will affect any active orders associated with this table.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
          <AlertDialogCancel
            disabled={isDeleting}
            className="rounded-xl border-culinary-border/60 hover:bg-culinary-primary/5 hover:text-culinary-primary transition-colors font-medium"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 font-medium transition-all focus:ring-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete Table"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
