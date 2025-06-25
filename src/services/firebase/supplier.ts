import { db } from "@/config/firebase";
import { Supplier, SupplierProduct } from "@/types/supplier";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// Get all suppliers
export const getAllSuppliers = async (): Promise<Supplier[]> => {
  const suppliersRef = collection(db, "suppliers");
  const snapshot = await getDocs(suppliersRef);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastOrderDate: data.lastOrderDate?.toDate(),
      products: data.products?.map((product: any) => ({
        ...product,
        lastOrdered: product.lastOrdered?.toDate(),
      })),
    } as Supplier;
  });
};

// Add a new supplier
export const addSupplier = async (
  supplier: Omit<Supplier, "id" | "products" | "totalOrders" | "status">
): Promise<string> => {
  const suppliersRef = collection(db, "suppliers");
  const docRef = await addDoc(suppliersRef, {
    ...supplier,
    products: [],
    totalOrders: 0,
    status: "active",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

// Add a product to a supplier
export const addSupplierProduct = async (
  supplierId: string,
  product: Omit<SupplierProduct, "id" | "lastOrdered" | "lastOrderQuantity">
): Promise<void> => {
  const supplierRef = doc(db, "suppliers", supplierId);
  const supplierDoc = await getDoc(supplierRef);
  const data = supplierDoc.data();
  const currentProducts = data?.products || [];

  await updateDoc(supplierRef, {
    products: [
      ...currentProducts,
      {
        ...product,
        id: Math.random().toString(36).substring(2, 9),
        lastOrdered: null,
        lastOrderQuantity: null,
      },
    ],
  });
};

// Place an order with a supplier
export const placeSupplierOrder = async (
  supplierId: string,
  orders: { productId: string; quantity: number }[]
): Promise<void> => {
  const supplierRef = doc(db, "suppliers", supplierId);
  const supplierDoc = await getDoc(supplierRef);
  const data = supplierDoc.data();
  const currentProducts = data?.products || [];

  // Update products with new order information
  const updatedProducts = currentProducts.map((product: SupplierProduct) => {
    const order = orders.find((o) => o.productId === product.id);
    if (order) {
      return {
        ...product,
        lastOrdered: new Date(),
        lastOrderQuantity: order.quantity,
      };
    }
    return product;
  });

  await updateDoc(supplierRef, {
    products: updatedProducts,
    totalOrders: (data?.totalOrders || 0) + 1,
    lastOrderDate: new Date(),
  });
};

// Update supplier status
export const updateSupplierStatus = async (
  supplierId: string,
  status: "active" | "inactive"
): Promise<void> => {
  const supplierRef = doc(db, "suppliers", supplierId);
  await updateDoc(supplierRef, { status });
};

// Search suppliers
export const searchSuppliers = async (
  searchQuery: string
): Promise<Supplier[]> => {
  const suppliersRef = collection(db, "suppliers");
  const q = query(
    suppliersRef,
    where("name", ">=", searchQuery),
    where("name", "<=", searchQuery + "\uf8ff")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      lastOrderDate: data.lastOrderDate?.toDate(),
      products: data.products?.map((product: any) => ({
        ...product,
        lastOrdered: product.lastOrdered?.toDate(),
      })),
    } as Supplier;
  });
};
