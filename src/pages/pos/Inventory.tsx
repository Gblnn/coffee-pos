import Back from "@/components/back";
import { Icons } from "@/components/ui/icons";
import { useAuth } from "@/context/AuthContext";
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
  getAllSuppliers,
  createRestockRecord,
} from "@/services/firebase/pos";
import {
  getCachedProducts,
  saveProductsToCache,
} from "@/services/pos/offlineProducts";
import { Product, Supplier } from "@/types/pos";
import { AnimatePresence, motion } from "framer-motion";
import { Barcode, Box, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface NewProduct {
  barcode: string;
  name: string;
  price: string;
  stock: string;
  category: string;
  minStock: string;
}

const initialNewProduct: NewProduct = {
  barcode: "",
  name: "",
  price: "",
  stock: "",
  category: "",
  minStock: "",
};

export const Inventory = () => {
  const { isOnline, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  // const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  // const [filterLowStock, setFilterLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>(initialNewProduct);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    category: "",
    minStock: "",
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [restockOpen, setRestockOpen] = useState(false);
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

  // Debounced search implementation without lodash
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const handleSearch = (value: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Load products from cache and/or network
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        // First try to get cached products
        const cachedProducts = getCachedProducts();
        if (cachedProducts) {
          setProducts(cachedProducts);
          setLoading(false);
        }

        // If online, fetch fresh data
        if (isOnline) {
          const freshProducts = await getAllProducts();
          setProducts(freshProducts);
          saveProductsToCache(freshProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [isOnline]);

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const fetchedSuppliers = await getAllSuppliers();
        setSuppliers(fetchedSuppliers);
      } catch (error) {
        console.error("Error loading suppliers:", error);
        toast.error("Failed to load suppliers");
      }
    };

    if (isOnline) {
      loadSuppliers();
    }
  }, [isOnline]);

  // Filter and sort products
  const filteredAndSortedProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase());
    // const matchesLowStock =
    //   !filterLowStock || product.stock < (product.minStock || 10);
    return matchesSearch;
    // && matchesLowStock;
  });
  // .sort((a, b) => {
  //   const aValue = a[sortBy];
  //   const bValue = b[sortBy];
  //   const order = sortOrder === "asc" ? 1 : -1;
  //   return typeof aValue === "string"
  //     ? aValue.localeCompare(bValue as string) * order
  //     : ((aValue as number) - (bValue as number)) * order;
  // });

  const handleInputChange = (field: keyof NewProduct, value: string) => {
    // For numeric fields, only allow numbers or empty string
    if (
      (field === "stock" || field === "minStock" || field === "price") &&
      value !== "" &&
      isNaN(Number(value))
    ) {
      return;
    }

    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast.error("Cannot add products while offline");
      return;
    }

    try {
      setLoading(true);

      // Validate stock value
      const stockValue =
        newProduct.stock === "" ? 0 : parseInt(newProduct.stock, 10);
      console.log("Stock value:", stockValue, "Raw input:", newProduct.stock);

      if (
        isNaN(stockValue) ||
        stockValue < 0 ||
        !Number.isInteger(stockValue)
      ) {
        toast.error("Please enter a valid stock quantity (whole number)");
        return;
      }

      const productData = {
        barcode: newProduct.barcode,
        name: newProduct.name,
        price: newProduct.price === "" ? 0 : parseFloat(newProduct.price),
        stock: stockValue,
        category: newProduct.category,
        minStock:
          newProduct.minStock === "" ? 0 : parseInt(newProduct.minStock, 10),
      };

      console.log("Product data:", productData);

      await addProduct(productData);

      // Refresh products list
      const freshProducts = await getAllProducts();
      setProducts(freshProducts);
      saveProductsToCache(freshProducts);

      setShowAddModal(false);
      setNewProduct(initialNewProduct);
      toast.success("Product added successfully");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!isOnline) {
      toast.error("Cannot delete products while offline");
      return;
    }

    try {
      setLoading(true);
      await deleteProduct(product.id);

      // Update local state
      const updatedProducts = products.filter((p) => p.id !== product.id);
      setProducts(updatedProducts);
      saveProductsToCache(updatedProducts);

      toast.success("Product deleted successfully");
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({
      name: product.name,
      barcode: product.barcode,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || "",
      minStock: (product.minStock || "").toString(),
    });
  };

  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const updatedProduct = {
        name: editedProduct.name,
        barcode: editedProduct.barcode,
        price: parseFloat(editedProduct.price),
        stock: parseInt(editedProduct.stock),
        category: editedProduct.category,
        minStock: editedProduct.minStock ? parseInt(editedProduct.minStock) : 0,
      };

      await updateProduct(selectedProduct.id, updatedProduct);

      // Update local state and cache
      const freshProducts = await getAllProducts();
      setProducts(freshProducts);
      saveProductsToCache(freshProducts);

      toast.success("Product updated successfully");
      setEditMode(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  const handleRestock = async () => {
    if (!isOnline) {
      toast.error("Cannot restock while offline");
      return;
    }

    if (
      !restock.productId ||
      !restock.supplierId ||
      !restock.quantity ||
      !restock.costPrice
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const quantity = parseInt(restock.quantity);
      const costPrice = parseFloat(restock.costPrice);

      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity");
        return;
      }

      if (isNaN(costPrice) || costPrice < 0) {
        toast.error("Please enter a valid cost price");
        return;
      }

      // Create restock record
      const product = products.find((p) => p.id === restock.productId);
      const supplier = suppliers.find((s) => s.id === restock.supplierId);

      if (!product || !supplier) {
        toast.error("Product or supplier not found");
        return;
      }

      await createRestockRecord({
        productId: restock.productId,
        productName: product.name,
        supplierId: restock.supplierId,
        supplierName: supplier.name,
        quantity,
        costPrice,
        totalCost: quantity * costPrice,
        invoiceNumber: restock.invoiceNumber,
        notes: restock.notes,
        userId: user?.uid || "",
        userName: user?.displayName || "",
      });

      // Update product stock
      await updateProduct(product.id, {
        ...product,
        stock: product.stock + quantity,
      });

      // Refresh products list
      const freshProducts = await getAllProducts();
      setProducts(freshProducts);
      saveProductsToCache(freshProducts);

      toast.success("Product restocked successfully");
      setRestockOpen(false);
      setRestock({
        productId: "",
        supplierId: "",
        quantity: "",
        costPrice: "",
        invoiceNumber: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error restocking product:", error);
      toast.error("Failed to restock product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
      className="flex flex-col h-screen bg-white dark:bg-gray-950"
    >
      {/* Header and Controls */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Back />
            <Box color="crimson" />
            <h1 style={{ fontSize: "1.5rem" }} className="">
              Inventory
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
              onClick={() => setRestockOpen(true)}
            >
              <Box className="h-4 w-4 mr-2" />
              Restock
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name or barcode..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Products List */}
      <div
        style={{ border: "", paddingBottom: "6rem" }}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredAndSortedProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start w-full">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <p className="text-sm flex items-center gap-1 truncate opacity-60">
                        <Barcode className="h-4 w-4" />
                        {product.barcode}
                      </p>
                    </div>
                    {/* <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToDelete(product);
                      }}
                      className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button> */}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="font-semibold">
                      OMR {product.price.toFixed(3)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 opacity-60" />
                      <span
                        className={`font-medium ${
                          product.stock < (product.minStock || 10)
                            ? "text-red-600"
                            : ""
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAndSortedProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64">
            <Icons.search className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm opacity-60">No products found</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center h-64">
            <Icons.spinner className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      {/* Add Product Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
      >
        <Icons.plus className="h-6 w-6" />
      </button>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="bg-white dark:bg-gray-950 fixed inset-0 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className=" rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
          >
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Product</h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="opacity-70 hover:opacity-100"
                >
                  <Icons.close className="h-5 w-5" />
                </button>
              </div>

              {/* Form fields */}
              {[
                "Barcode",
                "Name",
                "Price (OMR)",
                "Initial Stock",
                "Category",
                "Minimum Stock Level",
              ].map((label) => {
                const field = label
                  .toLowerCase()
                  .split(" ")[0] as keyof NewProduct;
                return (
                  <div key={label}>
                    <label className="block text-sm font-medium mb-1 opacity-70">
                      {label}
                    </label>
                    <input
                      value={newProduct[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                  </div>
                );
              })}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Icons.spinner className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-950 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-2">Delete Product</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to delete "{productToDelete.name}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-2 border rounded text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                style={{ background: "brown" }}
                onClick={() => handleDeleteProduct(productToDelete)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <Icons.spinner className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Product Details/Edit Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
            setEditMode(false);
          }
        }}
      >
        <DialogContent className="bg-white dark:bg-gray-950 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{editMode ? "Edit Product" : "Product Details"}</span>
            </DialogTitle>
          </DialogHeader>
          <DialogDescription />

          <div className="space-y-4">
            {editMode ? (
              // Edit Mode
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={editedProduct.name}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-barcode">Barcode *</Label>
                  <Input
                    id="edit-barcode"
                    value={editedProduct.barcode}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        barcode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (OMR) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.001"
                    min="0"
                    value={editedProduct.price}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        price: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock *</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    min="0"
                    value={editedProduct.stock}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        stock: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editedProduct.category}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        category: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-minStock">Minimum Stock Level</Label>
                  <Input
                    id="edit-minStock"
                    type="number"
                    min="0"
                    value={editedProduct.minStock}
                    onChange={(e) =>
                      setEditedProduct({
                        ...editedProduct,
                        minStock: e.target.value,
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
                  <p className="font-medium">{selectedProduct?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-medium">{selectedProduct?.barcode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="font-medium">
                    OMR {selectedProduct?.price.toFixed(3)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium">{selectedProduct?.stock}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {selectedProduct?.category || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Minimum Stock</p>
                  <p className="font-medium">
                    {selectedProduct?.minStock || "-"}
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
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                style={{ flex: 1 }}
                className="hover:text-red-500"
                onClick={() => {
                  setProductToDelete(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
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
                    if (selectedProduct) {
                      setEditedProduct({
                        name: selectedProduct.name,
                        barcode: selectedProduct.barcode,
                        price: selectedProduct.price.toString(),
                        stock: selectedProduct.stock.toString(),
                        category: selectedProduct.category || "",
                        minStock: (selectedProduct.minStock || "").toString(),
                      });
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditProduct}>Save Changes</Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProduct(null);
                  setEditMode(false);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="bg-white dark:bg-gray-950">
          <DialogHeader>
            <DialogTitle>Restock Inventory</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product *</Label>
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className="justify-between w-full"
                  >
                    <span className="truncate overflow-ellipsis">
                      {restock.productId
                        ? products.find(
                            (product) => product.id === restock.productId
                          )?.name
                        : "Select product..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search product..."
                      className="h-9"
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
                    className="justify-between w-full"
                  >
                    <span className="truncate overflow-ellipsis">
                      {restock.supplierId
                        ? suppliers.find(
                            (supplier) => supplier.id === restock.supplierId
                          )?.name
                        : "Select supplier..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search supplier..."
                      className="h-9"
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestockOpen(false);
                setRestock({
                  productId: "",
                  supplierId: "",
                  quantity: "",
                  costPrice: "",
                  invoiceNumber: "",
                  notes: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRestock} disabled={loading}>
              {loading ? (
                <Icons.spinner className="h-4 w-4 animate-spin" />
              ) : (
                "Restock"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
