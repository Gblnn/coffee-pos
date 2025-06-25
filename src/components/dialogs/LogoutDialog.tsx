import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function LogoutDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: LogoutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle>Confirm Logout</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <DialogFooter
          style={{
            borderTop: "1px solid rgba(100 100 100/ 20%)",
            paddingTop: "0.5rem",
            display: "flex",
            marginTop: "1rem",
          }}
        >
          <Button style={{ flex: 1 }} onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            style={{ flex: 1, background: "brown" }}
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
