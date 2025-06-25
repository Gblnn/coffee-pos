import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { CreditTransaction } from "@/types/pos";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RecordPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => Promise<void>;
  isLoading: boolean;
  transaction: CreditTransaction;
}

export function RecordPaymentDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  transaction,
}: RecordPaymentDialogProps) {
  const [amount, setAmount] = React.useState<string>("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setAmount(transaction.remainingAmount.toString());
      setNote("");
    }
  }, [isOpen, transaction.remainingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;
    await onSubmit(paymentAmount, note);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-950">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {transaction.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  if (
                    value === "" ||
                    (numValue > 0 && numValue <= transaction.remainingAmount)
                  ) {
                    setAmount(value);
                  }
                }}
                placeholder="Enter payment amount"
                required
                step="0.01"
                min="0.01"
                max={transaction.remainingAmount}
              />
              <p className="text-sm text-gray-500">
                Remaining amount: OMR {transaction.remainingAmount.toFixed(3)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this payment"
                className="resize-none"
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
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
