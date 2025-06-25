import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllSuppliers,
  addSupplier,
  createRestockRecord,
  getRestockRecords,
  getAllProducts,
  deleteSupplier,
} from "@/services/firebase/pos";
import { Supplier, RestockRecord, Product } from "@/types/pos";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import {
  Box,
  Plus,
  Check,
  ChevronsUpDown,
  Trash2,
  Truck,
  Pencil,
} from "lucide-react";
import Back from "@/components/back";
import { cn } from "@/lib/utils";
import Directive from "@/components/directive";
import { db } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [restockRecords, setRestockRecords] = useState<RestockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [restockOpen, setRestockOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [restock, setRestock] = useState({
    productId: "",
    supplierId: "",
    quantity: "",
    costPrice: "",
    invoiceNumber: "",
    notes: "",
  });
  const [productOpen, setProductOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [editMode, setEditMode] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedSuppliers, fetchedProducts, fetchedRestockRecords] =
        await Promise.all([
          getAllSuppliers(),
          getAllProducts(),
          getRestockRecords(),
        ]);
      setSuppliers(fetchedSuppliers);
      setProducts(fetchedProducts);
      setRestockRecords(fetchedRestockRecords);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async () => {
    try {
      if (!newSupplier.name) {
        toast.error("Supplier name is required");
        return;
      }

      await addSupplier(newSupplier);
      toast.success("Supplier added successfully");
      setAddSupplierOpen(false);
      setNewSupplier({ name: "", phone: "", email: "", address: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add supplier");
      console.error(error);
    }
  };

  const handleRestock = async () => {
    try {
      if (
        !restock.productId ||
        !restock.supplierId ||
        !restock.quantity ||
        !restock.costPrice
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const product = products.find((p) => p.id === restock.productId);
      const supplier = suppliers.find((s) => s.id === restock.supplierId);

      if (!product || !supplier || !user) {
        toast.error("Invalid product or supplier");
        return;
      }

      const quantity = parseInt(restock.quantity);
      const costPrice = parseFloat(restock.costPrice);
      const totalCost = quantity * costPrice;

      const restockData = {
        productId: restock.productId,
        productName: product.name,
        supplierId: restock.supplierId,
        supplierName: supplier.name,
        quantity,
        costPrice,
        totalCost,
        invoiceNumber: restock.invoiceNumber,
        notes: restock.notes,
        userId: user.uid,
        userName: user.displayName || "Unknown User",
      };

      await createRestockRecord(restockData);
      toast.success("Stock updated successfully");
      setRestockOpen(false);
      setRestock({
        productId: "",
        supplierId: "",
        quantity: "",
        costPrice: "",
        invoiceNumber: "",
        notes: "",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to update stock");
      console.error(error);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      await deleteSupplier(supplierToDelete.id);
      toast.success("Supplier deleted successfully");
      setDeleteConfirmOpen(false);
      setSupplierToDelete(null);
      fetchData();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete supplier");
      }
      console.error(error);
    }
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      await updateDoc(
        doc(db, "suppliers", selectedSupplier.id),
        editedSupplier
      );
      toast.success("Supplier updated successfully");
      setEditMode(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to update supplier");
      console.error(error);
    }
  };

  const handleSupplierClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setEditedSupplier({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-950 h-screen">
      <div
        style={{ border: "", padding: "1.5rem" }}
        className="flex justify-between items-center"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Back />
          <h1 className="text-2xl font-bold">Suppliers </h1>
        </div>

        <div className="flex gap-2">
          <Button
            style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
            onClick={() => setRestockOpen(true)}
          >
            <Box />
            Restock
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          style={{ border: "" }}
          className="flex justify-center items-center h-64"
        >
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Suppliers Table */}
          <div style={{ border: "", padding: "1rem" }}>
            <h2 className="text-xl font-semibold mb-4">Suppliers</h2>
            <div className="border rounded-lg">
              {suppliers.map((supplier) => (
                <Directive
                  key={supplier.id}
                  id_subtitle={supplier.id}
                  icon={<Truck color="goldenrod" />}
                  title={supplier.name}
                  onClick={() => handleSupplierClick(supplier)}
                />
              ))}
            </div>
          </div>

          {/* Restock Records Table */}
          <div style={{ margin: "1rem" }}>
            <h2 className="text-xl font-semibold mb-4">Recent Restock</h2>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Invoice #</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restockRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(record.date, "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{record.productName}</TableCell>
                      <TableCell>{record.supplierName}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>OMR {record.costPrice.toFixed(3)}</TableCell>
                      <TableCell>OMR {record.totalCost.toFixed(3)}</TableCell>
                      <TableCell>{record.invoiceNumber || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <Button
        style={{
          paddingLeft: "1rem",
          paddingRight: "1rem",
          position: "absolute",
          bottom: "0",
          right: "0",
          margin: "2rem",
        }}
        onClick={() => setAddSupplierOpen(true)}
      >
        <Plus />
        New Supplier
      </Button>

      {/* Add Supplier Dialog */}
      <Dialog open={addSupplierOpen} onOpenChange={setAddSupplierOpen}>
        <DialogContent className="bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newSupplier.name}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newSupplier.phone}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newSupplier.email}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newSupplier.address}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, address: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSupplierOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Restock Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    style={{}}
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className=" justify-between w-75"
                  >
                    <span className=" truncate overflow-ellipsis">
                      {restock.productId
                        ? products.find(
                            (product) => product.id === restock.productId
                          )?.name
                        : "Select product..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      style={{ background: "none" }}
                      placeholder="Search product..."
                    />
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {products.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => {
                            setRestock({ ...restock, productId: product.id });
                            setProductOpen(false);
                          }}
                          className="truncate"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              restock.productId === product.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierOpen}
                    className="w-75 justify-between"
                  >
                    <span className="truncate">
                      {restock.supplierId
                        ? suppliers.find(
                            (supplier) => supplier.id === restock.supplierId
                          )?.name
                        : "Select supplier..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput
                      style={{ background: "none" }}
                      placeholder="Search supplier..."
                    />
                    <CommandEmpty>No supplier found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {suppliers.map((supplier) => (
                        <CommandItem
                          key={supplier.id}
                          value={supplier.name}
                          onSelect={() => {
                            setRestock({ ...restock, supplierId: supplier.id });
                            setSupplierOpen(false);
                          }}
                          className="truncate"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 shrink-0",
                              restock.supplierId === supplier.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {supplier.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={restock.quantity}
                onChange={(e) =>
                  setRestock({ ...restock, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price (OMR) *</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.001"
                min="0"
                value={restock.costPrice}
                onChange={(e) =>
                  setRestock({ ...restock, costPrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={restock.invoiceNumber}
                onChange={(e) =>
                  setRestock({ ...restock, invoiceNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={restock.notes}
                onChange={(e) =>
                  setRestock({ ...restock, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter style={{ display: "flex" }}>
            <Button variant="outline" onClick={() => setRestockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestock}>Restock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Details/Edit Dialog */}
      <Dialog
        open={!!selectedSupplier}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSupplier(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-950 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{editMode ? "Edit Supplier" : "Supplier Details"}</span>
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>

          <div className="space-y-4">
            {editMode ? (
              // Edit Mode
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editedSupplier.name}
                    onChange={(e) =>
                      setEditedSupplier({
                        ...editedSupplier,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editedSupplier.phone}
                    onChange={(e) =>
                      setEditedSupplier({
                        ...editedSupplier,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editedSupplier.email}
                    onChange={(e) =>
                      setEditedSupplier({
                        ...editedSupplier,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editedSupplier.address}
                    onChange={(e) =>
                      setEditedSupplier({
                        ...editedSupplier,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              // View Mode
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedSupplier?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {selectedSupplier?.phone || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {selectedSupplier?.email || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {selectedSupplier?.address || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Added On</p>
                  <p className="font-medium">
                    {selectedSupplier?.createdAt
                      ? format(selectedSupplier.createdAt, "dd/MM/yyyy")
                      : "-"}
                  </p>
                </div>
              </>
            )}
          </div>

          {!editMode && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => setEditMode(true)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                className="hover:text-red-500"
                onClick={() => {
                  setSupplierToDelete(selectedSupplier);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}

          <DialogFooter>
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                    if (selectedSupplier) {
                      setEditedSupplier({
                        name: selectedSupplier.name,
                        phone: selectedSupplier.phone || "",
                        email: selectedSupplier.email || "",
                        address: selectedSupplier.address || "",
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSupplier}>Save Changes</Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSupplier(null);
                  setEditMode(false);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Delete Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {supplierToDelete?.name}? This
              action cannot be undone.
              {"\n"}Note: Suppliers with existing restock records cannot be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSupplierToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSupplier}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
