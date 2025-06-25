export interface SupplierProduct {
  id: string;
  name: string;
  barcode: string;
  price: number;
  minOrderQuantity: number;
  leadTime: number; // in days
  lastOrdered?: Date;
  lastOrderQuantity?: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  products: SupplierProduct[];
  totalOrders: number;
  lastOrderDate?: Date;
  status: "active" | "inactive";
}
