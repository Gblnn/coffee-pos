export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  description?: string;
  minStock?: number;
  lastRestocked?: Date;
}

export interface BillItem {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  isRemoved?: boolean;
}

export interface Bill {
  id: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  cashierId: string;
  paymentMethod: "cash" | "card";
  status: "pending" | "completed" | "cancelled";
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: "in" | "out";
  quantity: number;
  reason: "sale" | "restock" | "return" | "adjustment";
  date: Date;
  userId: string;
  billId?: string;
  costPrice?: number;
  supplierId?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
}

export interface CustomerPurchase {
  id: string;
  customerId: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "credit";
  date: Date;
  userId: string;
  userName: string;
}

export interface CreditTransaction {
  id: string;
  customerName: string;
  customerPhone?: string;
  items: BillItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  status: "pending" | "partially_paid" | "paid";
  payments: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: Date;
}

export interface RestockRecord {
  id: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  date: Date;
  invoiceNumber?: string;
  notes?: string;
  userId: string;
  userName: string;
}
