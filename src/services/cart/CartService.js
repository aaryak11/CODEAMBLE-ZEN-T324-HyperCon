/**
 * CartService
 * Manages cart persistence in localStorage and synchronizes with server endpoints when available.
 */

const STORAGE_KEY_CART = "hypercon_cart";

export class CartService {
  /**
   * Reads current cart items from localStorage.
   * @returns {Array} Array of cart items
   */
  static getLocalCart() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CART);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("[CartService] Failed to read cart from localStorage:", e);
      return [];
    }
  }

  /**
   * Saves cart array to localStorage.
   * @param {Array} items 
   */
  static saveLocalCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(items || []));
    } catch (e) {
      console.warn("[CartService] Failed to save cart to localStorage:", e);
    }
  }

  /**
   * Adds an item to the local cart array and saves to localStorage.
   */
  static addItem(currentItems, newItem) {
    const items = [...currentItems];
    const existingIndex = items.findIndex(
      (item) => item.storeId === newItem.storeId && item.productName === newItem.productName
    );

    if (existingIndex > -1) {
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: (items[existingIndex].quantity || 1) + (newItem.quantity || 1),
      };
    } else {
      items.push({
        storeId: newItem.storeId,
        productId: newItem.productId || null,
        productName: newItem.productName,
        storeName: newItem.storeName || newItem.source || "Partner Store",
        price: Number(newItem.price) || 0,
        unit: newItem.unit || "1kg",
        imageUrl: newItem.imageUrl || "",
        hasLiveVerification: Boolean(newItem.hasLiveVerification),
        quantity: newItem.quantity || 1,
      });
    }

    this.saveLocalCart(items);
    return items;
  }

  /**
   * Updates an item quantity by index.
   */
  static updateQuantity(currentItems, index, newQuantity) {
    const items = [...currentItems];
    if (index < 0 || index >= items.length) return items;

    if (newQuantity <= 0) {
      items.splice(index, 1);
    } else {
      items[index] = {
        ...items[index],
        quantity: newQuantity,
      };
    }

    this.saveLocalCart(items);
    return items;
  }

  /**
   * Removes an item by index.
   */
  static removeItem(currentItems, index) {
    const items = [...currentItems];
    if (index >= 0 && index < items.length) {
      items.splice(index, 1);
    }
    this.saveLocalCart(items);
    return items;
  }

  /**
   * Clears the cart from local state and localStorage.
   */
  static clearCart() {
    localStorage.removeItem(STORAGE_KEY_CART);
    return [];
  }
}
