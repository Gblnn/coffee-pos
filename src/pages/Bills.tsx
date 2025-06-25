import { useEffect, useState } from "react";
import { getAllBills } from "@/services/firebase/pos";
import { CustomerPurchase } from "@/types/pos";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import Back from "@/components/back";
import { ChevronLeft, ChevronRight, Ticket, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Bills() {
  const [bills, setBills] = useState<CustomerPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBill, setSelectedBill] = useState<CustomerPurchase | null>(
    null
  );
  const itemsPerPage = 10;

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const fetchedBills = await getAllBills();
      setBills(fetchedBills);
    } catch (error) {
      toast.error("Failed to fetch bills");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bills based on search query and payment method
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment =
      paymentFilter === "all" || bill.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePDF = (bill: CustomerPurchase) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Add header
      doc.setFontSize(20);
      doc.text("Bill Receipt", pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Add bill details
      doc.setFontSize(12);
      doc.text(`Bill ID: ${bill.id}`, margin, yPos);
      yPos += 7;
      doc.text(`Customer: ${bill.customerName}`, margin, yPos);
      yPos += 7;
      doc.text(
        `Date: ${format(
          typeof bill.date === "string" ? new Date(bill.date) : bill.date,
          "dd/MM/yyyy HH:mm"
        )}`,
        margin,
        yPos
      );
      yPos += 7;
      doc.text(`Cashier: ${bill.userName}`, margin, yPos);
      yPos += 7;
      doc.text(
        `Payment Method: ${bill.paymentMethod.toUpperCase()}`,
        margin,
        yPos
      );
      yPos += 15;

      // Add items table
      const tableData = bill.items.map((item) => [
        item.name,
        item.quantity.toString(),
        item.price.toFixed(3),
        (item.quantity * item.price).toFixed(3),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Item", "Qty", "Price", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: margin },
      });

      // Add total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text(
        `Total Amount: ${bill.total.toFixed(3)}`,
        pageWidth - margin,
        finalY,
        { align: "right" }
      );

      // Save and open PDF
      doc.save(`bill-${bill.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div
      style={{ padding: "1.25rem", border: "", height: "100svh" }}
      className="bg-white dark:bg-gray-950 "
    >
      <div
        style={{ border: "", marginBottom: "0.75rem" }}
        className="flex justify-between items-center"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Back />
          <Ticket />
          <h1 className="text-2xl font-bold">Bills</h1>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }} className="flex gap-2">
        <Input
          placeholder="Search by customer or bill ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select
          value={paymentFilter}
          onValueChange={(value) => setPaymentFilter(value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div
            style={{ border: "", flex: 1 }}
            className="flex-1 border rounded-lg"
          >
            <Table style={{ height: "100%" }}>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBills.map((bill) => (
                  <TableRow
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell>{bill.items.length} items</TableCell>
                    <TableCell>{bill.total.toFixed(3)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          bill.paymentMethod === "cash"
                            ? "bg-green-100 text-green-800"
                            : bill.paymentMethod === "card"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {bill.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(
                        typeof bill.date === "string"
                          ? new Date(bill.date)
                          : bill.date,
                        "dd/MM/yyyy HH:mm"
                      )}
                    </TableCell>
                    <TableCell>{bill.userName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{ border: "", padding: "0.75rem" }}
              className="flex justify-between items-center"
            >
              <p className="text-sm text-gray-500">
                Showing {paginatedBills.length} of {filteredBills.length} bills
              </p>
              <div className="flex gap-2 items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft />
                </Button>
                <span className="text-sm">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bill Details Dialog */}
      <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedBill.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bill ID</p>
                  <p className="font-medium">{selectedBill.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {format(
                      typeof selectedBill.date === "string"
                        ? new Date(selectedBill.date)
                        : selectedBill.date,
                      "dd/MM/yyyy HH:mm"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cashier</p>
                  <p className="font-medium">{selectedBill.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">
                    {selectedBill.paymentMethod}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.price.toFixed(3)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {(item.quantity * item.price).toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>OMR {selectedBill.subtotal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>OMR {selectedBill.tax.toFixed(3)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>OMR {selectedBill.total.toFixed(3)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => generatePDF(selectedBill)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
