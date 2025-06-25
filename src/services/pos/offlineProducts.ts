import { Product } from "@/types/pos";

const PRODUCTS_CACHE_KEY = "pos_products_cache";

export const saveProductsToCache = (products: Product[]) => {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error("Error saving products to cache:", error);
  }
};

export const getCachedProducts = (): Product[] | null => {
  try {
    const cachedData = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (!cachedData) {
      return null;
    }
    return JSON.parse(cachedData);
  } catch (error) {
    console.error("Error reading products from cache:", error);
    return null;
  }
};

export const updateCachedProduct = (product: Product) => {
  try {
    const cachedProducts = getCachedProducts();
    if (!cachedProducts) return;

    const updatedProducts = cachedProducts.map((p) =>
      p.id === product.id ? product : p
    );

    saveProductsToCache(updatedProducts);
  } catch (error) {
    console.error("Error updating cached product:", error);
  }
};

export const clearProductsCache = () => {
  try {
    localStorage.removeItem(PRODUCTS_CACHE_KEY);
  } catch (error) {
    console.error("Error clearing products cache:", error);
  }
};
