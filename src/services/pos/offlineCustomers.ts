import { Customer } from "@/types/pos";

const CUSTOMERS_CACHE_KEY = "pos_customers_cache";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedCustomers = (): Record<string, Customer> => {
  const cached = localStorage.getItem(CUSTOMERS_CACHE_KEY);
  if (!cached) return {};

  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CUSTOMERS_CACHE_KEY);
      return {};
    }
    return data;
  } catch (error) {
    console.error("Error parsing cached customers:", error);
    return {};
  }
};

export const saveCustomersToCache = (customers: Record<string, Customer>) => {
  try {
    localStorage.setItem(
      CUSTOMERS_CACHE_KEY,
      JSON.stringify({
        data: customers,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Error saving customers to cache:", error);
  }
};

export const updateCachedCustomer = (customer: Customer) => {
  const cached = getCachedCustomers();
  cached[customer.id] = customer;
  saveCustomersToCache(cached);
};

export const clearCustomersCache = () => {
  localStorage.removeItem(CUSTOMERS_CACHE_KEY);
};
