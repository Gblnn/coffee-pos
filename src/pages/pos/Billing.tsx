import Back from "@/components/back";
import { CreditDetailsDialog } from "@/components/dialogs/CreditDetailsDialog";
import IndexDropDown from "@/components/index-dropdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { createCreditTransaction } from "@/services/firebase/credit";
import {
  createCustomer,
  createCustomerPurchase,
  getAllProducts,
  getProductByBarcode,
  searchCustomers,
  updateCustomerPurchaseStats,
  updateProductStock,
} from "@/services/firebase/pos";
import {
  getCachedCustomers,
  saveCustomersToCache,
  updateCachedCustomer,
} from "@/services/pos/offlineCustomers";
import {
  getCachedProducts,
  saveProductsToCache,
  updateCachedProduct,
} from "@/services/pos/offlineProducts";
import { BillItem, Customer, CustomerPurchase, Product } from "@/types/pos";
import { collection, getDocs } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeftToLine,
  Barcode,
  BookX,
  Box,
  Check,
  ChevronUp,
  LoaderCircle,
  MinusCircle,
  Package,
  PackageOpen,
  PackageX,
  PenLine,
  Ticket,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export const Billing = () => {
  const { user, userData, isOnline } = useAuth();
  const effectiveUser = user || (userData ? { uid: userData.uid } : null);

  const [items, setItems] = useState<BillItem[]>([]);
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTaxEnabled, setIsTaxEnabled] = useState(true);
  const [productsCache, setProductsCache] = useState<Record<string, Product>>(
    {}
  );
  const [isCacheLoading, setIsCacheLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  // const [stockSortBy, setStockSortBy] = useState<"name" | "stock" | "price">(
  //   "name"
  // );
  // const [stockSortOrder, setStockSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>(
    []
  );
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const customerInputRef = useRef<HTMLInputElement>(null);
  const customerSuggestionsRef = useRef<HTMLDivElement>(null);
  const [customersCache, setCustomersCache] = useState<
    Record<string, Customer>
  >({});
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [isProcessingCredit, setIsProcessingCredit] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<
    "cash" | "card" | "credit" | null
  >(null);
  const [creditDetails, setCreditDetails] = useState<{
    customerName: string;
    customerPhone?: string;
  } | null>(null);

  // Add this state for dynamic positioning
  const [suggestionsPosition, setSuggestionsPosition] = useState<
    "top" | "bottom"
  >("bottom");
  const [customerSuggestionsPosition, setCustomerSuggestionsPosition] =
    useState<"top" | "bottom">("bottom");

  // Add state for selected suggestion index
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedCustomerSuggestionIndex, setSelectedCustomerSuggestionIndex] =
    useState(-1);

  // Add keyboard navigation handlers
  const handleKeyDown = (
    e: React.KeyboardEvent,
    type: "product" | "customer"
  ) => {
    if (type === "product" && showSuggestions) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const newProductIndex =
            selectedSuggestionIndex < suggestions.length - 1
              ? selectedSuggestionIndex + 1
              : selectedSuggestionIndex;
          setSelectedSuggestionIndex(newProductIndex);
          // Scroll selected item into view
          const productElement = suggestionsRef.current?.children[
            newProductIndex
          ] as HTMLElement;
          if (productElement) {
            productElement.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevProductIndex =
            selectedSuggestionIndex > 0
              ? selectedSuggestionIndex - 1
              : selectedSuggestionIndex;
          setSelectedSuggestionIndex(prevProductIndex);
          // Scroll selected item into view
          const prevProductElement = suggestionsRef.current?.children[
            prevProductIndex
          ] as HTMLElement;
          if (prevProductElement) {
            prevProductElement.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedSuggestionIndex >= 0 &&
            selectedSuggestionIndex < suggestions.length
          ) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    } else if (type === "customer" && showCustomerSuggestions) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const newCustomerIndex =
            selectedCustomerSuggestionIndex < customerSuggestions.length - 1
              ? selectedCustomerSuggestionIndex + 1
              : selectedCustomerSuggestionIndex;
          setSelectedCustomerSuggestionIndex(newCustomerIndex);
          // Scroll selected item into view
          const customerElement = customerSuggestionsRef.current?.children[
            newCustomerIndex
          ] as HTMLElement;
          if (customerElement) {
            customerElement.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevCustomerIndex =
            selectedCustomerSuggestionIndex > 0
              ? selectedCustomerSuggestionIndex - 1
              : selectedCustomerSuggestionIndex;
          setSelectedCustomerSuggestionIndex(prevCustomerIndex);
          // Scroll selected item into view
          const prevCustomerElement = customerSuggestionsRef.current?.children[
            prevCustomerIndex
          ] as HTMLElement;
          if (prevCustomerElement) {
            prevCustomerElement.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            });
          }
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedCustomerSuggestionIndex >= 0 &&
            selectedCustomerSuggestionIndex < customerSuggestions.length
          ) {
            handleCustomerSelect(
              customerSuggestions[selectedCustomerSuggestionIndex]
            );
          }
          break;
        case "Escape":
          setShowCustomerSuggestions(false);
          setSelectedCustomerSuggestionIndex(-1);
          break;
      }
    }
  };

  // Reset selected indices when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [suggestions]);

  useEffect(() => {
    setSelectedCustomerSuggestionIndex(-1);
  }, [customerSuggestions]);

  // Add this effect to calculate positions
  useEffect(() => {
    const calculatePosition = (
      input: HTMLInputElement | null,
      setPosition: (pos: "top" | "bottom") => void
    ) => {
      if (!input) return;

      const inputRect = input.getBoundingClientRect();
      const spaceBelow = window.innerHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;

      // If there's more space below or equal space, show below
      // If there's significantly more space above, show above
      setPosition(
        spaceBelow >= 200 || spaceBelow >= spaceAbove ? "bottom" : "top"
      );
    };

    if (showSuggestions) {
      calculatePosition(barcodeInputRef.current, setSuggestionsPosition);
    }
    if (showCustomerSuggestions) {
      calculatePosition(
        customerInputRef.current,
        setCustomerSuggestionsPosition
      );
    }
  }, [showSuggestions, showCustomerSuggestions]);

  // Initialize products cache from localStorage and fetch fresh data if online
  useEffect(() => {
    console.log(isCacheLoading);
    const initializeProducts = async () => {
      try {
        // First, try to get cached products
        const cachedProducts = getCachedProducts();
        if (cachedProducts) {
          const cache: Record<string, Product> = {};
          cachedProducts.forEach((product) => {
            cache[product.barcode] = product;
          });
          setProductsCache(cache);
          setIsCacheLoading(false);
        }

        // If online, fetch fresh data
        if (isOnline) {
          const products = await getAllProducts();
          const cache: Record<string, Product> = {};
          products.forEach((product) => {
            cache[product.barcode] = product;
          });
          setProductsCache(cache);
          saveProductsToCache(products); // Update the cache with fresh data
        }
      } catch (error) {
        console.error("Error initializing products:", error);
        toast.error("Failed to load products. Some features may be slower.");
      } finally {
        setIsCacheLoading(false);
      }
    };

    if (effectiveUser) {
      initializeProducts();
    }
  }, [effectiveUser, isOnline]);

  // Initialize customers cache from localStorage and fetch fresh data if online
  useEffect(() => {
    const initializeCustomers = async () => {
      try {
        // Load from cache first
        const cachedCustomers = getCachedCustomers();
        setCustomersCache(cachedCustomers);

        // If online, fetch fresh data
        if (isOnline) {
          const customersRef = collection(db, "customers");
          const snapshot = await getDocs(customersRef);
          const customers: Record<string, Customer> = {};

          snapshot.forEach((doc) => {
            customers[doc.id] = { id: doc.id, ...doc.data() } as Customer;
          });

          setCustomersCache(customers);
          saveCustomersToCache(customers);
        }
      } catch (error) {
        console.error("Error initializing customers:", error);
        toast.error("Failed to load customers");
      } finally {
      }
    };

    initializeCustomers();
  }, [isOnline]);

  // Focus barcode input on mount and after each scan
  useEffect(() => {
    const handleFocus = () => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    };

    // Only focus when items are added (not when removed)
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      // Only focus when a new item is added (quantity = 1)
      if (lastItem.quantity === 1 && !lastItem.isRemoved) {
        handleFocus();
      }
    } else if (items.length === 0 && !isClearing) {
      // Only focus on initial mount, not when clearing items
      handleFocus();
    }
  }, [items.length]); // Only depend on items.length, not the entire items array

  // Handle barcode scanner input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    try {
      let product: Product | null = productsCache[barcode];

      if (!product && isOnline) {
        // Only try to fetch from network if we're online
        setLoading(true);
        product = await getProductByBarcode(barcode);

        if (product) {
          // Update both in-memory and localStorage cache
          setProductsCache((prev) => ({
            ...prev,
            [barcode]: product!,
          }));
          updateCachedProduct(product);
        }
      }

      if (!product) {
        toast.error(
          isOnline ? "Product not found" : "Product not found in offline cache"
        );
        return;
      }

      if (product.stock <= 0) {
        toast.error("Product out of stock");
        return;
      }

      // Check if item already exists in bill
      const existingItemIndex = items.findIndex(
        (item) => item.barcode === barcode
      );

      if (existingItemIndex >= 0) {
        // Update quantity if stock allows
        const newQuantity = items[existingItemIndex].quantity + 1;
        if (newQuantity > product.stock) {
          toast.error("Insufficient stock");
          return;
        }

        const updatedItems = [...items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity,
          subtotal: product.price * newQuantity,
        };
        setItems(updatedItems);
      } else {
        // Add new item
        const newItem: BillItem = {
          productId: product.id,
          barcode: product.barcode,
          name: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        };
        setItems([...items, newItem]);
      }

      // Clear barcode input
      setBarcode("");
    } catch (error) {
      toast.error("Error adding product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updatedItems = [...items];
    const item = updatedItems[index];
    const product = productsCache[item.barcode];

    if (!product) return;

    // Ensure quantity is within valid range
    const validQuantity = Math.min(Math.max(1, quantity), product.stock);

    updatedItems[index] = {
      ...item,
      quantity: validQuantity,
      subtotal: product.price * validQuantity,
    };
    setItems(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = items.filter((item, i) => {
      if (i === index) {
        item.isRemoved = true; // Mark item as removed
      }
      return i !== index;
    });
    setItems(updatedItems);
  };

  // Handle customer search
  const handleCustomerSearch = async (value: string) => {
    setCustomerName(value);
    if (value.length > 0) {
      try {
        // First check cache
        const cachedMatches = Object.values(customersCache).filter((customer) =>
          customer.name.toLowerCase().includes(value.toLowerCase())
        );

        if (cachedMatches.length > 0) {
          setCustomerSuggestions(cachedMatches.slice(0, 5));
          setShowCustomerSuggestions(true);
          return;
        }

        // If no matches in cache and online, search database
        if (isOnline) {
          const dbMatches = await searchCustomers(value);
          setCustomerSuggestions(dbMatches);
          setShowCustomerSuggestions(true);
        }
      } catch (error) {
        console.error("Error searching customers:", error);
        toast.error("Failed to search customers");
      }
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setShowCustomerSuggestions(false);
  };

  // Handle customer creation
  const handleCustomerCreate = async () => {
    if (!customerName.trim()) return;

    try {
      setLoading(true);
      const newCustomer = await createCustomer(customerName.trim());
      setSelectedCustomer(newCustomer);
      setCustomerName(newCustomer.name);

      // Update cache
      updateCachedCustomer(newCustomer);
      setCustomersCache((prev) => ({
        ...prev,
        [newCustomer.id]: newCustomer,
      }));

      toast.success("New customer added");
      setLoading(false);
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    }
  };

  // Close customer suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSuggestionsRef.current &&
        !customerSuggestionsRef.current.contains(event.target as Node)
      ) {
        setShowCustomerSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle input change for search
  const handleSearchChange = (value: string) => {
    setBarcode(value);
    if (value.length > 0) {
      const matches = Object.values(productsCache).filter(
        (product) =>
          product.name.toLowerCase().includes(value.toLowerCase()) ||
          product.barcode.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    if (product.stock <= 0) {
      toast.error("Product out of stock");
      return;
    }

    // Check if item already exists in bill
    const existingItemIndex = items.findIndex(
      (item) => item.barcode === product.barcode
    );

    if (existingItemIndex >= 0) {
      // Update quantity if stock allows
      const newQuantity = items[existingItemIndex].quantity + 1;
      if (newQuantity > product.stock) {
        toast.error("Insufficient stock");
        return;
      }

      const updatedItems = [...items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        subtotal: product.price * newQuantity,
      };
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: BillItem = {
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      };
      setItems([...items, newItem]);
    }

    // Clear barcode input and suggestions
    setBarcode("");
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter and sort products for stock dialog
  const filteredAndSortedProducts = Object.values(productsCache).filter(
    (product) =>
      product.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );
  // .sort((a, b) => {
  //   if (stockSortBy === "name") {
  //     return stockSortOrder === "asc"
  //       ? a.name.localeCompare(b.name)
  //       : b.name.localeCompare(a.name);
  //   } else if (stockSortBy === "stock") {
  //     return stockSortOrder === "asc" ? a.stock - b.stock : b.stock - a.stock;
  //   } else {
  //     return stockSortOrder === "asc" ? a.price - b.price : b.price - a.price;
  //   }
  // });

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [stockSearchQuery]);

  // Modify handleCheckout to include customer information
  const handleCheckout = async (paymentMethod: "cash" | "card") => {
    if (!effectiveUser) {
      toast.error("Please log in");
      return;
    }

    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!selectedCustomer) {
      toast.error("Please select or create a customer");
      return;
    }

    // Set pending payment method and show PDF dialog
    setPendingPaymentMethod(paymentMethod);
    setShowPdfDialog(true);
  };

  const processCheckout = async () => {
    if (!pendingPaymentMethod) return;

    try {
      setLoading(true);

      // Create customer purchase record
      const purchase: Omit<CustomerPurchase, "id"> = {
        customerId: selectedCustomer!.id,
        customerName: selectedCustomer!.name,
        items,
        subtotal,
        tax,
        total,
        paymentMethod: pendingPaymentMethod,
        date: new Date(),
        userId: effectiveUser!.uid,
        userName: userData?.displayName || "Unknown",
      };

      // Update inventory for each item
      for (const item of items) {
        // Update local cache first for instant UI update
        const product = productsCache[item.barcode];
        if (product) {
          const updatedProduct = {
            ...product,
            stock: Math.max(0, product.stock - item.quantity),
          };

          // Update in-memory cache
          setProductsCache((prev) => ({
            ...prev,
            [item.barcode]: updatedProduct,
          }));

          // Update localStorage cache
          updateCachedProduct(updatedProduct);

          if (isOnline) {
            // Update database
            try {
              await updateProductStock(item.productId, item.quantity);
            } catch (error) {
              console.error("Error updating product stock:", error);
              toast.error("Failed to update product stock in database");
            }
          }
        }
      }

      // Create purchase record and update customer stats
      if (isOnline) {
        await createCustomerPurchase(purchase);
        await updateCustomerPurchaseStats(selectedCustomer!.id, total);
      } else {
        // In offline mode, store the purchase in local storage
        const offlinePurchases = JSON.parse(
          localStorage.getItem("offlinePurchases") || "[]"
        );
        offlinePurchases.push(purchase);
        localStorage.setItem(
          "offlinePurchases",
          JSON.stringify(offlinePurchases)
        );
      }

      toast.success("Purchase recorded successfully");
      setItems([]);
      setCustomerName("");
      setSelectedCustomer(null);
      setPendingPaymentMethod(null);

      // Hide bill summary on mobile after successful checkout
      if (window.innerWidth < 768) {
        // 768px is the md breakpoint in Tailwind
        setIsSummaryVisible(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Error processing purchase");
      console.error(error);
    } finally {
      setLoading(false);
      setShowPdfDialog(false);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = isTaxEnabled ? subtotal * 0.05 : 0; // 5% tax when enabled
  const total = subtotal + tax;

  const handleClearItems = () => {
    if (items.length === 0) return;
    setIsClearing(true);
    setItems([]);
    toast.success("All items cleared from bill");
    // Reset the clearing flag after a short delay
    setTimeout(() => setIsClearing(false), 100);
  };

  const handleCreditPurchase = async (customerDetails: {
    name: string;
    phone?: string;
  }) => {
    if (!effectiveUser) {
      toast.error("Please log in");
      return;
    }

    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      // Store credit details for later use
      const creditInfo = {
        customerName: customerName.trim() || customerDetails.name,
        customerPhone: customerDetails.phone,
      };

      // Store credit info in state for use after PDF dialog
      setCreditDetails(creditInfo);

      // Set pending payment method and show PDF dialog
      setPendingPaymentMethod("credit");
      setShowCreditDialog(false);
      setShowPdfDialog(true);
    } catch (error) {
      console.error("Error preparing credit transaction:", error);
      toast.error("Failed to prepare credit transaction");
    }
  };

  const processCreditPurchase = async () => {
    if (!creditDetails) return;

    try {
      setIsProcessingCredit(true);
      const finalCustomerName = creditDetails.customerName;

      // Create customer purchase record first (bill)
      const purchase: Omit<CustomerPurchase, "id"> = {
        customerId: selectedCustomer?.id || "CREDIT_CUSTOMER",
        customerName: finalCustomerName,
        items,
        subtotal,
        tax,
        total,
        paymentMethod: "credit",
        date: new Date(),
        userId: effectiveUser?.uid || "UNKNOWN",
        userName: userData?.displayName || "Unknown",
      };

      // Create bill record
      if (isOnline) {
        await createCustomerPurchase(purchase);
      } else {
        const offlinePurchases = JSON.parse(
          localStorage.getItem("offlinePurchases") || "[]"
        );
        offlinePurchases.push(purchase);
        localStorage.setItem(
          "offlinePurchases",
          JSON.stringify(offlinePurchases)
        );
      }

      // Update inventory for each item
      for (const item of items) {
        const product = productsCache[item.barcode];
        if (product) {
          const updatedProduct = {
            ...product,
            stock: Math.max(0, product.stock - item.quantity),
          };

          setProductsCache((prev) => ({
            ...prev,
            [item.barcode]: updatedProduct,
          }));
          updateCachedProduct(updatedProduct);

          if (isOnline) {
            try {
              await updateProductStock(item.productId, item.quantity);
            } catch (error) {
              console.error("Error updating product stock:", error);
              toast.error("Failed to update product stock in database");
            }
          }
        }
      }

      // Create credit transaction
      await createCreditTransaction({
        customerName: finalCustomerName,
        customerPhone: creditDetails.customerPhone,
        items: items,
        totalAmount: total,
        remainingAmount: total,
        date: new Date().toISOString(),
      });

      // Clear the bill and customer name
      setItems([]);
      setCustomerName("");
      setSelectedCustomer(null);
      setCreditDetails(null);

      // Hide bill summary on mobile
      if (window.innerWidth < 768) {
        setIsSummaryVisible(false);
      }

      toast.success("Credit transaction created successfully");
    } catch (error) {
      console.error("Error creating credit transaction:", error);
      toast.error("Failed to create credit transaction");
    } finally {
      setIsProcessingCredit(false);
      setPendingPaymentMethod(null);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // Reduced margin
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to add a new page
    const addNewPage = () => {
      doc.addPage();
      y = margin;
      // Add page number at the bottom
      const pageNumber = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${pageNumber}`, pageWidth / 2, pageHeight - 8, {
        align: "center",
      });
    };

    // Set initial y position
    let y = margin;

    // Add company header
    doc.setFillColor(249, 250, 251);
    doc.rect(0, 0, pageWidth, 32, "F"); // Reduced header height

    doc.setFontSize(22); // Slightly smaller font
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", margin, y + 8);

    // Add invoice details on the right more compactly
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const invoiceNumber = `INV-${new Date().getTime().toString().slice(-6)}`;

    // Right column info with better alignment
    const rightColumnX = pageWidth - margin;
    const detailsStartY = y + 6;
    const detailsSpacing = 5;

    // Labels (right-aligned from right column start)
    doc.setTextColor(100, 100, 100);
    doc.text("Invoice Number:", rightColumnX - 60, detailsStartY);
    doc.text("Date:", rightColumnX - 60, detailsStartY + detailsSpacing);
    doc.text("Time:", rightColumnX - 60, detailsStartY + detailsSpacing * 2);

    // Values (right-aligned to page edge)
    doc.setTextColor(0, 0, 0);
    doc.text(invoiceNumber, rightColumnX, detailsStartY, { align: "right" });
    doc.text(
      new Date().toLocaleDateString(),
      rightColumnX,
      detailsStartY + detailsSpacing,
      { align: "right" }
    );
    doc.text(
      new Date().toLocaleTimeString(),
      rightColumnX,
      detailsStartY + detailsSpacing * 2,
      { align: "right" }
    );

    // Move down after header (reduced spacing)
    y += 35;

    // Add customer details section more compactly
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, contentWidth, 25, 2, 2, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Customer Details", margin + 8, y + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Name:", margin + 8, y + 18);
    doc.setTextColor(0, 0, 0);
    doc.text(selectedCustomer?.name || "Walk-in Customer", margin + 35, y + 18);

    // Move down after customer details (reduced spacing)
    y += 32;

    // Add items table header
    const columnWidths = [contentWidth - 85, 25, 30, 30]; // Increased item column width, reduced other columns
    const startX = margin;

    // Table header background
    doc.setFillColor(249, 250, 251);
    doc.rect(startX, y - 4, contentWidth, 10, "F");

    // Add table headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);

    // Calculate column positions
    const colPositions = {
      item: startX,
      qty: startX + columnWidths[0],
      price: startX + columnWidths[0] + columnWidths[1],
      total: startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
    };

    // Add headers with proper alignment
    doc.text("Item", colPositions.item + 4, y);
    doc.text("Qty", colPositions.qty + columnWidths[1] / 2, y, {
      align: "center",
    });
    doc.text("Price", colPositions.price + columnWidths[2] / 2, y, {
      align: "center",
    });
    doc.text("Total", colPositions.total + columnWidths[3] / 2, y, {
      align: "center",
    });

    // Move down after header
    y += 8;

    // Add items with alternating background
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    items.forEach((item, index) => {
      // Check if we need a new page
      if (y > pageHeight - 70) {
        addNewPage();
      }

      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(startX, y - 4, contentWidth, 10, "F");
      }

      // Item details
      doc.setTextColor(0, 0, 0);

      // Calculate available width for item name and truncate if necessary
      const maxNameWidth = columnWidths[0] - 8;
      let displayName = item.name;
      let textWidth = doc.getTextWidth(displayName);

      if (textWidth > maxNameWidth) {
        while (textWidth > maxNameWidth && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
          textWidth = doc.getTextWidth(displayName + "...");
        }
        displayName += "...";
      }

      // Add item details with proper alignment
      doc.text(displayName, colPositions.item + 4, y);
      doc.text(
        item.quantity.toString(),
        colPositions.qty + columnWidths[1] / 2,
        y,
        { align: "center" }
      );
      doc.text(
        item.price.toFixed(3),
        colPositions.price + columnWidths[2] / 2,
        y,
        { align: "center" }
      );
      doc.text(
        item.subtotal.toFixed(3),
        colPositions.total + columnWidths[3] / 2,
        y,
        { align: "center" }
      );

      y += 10;
    });

    // Add totals section
    y += 2;
    doc.setDrawColor(230, 230, 230);
    doc.line(startX, y - 2, startX + contentWidth, y - 2);

    // Totals section with better alignment
    const totalsStartX = startX + contentWidth - 80;
    const totalsValueX = startX + contentWidth;
    const totalsSpacing = 12;

    // Subtotal
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("Subtotal:", totalsStartX, y + 6);
    doc.setTextColor(0, 0, 0);
    doc.text(subtotal.toFixed(3), totalsValueX, y + 6, { align: "right" });

    if (isTaxEnabled) {
      y += totalsSpacing;
      doc.setTextColor(100, 100, 100);
      doc.text("Tax (5%):", totalsStartX, y + 6);
      doc.setTextColor(0, 0, 0);
      doc.text(tax.toFixed(3), totalsValueX, y + 6, { align: "right" });
    }

    // Total with background
    y += totalsSpacing;
    doc.setFillColor(249, 250, 251);
    doc.rect(totalsStartX - 10, y, 90, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Total:", totalsStartX, y + 8);
    doc.text(`OMR ${total.toFixed(3)}`, totalsValueX, y + 8, {
      align: "right",
    });

    // Add footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 15, {
      align: "center",
    });

    // Add payment method stamp
    if (pendingPaymentMethod) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 150, 0);
      doc.text(
        pendingPaymentMethod.toUpperCase(),
        pageWidth - margin,
        pageHeight - 25,
        { align: "right" }
      );
    }

    // Save the PDF
    const fileName = `invoice_${invoiceNumber}.pdf`;
    doc.save(fileName);
  };

  return (
    <div
      style={{
        border: "",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        height: "100svh",
      }}
      className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side - Items List */}
        <div className="flex-1 md:w-2/3 flex flex-col overflow-hidden">
          <div
            style={{
              boxShadow: "1px 1px 10px rgba(0 0 0/ 10%)",
              padding: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(100 100 100/ 5%)",
              position: "sticky",
              top: 0,
              zIndex: 40,
            }}
            className="px-3 py-2 dark:bg-gray-950"
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {userData?.role === "admin" && <Back />}
              {/* <Target color="crimson" /> */}
              <h2
                style={{ marginLeft: "0.5rem", fontSize: "1.5rem" }}
                className=" "
              >
                Billing
              </h2>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                border: "",
              }}
            >
              <button
                style={{ height: "2.5rem", width: "2.5rem" }}
                onClick={() => setShowStockDialog(true)}
                className=" hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Box className="h-5 w-5" />
              </button>
              <IndexDropDown />
            </div>
          </div>

          {/* Bottom Bar with Barcode Input */}
          <div
            style={{
              // boxShadow: "1px 1px 10px rgba(0, 0, 0, 0.2)",
              borderTop: "1px solid rgba(100 100 100/ 20%)",
              borderBottom: "1px solid rgba(100 100 100/ 20%)",
              // position: "fixed",
              padding: "0.5rem",
              paddingBottom: "0.5rem",

              bottom: 0,
              left: 0,
              right: 0,
              background: "",
              zIndex: 30,
            }}
            // className={`md:relative dark:bg-gray-950 ${
            //   isSummaryVisible ? "md:w-[calc(100%-350px)]" : "md:w-full"
            // } md:transition-all md:duration-300 md:ease-in-out`}
          >
            {/* Add persistent toggle button when summary is hidden */}
            <div
              style={{
                border: "",
                padding: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <Button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    background: "rgba(100 100 100/ 20%)",
                    fontSize: "0.9rem",
                  }}
                >
                  <PenLine width={"1.25rem"} />
                </Button>
                <Button
                  onClick={handleClearItems}
                  disabled={items.length === 0}
                  style={{
                    paddingLeft: "1rem",
                    paddingRight: "1rem",
                    background: "rgba(100 100 100/ 20%)",
                    fontSize: "0.9rem",
                  }}
                >
                  <MinusCircle color="crimson" width={"1.25rem"} />
                  Clear Bill
                </Button>
              </div>

              <div
                style={{
                  height: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {!isSummaryVisible && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      fontSize: "",
                    }}
                  >
                    {/* <p>Checkout</p> */}
                    <Button
                      style={{
                        background: "none",
                        border: "1px solid rgba(100 100 100/ 50%)",
                        margin: "",
                        paddingLeft: "1rem",
                        paddingRight: "1rem",
                        fontSize: "0.9rem",
                      }}
                      onClick={() => setIsSummaryVisible(true)}
                      className=" bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-20"
                    >
                      Continue
                      <ArrowLeftToLine
                        style={{ width: "1.25rem" }}
                        className=" rotate-180"
                      />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <form onSubmit={handleBarcodeSubmit} className="p-2 space-y-2">
              {/* Barcode Input */}
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcode}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "product")}
                  placeholder="Scan barcode or search by product name..."
                  className="w-full pl-8 pr-3 py-1.5 border rounded focus:outline-none focus:border-blue-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                  disabled={loading}
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className={`absolute ${
                      suggestionsPosition === "bottom"
                        ? "top-full mt-2"
                        : "bottom-full mb-2"
                    } left-0 right-0 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50`}
                  >
                    {suggestions.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product)}
                        className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center text-gray-900 dark:text-gray-100 ${
                          index === selectedSuggestionIndex
                            ? "bg-gray-100 dark:bg-gray-800"
                            : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            OMR {product.price.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Input */}
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                className="relative"
              >
                <input
                  ref={customerInputRef}
                  type="text"
                  value={customerName}
                  onChange={(e) => handleCustomerSearch(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "customer")}
                  placeholder="Enter customer name"
                  className="w-full pl-8 pr-3 py-1.5 border rounded focus:outline-none focus:border-blue-500 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-900"
                />
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div
                    ref={customerSuggestionsRef}
                    className={`absolute ${
                      customerSuggestionsPosition === "bottom"
                        ? "top-full mt-2"
                        : "bottom-full mb-2"
                    } left-0 right-0 bg-white dark:bg-gray-900 border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50`}
                  >
                    {customerSuggestions.map((customer, index) => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-900 dark:text-gray-100 ${
                          index === selectedCustomerSuggestionIndex
                            ? "bg-gray-100 dark:bg-gray-800"
                            : ""
                        }`}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.totalPurchases} purchases • OMR{" "}
                          {customer.totalSpent.toFixed(3)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {customerName && (
                  <button
                    style={{
                      paddingLeft: "1rem",
                      paddingRight: "1rem",
                      fontSize: "0.8rem",
                      width: "10rem",
                    }}
                    type="button"
                    onClick={handleCustomerCreate}
                    className=" text-sm text-blue-500 hover:text-blue-600"
                  >
                    {loading ? (
                      <LoaderCircle className="animate-spin" width={"1rem"} />
                    ) : (
                      <UserPlus width={"1rem"} />
                    )}
                    Add New
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Scrollable Items List */}
          <div
            style={{
              flex: 1,
              paddingTop: "0.5rem",
              paddingBottom: "0.5rem",
              padding: "0.75rem",
              border: "",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
            }}
            className="overflow-y-auto"
          >
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={`${item.barcode}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex items-center border rounded-lg mb-2  bg-white dark:bg-gray-900"
                >
                  <button
                    style={{ marginLeft: "0.75rem", marginRight: "0.25rem" }}
                    onClick={() => handleRemoveItem(index)}
                    className="p-1.5 text-red-500 hover:text-red-600"
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                  {/* Item Details */}
                  <div className="flex-1 min-w-0 p-2">
                    <h3
                      style={{ fontSize: "0.8rem" }}
                      className="font-medium truncate text-gray-900 dark:text-gray-100"
                    >
                      {item.name}
                    </h3>
                    <p
                      style={{ fontSize: "0.8rem" }}
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
                      {item.price.toFixed(3)}
                    </p>
                  </div>

                  {/* Quantity Controls and Price */}
                  <div className="flex items-center gap-2 px-2">
                    <div
                      style={{ marginRight: "0.25rem" }}
                      className="text-right min-w-[40px] text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      {item.subtotal.toFixed(3)}
                    </div>
                    <div className="flex items-center rounded-lg">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            index,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600"
                        disabled={item.quantity <= 1}
                      >
                        <Icons.minus className="h-4 w-4" />
                      </button>
                      <input
                        style={{ background: "none", width: "4rem" }}
                        type="number"
                        min="1"
                        max={productsCache[item.barcode]?.stock || 999}
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Allow empty string for typing
                          if (value === "") {
                            return;
                          }
                          const newQuantity = parseInt(value);
                          const availableStock =
                            productsCache[item.barcode]?.stock || 999;

                          if (!isNaN(newQuantity) && newQuantity > 0) {
                            if (newQuantity > availableStock) {
                              // Show tooltip with available stock
                              toast.error(
                                `Only ${availableStock} items available in stock`
                              );
                              // Set to max available stock
                              handleQuantityChange(index, availableStock);
                            } else {
                              handleQuantityChange(index, newQuantity);
                            }
                          }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          // Set to 1 if input is empty when losing focus
                          if (e.target.value === "") {
                            handleQuantityChange(index, 1);
                          }
                        }}
                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                          e.target.select();
                        }}
                        onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                          e.currentTarget.select();
                        }}
                        className="w-12 text-center font-medium text-sm border-none focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100"
                      />
                      <button
                        onClick={() =>
                          handleQuantityChange(index, item.quantity + 1)
                        }
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        <Icons.plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Package className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No items added to bill</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Summary and Actions */}
        <div
          style={{ marginBottom: "1rem" }}
          className={`${
            isSummaryVisible ? "md:w-[350px]" : "md:w-0"
          } bg-white dark:bg-gray-950 md:border-l dark:border-gray-700 transition-all duration-300 ease-in-out ${
            isSummaryVisible ? "translate-y-0" : "translate-y-[100vh]"
          } fixed md:relative bottom-0 left-0 right-0 md:left-auto md:right-auto md:bottom-auto z-30 overflow-hidden`}
        >
          <div
            style={{ display: "flex", alignItems: "center" }}
            className="p-3 flex gap-2 align-middle justify-between"
          >
            <h3
              style={{
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              className=" font-semibold text-gray-800 dark:text-gray-200"
            >
              <Ticket />
              Summary
            </h3>
            <div className="flex items-center gap-2">
              {/* <button
                style={{
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                  fontSize: "0.8rem",
                  height: "2rem",
                  opacity: items.length === 0 ? 0.5 : 1,
                }}
                onClick={handleClearItems}
                disabled={items.length === 0}
              >
                <MinusCircle width={"1rem"} />
                Clear Bill
              </button> */}
              <button
                onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ChevronUp
                  className={`h-4 w-4 transition-transform ${
                    isSummaryVisible ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-4">
            {/* Summary Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-800 dark:text-gray-200">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span>OMR {subtotal.toFixed(3)}</span>
              </div>

              {/* Tax Toggle and Amount */}
              <div className="flex items-center justify-between text-gray-800 dark:text-gray-200">
                <div
                  onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                  style={{ alignItems: "center" }}
                  className="flex items-center gap-2"
                >
                  <div
                    style={{
                      display: "flex",
                      width: "1.25rem",
                      height: "1.25rem",
                      borderRadius: "0.25rem",
                      background: "rgba(100 100 100/ 20%)",
                      justifyContent: "center",
                      alignItems: "center",
                      transition: "0.3s",
                    }}
                  >
                    {isTaxEnabled && <Check width={"0.8rem"} />}
                  </div>
                  <label
                    htmlFor="tax-toggle"
                    className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    Tax (5%)
                  </label>
                </div>
                <span>OMR {tax.toFixed(3)}</span>
              </div>

              <div
                style={{ opacity: 0.5, marginTop: "0.5rem" }}
                className="h-px bg-gray-200 dark:bg-gray-700"
              />

              <div
                style={{
                  fontSize: "1.25rem",
                  border: "",
                  letterSpacing: "0.05rem",
                }}
              >
                <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                  <span>Total</span>
                  <span>OMR {total.toFixed(3)}</span>
                </div>
              </div>

              {/* Clear Items Button */}
            </div>

            {/* Payment Methods */}
            <div style={{}} className="">
              <div className="flex gap-2 mt-4">
                <Button
                  style={{ height: "2.5rem" }}
                  className="flex-1"
                  variant="outline"
                  onClick={() => setShowCreditDialog(true)}
                  disabled={items.length === 0 || isProcessingCredit}
                >
                  {isProcessingCredit ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Credit"
                  )}
                </Button>
                <Button
                  style={{
                    height: "2.5rem",
                    background: "crimson",
                    color: "white",
                  }}
                  className="flex-1"
                  onClick={() => handleCheckout("cash")}
                  disabled={loading || items.length === 0}
                >
                  {loading && <LoaderCircle className="animate-spin" />}
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="bg-gray-50 dark:bg-gray-950 max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Box className="h-5 w-5" />
              Current Stock
            </DialogTitle>
            <DialogDescription />
          </DialogHeader>

          {/* Products List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="grid grid-cols-1 gap-3 p-4">
              {paginatedProducts.map((product) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={product.id}
                  className="flex flex-col p-4 border rounded-xl  dark:hover:shadow-gray-800 transition-all duration-200 bg-white dark:bg-gray-900"
                >
                  <div
                    style={{ border: "" }}
                    className=" flex justify-between items-start mb-2"
                  >
                    <div className="flex-1">
                      <h3
                        style={{ display: "flex", width: "", flex: 1 }}
                        className="font-medium text-sm mb-1 "
                      >
                        {product.name}
                      </h3>
                      <div
                        style={{ border: "", width: "" }}
                        className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"
                      >
                        <Barcode className="h-3.5 w-3.5" />
                        <span className="text-sm font-mono">
                          {product.barcode}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ border: "" }}
                      className="flex flex-col items-end"
                    >
                      <span className="text-lg font-semibold">
                        {product.price.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center" }}
                    className="mt-auto pt-3 border-t flex items-center justify-between"
                  >
                    {/* <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          product.stock <= (product.minStock || 10)
                            ? "bg-red-500"
                            : product.stock <= (product.minStock || 10) * 2
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Stock
                      </span>
                    </div> */}
                    <div
                      style={{
                        width: "100%",
                        border: "",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Box />
                      <span
                        className={`text-lg font-semibold ${
                          product.stock <= (product.minStock || 10)
                            ? "text-red-500"
                            : product.stock <= (product.minStock || 10) * 2
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Search and Pagination Controls */}
          <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-950 p-4 border-t">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {/* <Icons.search className="h-4 w-4 text-gray-400" /> */}
              </div>
              <input
                type="text"
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                placeholder="Search by name or barcode..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                autoFocus={false}
              />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {paginatedProducts.length} of{" "}
                  {filteredAndSortedProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                  >
                    <Icons.chevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <Icons.chevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Details Dialog */}
      <CreditDetailsDialog
        isOpen={showCreditDialog}
        onClose={() => setShowCreditDialog(false)}
        onSubmit={handleCreditPurchase}
        isLoading={isProcessingCredit}
        total={total}
        existingCustomerName={customerName.trim()}
      />

      {/* PDF Save Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="bg-white dark:bg-gray-950 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Bill</DialogTitle>
            <DialogDescription>
              Would you like to save this bill as a PDF?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="outline"
              onClick={() => {
                setShowPdfDialog(false);
                if (pendingPaymentMethod === "credit") {
                  processCreditPurchase();
                } else {
                  processCheckout();
                }
              }}
            >
              No, Skip
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                setShowPdfDialog(false);
                generatePDF();
                if (pendingPaymentMethod === "credit") {
                  await processCreditPurchase();
                } else {
                  await processCheckout();
                }

                toast.success("Invoice PDF has been generated and downloaded");
              }}
            >
              Yes, Save PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
