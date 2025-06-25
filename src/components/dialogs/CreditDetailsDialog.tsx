import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerDetails {
  name: string;
  phone?: string;
}

interface CreditDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: CustomerDetails) => Promise<void>;
  isLoading: boolean;
  total: number;
  existingCustomerName?: string;
}

export function CreditDetailsDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  total,
  existingCustomerName = "",
}: CreditDetailsDialogProps) {
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setName(existingCustomerName || "");
      setPhone("");
    }
  }, [isOpen, existingCustomerName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, phone: phone || undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Credit Purchase</DialogTitle>
            <DialogDescription style={{ marginTop: "0.75rem" }}>
              Enter customer details for credit amount of
              <br /> <b>OMR</b> {total.toFixed(3)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  existingCustomerName
                    ? "Using existing customer"
                    : "Enter customer name"
                }
                required
                disabled={!!existingCustomerName}
              />
              {existingCustomerName && (
                <p className="text-sm text-muted-foreground">
                  Using existing customer name
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter
            style={{
              borderTop: "1px solid rgba(100 100 100/ 20%)",
              paddingTop: "0.5rem",
              display: "flex",
            }}
          >
            <Button
              style={{ flex: 1 }}
              variant="outline"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-gray-950 dark:bg-white"
              style={{ flex: 1 }}
              type="submit"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
