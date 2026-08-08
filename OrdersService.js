/**
 * OrdersService
 * Handles order generation, formatting, and localStorage persistence.
 */

const STORAGE_KEY_ORDERS = "hypercon_orders";

function generateOrderId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `HC-${dateStr}-${randomChars}`;
}

function calculateEstimatedDeliveryTime(minutesFromNow = 25) {
  const eta = new Date(Date.now() + minutesFromNow * 60 * 1000);
  return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export class OrdersService {
  /**
   * Reads stored orders array from localStorage.
   * @returns {Array} List of saved orders
   */
  static getOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.warn("[OrdersService] Failed to parse orders from localStorage:", e);
      return [];
    }
  }

  /**
   * Retrieves a specific order by orderId.
   */
  static getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find((o) => o.orderId === orderId) || null;
  }

  /**
   * Creates a new order, formats timestamps and ETA, and saves to localStorage.
   */
  static createOrder({ guestId, guestName, items, subtotal, deliveryFee, total, transactionId }) {
    const orderId = generateOrderId();
    const orderTime = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const estimatedDelivery = `${calculateEstimatedDeliveryTime(25)} (in ~25-30 mins)`;

    const newOrder = {
      orderId,
      guestId: guestId || "anonymous-guest",
      guestName: guestName || "Guest Shopper",
      items: items.map((item) => ({
        storeId: item.storeId,
        productId: item.productId || null,
        productName: item.productName,
        storeName: item.storeName || item.source || "Partner Store",
        price: item.price,
        unit: item.unit || "1kg",
        imageUrl: item.imageUrl || "",
        quantity: item.quantity || 1,
      })),
      subtotal: Number(subtotal) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      total: Number(total) || 0,
      orderTime,
      estimatedDelivery,
      paymentStatus: "Paid",
      orderStatus: "Confirmed",
      transactionId: transactionId || `TXN_${Date.now()}`,
    };

    const existingOrders = this.getOrders();
    const updatedOrders = [newOrder, ...existingOrders];

    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(updatedOrders));
    } catch (e) {
      console.warn("[OrdersService] Failed to save order to localStorage:", e);
    }

    return newOrder;
  }

  /**
   * Clears order history from localStorage.
   */
  static clearOrdersHistory() {
    localStorage.removeItem(STORAGE_KEY_ORDERS);
  }
}
