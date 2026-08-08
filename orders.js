import { Router } from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import mongoose from "mongoose";

const router = Router();

// In-memory fallback orders store
export const MEMORY_ORDERS = [];

// Helper generator for order IDs
const generateOrderId = () => "ORD-" + Math.floor(100000 + Math.random() * 900000);

// POST /api/orders (Place Order)
router.post("/", async (req, res) => {
  try {
    const { userId, guestName, items, location } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cannot place order with empty items" });
    }

    const itemsSubtotal = items.reduce((acc, item) => acc + item.price * (item.quantity || 1), 0);
    
    // Pricing business rules:
    // Delivery fee: ₹0
    // User commission: ₹0
    // Store owner commission: 10%
    const deliveryFee = 0;
    const userCommission = 0;
    const storeCommissionPercent = 10;
    const storeEarnings = Math.round(itemsSubtotal * 0.90 * 100) / 100;
    const grandTotal = itemsSubtotal + deliveryFee;

    const orderId = generateOrderId();
    const now = new Date();
    const orderTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const estimatedDelivery = "15 - 25 Mins";

    const orderPayload = {
      orderId,
      userId: userId || "guest-user",
      guestName: guestName || "Guest Shopper",
      items,
      subtotal: itemsSubtotal,
      deliveryFee,
      userCommission,
      storeCommissionPercent,
      storeEarnings,
      total: grandTotal,
      location: location || { label: "Dombivli East", lat: 19.2183, lng: 73.0864 },
      orderTime,
      estimatedDelivery,
      status: "Confirmed & Dispatched",
      createdAt: now,
    };

    if (mongoose.connection.readyState === 1) {
      const savedOrder = await Order.create(orderPayload);
      // Empty user's cart in DB if exists
      if (userId) {
        await Cart.findOneAndUpdate({ userId }, { items: [] });
      }
      return res.json(savedOrder);
    } else {
      memoryOrders.unshift(orderPayload);
      return res.json(orderPayload);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId || req.headers["x-user-id"];
    
    if (mongoose.connection.readyState === 1) {
      const query = userId ? { userId } : {};
      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      const list = userId ? memoryOrders.filter((o) => o.userId === userId) : memoryOrders;
      return res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
