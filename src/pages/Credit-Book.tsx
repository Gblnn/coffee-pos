import Back from "@/components/back";
import { RecordPaymentDialog } from "@/components/dialogs/RecordPaymentDialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import {
  getAllCreditTransactions,
  recordPayment,
} from "@/services/firebase/credit";
import { CreditTransaction } from "@/types/pos";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreditBook() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<CreditTransaction | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const allTransactions = await getAllCreditTransactions();
        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
        toast.error("Failed to load credit transactions");
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Handle recording a payment
  const handleRecordPayment = async (amount: number, note: string) => {
    if (!selectedTransaction) return;

    try {
      setIsRecordingPayment(true);

      await recordPayment(selectedTransaction.id, {
        amount,
        date: new Date().toISOString(),
        note,
      });

      // Refresh transactions list
      const updatedTransactions = await getAllCreditTransactions();
      setTransactions(updatedTransactions);

      toast.success("Payment recorded successfully");
      setShowPaymentDialog(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.customerName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.customerPhone?.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Back />
          <h1 className="text-xl">Credit Book</h1>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4">
        <div className="relative">
          {/* <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-500" /> */}
          <Input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchQuery}
            onChange={(e:any) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No credit transactions found
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTransactions.map((transaction) => (
              <div
                style={{ border: "1px solid rgba(100 100 100/ 30%)" }}
                key={transaction.id}
                className="rounded-lg bg-white dark:bg-gray-950 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{transaction.customerName}</h3>
                    {transaction.customerPhone && (
                      <p className="text-sm text-gray-500">
                        {transaction.customerPhone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      Total : {transaction.totalAmount.toFixed(3)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Remaining : {transaction.remainingAmount.toFixed(3)}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      transaction.status === "paid"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                        : transaction.status === "partially_paid"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                    }`}
                  >
                    {transaction.status === "paid"
                      ? "Paid"
                      : transaction.status === "partially_paid"
                      ? "Partially Paid"
                      : "Pending"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setShowPaymentDialog(true);
                    }}
                    disabled={transaction.status === "paid"}
                  >
                    Record Payment
                  </Button>
                </div>

                {/* Payment History */}
                {transaction.payments.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">
                      Payment History
                    </h4>
                    <div className="space-y-2">
                      {transaction.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                            {payment.note && (
                              <span className="text-gray-500">
                                - {payment.note}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">
                            ₹{payment.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      {selectedTransaction && (
        <RecordPaymentDialog
          isOpen={showPaymentDialog}
          onClose={() => {
            setShowPaymentDialog(false);
            setSelectedTransaction(null);
          }}
          onSubmit={handleRecordPayment}
          isLoading={isRecordingPayment}
          transaction={selectedTransaction}
        />
      )}
    </div>
  );
}
