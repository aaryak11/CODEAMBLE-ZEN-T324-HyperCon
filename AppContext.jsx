import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CartService } from "../services/cart/CartService.js";
import { defaultPaymentService } from "../services/payment/PaymentService.js";
import { OrdersService } from "../services/orders/OrdersService.js";
import { useAuth } from "./AuthContext.jsx";
import { ENDPOINTS } from "../config/api.js";

const AppContext = createContext();

export const MIN_ORDER_THRESHOLD = 30; // ₹30 minimum order value

export function AppProvider({ children }) {
  const { user, userLocation } = useAuth();

  const [activeScreen, setActiveScreen] = useState("home"); // 'home' | 'search'
  const [searchQuery, setSearchQuery] = useState("Tomato");

  // Admin Portal Mode ('customer' | 'admin')
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return window.location.pathname.startsWith("/admin") || window.location.search.includes("mode=admin");
  });

  // Customer Support Modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Real-time New Arrival notification state
  const [newArrival, setNewArrival] = useState(null);

  // Persistent cart initialized from LocalStorage
  const [cart, setCart] = useState(() => CartService.getLocalCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  // Orders list state
  const [orders, setOrders] = useState(() => OrdersService.getOrders());
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);

  // Connect to Real-time WebSocket Server
  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connectWs() {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.hostname || "localhost";
        ws = new WebSocket(`${protocol}//${host}:4000/ws`);

        ws.onopen = () => {
          console.log("[HyperCon WS] Realtime connection active");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "new_arrival") {
              setNewArrival(data.payload);
            }
          } catch (e) {
            console.warn("[HyperCon WS] Parse error:", e);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        // Fallback silently if websocket fails
      }
    }

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  // Fetch orders from backend when user ID changes
  const fetchOrdersFromBackend = useCallback(async () => {
    try {
      const userId = user?.id || "guest-user";
      const res = await fetch(`/api/orders?userId=${userId}`);
      if (res.ok) {
        const backendOrders = await res.json();
        if (Array.isArray(backendOrders) && backendOrders.length > 0) {
          setOrders(backendOrders);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch backend orders:", e);
    }
    setOrders(OrdersService.getOrders());
  }, [user]);

  useEffect(() => {
    fetchOrdersFromBackend();
  }, [fetchOrdersFromBackend]);

  // Show Toast notification helper
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Cart operations synchronized with localStorage & backend
  const addToCart = async (item) => {
    const updated = CartService.addItem(cart, item);
    setCart(updated);
    showToast(`Added ${item.productName} (${item.storeName || item.source || "Partner Store"}) to Cart!`);

    try {
      await fetch(ENDPOINTS.CART_ITEMS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "guest-user",
        },
        body: JSON.stringify({
          storeId: item.storeId,
          productId: item.productId,
          productName: item.productName,
          storeName: item.storeName || item.source || "Partner Store",
          price: item.price,
          unit: item.unit || "1kg",
          imageUrl: item.imageUrl || "",
          hasLiveVerification: Boolean(item.hasLiveVerification),
          quantity: 1,
        }),
      });
    } catch (e) {}
  };

  const updateCartQuantity = async (index, newQuantity) => {
    const updated = CartService.updateQuantity(cart, index, newQuantity);
    setCart(updated);

    try {
      await fetch(ENDPOINTS.CART_ITEM_BY_INDEX(index), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "guest-user",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });
    } catch (e) {}
  };

  const removeFromCart = async (index) => {
    const itemToRemove = cart[index];
    const updated = CartService.removeItem(cart, index);
    setCart(updated);
    if (itemToRemove) {
      showToast(`Removed ${itemToRemove.productName} from cart`, "info");
    }

    try {
      await fetch(ENDPOINTS.CART_ITEM_BY_INDEX(index), {
        method: "DELETE",
        headers: {
          "x-user-id": user?.id || "guest-user",
        },
      });
    } catch (e) {}
  };

  /**
   * Process Checkout & Order Creation
   */
  const processCheckoutOrder = async () => {
    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    const itemsSubtotal = cart.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);

    if (itemsSubtotal < MIN_ORDER_THRESHOLD) {
      throw new Error(`Minimum order amount of ₹${MIN_ORDER_THRESHOLD} required to place an order.`);
    }

    // Business pricing rules: ₹0 delivery fee, ₹0 user commission, 10% store owner commission
    const deliveryFee = 0;
    const userCommission = 0;
    const storeCommissionPercent = 10;
    const storeEarnings = Math.round(itemsSubtotal * 0.90 * 100) / 100;
    const grandTotal = itemsSubtotal + deliveryFee;

    // 1. Payment abstraction processing
    const paymentResult = await defaultPaymentService.processPayment({
      amount: grandTotal,
      currency: "INR",
      paymentMethod: "HyperCon Direct Pay (Demo)",
    });

    if (!paymentResult.success) {
      throw new Error("Payment authorization failed.");
    }

    // 2. Post Order to Backend & Local Orders Service
    let createdOrder;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || "guest-user",
          guestName: user?.name || "Guest Shopper",
          items: cart,
          location: userLocation,
        }),
      });

      if (res.ok) {
        createdOrder = await res.json();
      }
    } catch (e) {
      console.warn("Backend order creation failed, falling back to local service:", e);
    }

    if (!createdOrder) {
      createdOrder = OrdersService.createOrder({
        guestId: user?.id,
        guestName: user?.name || "Guest Shopper",
        items: cart,
        subtotal: itemsSubtotal,
        deliveryFee,
        userCommission,
        storeCommissionPercent,
        storeEarnings,
        total: grandTotal,
        transactionId: paymentResult.transactionId,
        location: userLocation,
      });
    }

    // 3. Update orders list
    await fetchOrdersFromBackend();

    // 4. Clear cart after successful order
    const cleared = CartService.clearCart();
    setCart(cleared);

    try {
      await fetch(ENDPOINTS.CART_CHECKOUT, {
        method: "POST",
        headers: { "x-user-id": user?.id || "guest-user" },
      });
    } catch (e) {}

    showToast(`Order ${createdOrder.orderId} Confirmed!`, "success");
    return createdOrder;
  };

  const triggerSearch = (queryStr) => {
    if (!queryStr.trim()) return;
    setSearchQuery(queryStr);
    setActiveScreen("search");
  };

  return (
    <AppContext.Provider
      value={{
        userLocation,
        activeScreen,
        setActiveScreen,
        searchQuery,
        setSearchQuery,
        triggerSearch,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        processCheckoutOrder,
        isCartOpen,
        setIsCartOpen,
        toast,
        showToast,
        orders,
        isOrderHistoryOpen,
        setIsOrderHistoryOpen,
        fetchOrdersFromBackend,
        minOrderThreshold: MIN_ORDER_THRESHOLD,
        isAdminMode,
        setIsAdminMode,
        isSupportModalOpen,
        setIsSupportModalOpen,
        newArrival,
        setNewArrival,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
