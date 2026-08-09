import { Router } from "express";
import Cart from "../models/Cart.js";
import mongoose from "mongoose";

const router = Router();

// In-memory fallback carts
const memoryCarts = new Map();

const getUserId = (req) => req.headers["x-user-id"] || req.query.userId || "demo-user";

// GET /api/cart
router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (mongoose.connection.readyState === 1) {
      let cart = await Cart.findOne({ userId });
      if (!cart) cart = await Cart.create({ userId, items: [] });
      return res.json(cart);
    } else {
      if (!memoryCarts.has(userId)) {
        memoryCarts.set(userId, { userId, items: [] });
      }
      return res.json(memoryCarts.get(userId));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/items
router.post("/items", async (req, res) => {
  try {
    const userId = getUserId(req);
    const { storeId, productId, productName, storeName, price, unit = "1kg", quantity = 1, imageUrl = "", hasLiveVerification = false } = req.body;
    
    if (!productName || !price) {
      return res.status(400).json({ error: "productName and price are required" });
    }

    if (mongoose.connection.readyState === 1) {
      let cart = await Cart.findOne({ userId });
      if (!cart) cart = await Cart.create({ userId, items: [] });

      const existingIndex = cart.items.findIndex(
        (i) => (storeId ? i.storeId?.toString() === storeId : i.storeName === storeName) && 
               (productId ? i.productId?.toString() === productId : i.productName === productName)
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push({ storeId: storeId || null, productId: productId || null, productName, storeName, price, unit, quantity, imageUrl, hasLiveVerification });
      }

      await cart.save();
      return res.json(cart);
    } else {
      if (!memoryCarts.has(userId)) {
        memoryCarts.set(userId, { userId, items: [] });
      }
      const cart = memoryCarts.get(userId);
      const existingIndex = cart.items.findIndex(
        (i) => (storeId ? i.storeId === storeId : i.storeName === storeName) && 
               (productId ? i.productId === productId : i.productName === productName)
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push({ storeId: storeId || null, productId: productId || null, productName, storeName, price, unit, quantity, imageUrl, hasLiveVerification });
      }
      return res.json(cart);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/cart/items/:index
router.patch("/items/:index", async (req, res) => {
  try {
    const userId = getUserId(req);
    const index = parseInt(req.params.index, 10);
    const { quantity } = req.body;

    if (mongoose.connection.readyState === 1) {
      let cart = await Cart.findOne({ userId });
      if (!cart || index < 0 || index >= cart.items.length) {
        return res.status(404).json({ error: "Item not found in cart" });
      }

      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
      }

      await cart.save();
      return res.json(cart);
    } else {
      const cart = memoryCarts.get(userId);
      if (!cart || index < 0 || index >= cart.items.length) {
        return res.status(404).json({ error: "Item not found in cart" });
      }

      if (quantity <= 0) {
        cart.items.splice(index, 1);
      } else {
        cart.items[index].quantity = quantity;
      }
      return res.json(cart);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/items/:index
router.delete("/items/:index", async (req, res) => {
  try {
    const userId = getUserId(req);
    const index = parseInt(req.params.index, 10);

    if (mongoose.connection.readyState === 1) {
      let cart = await Cart.findOne({ userId });
      if (!cart || index < 0 || index >= cart.items.length) {
        return res.status(404).json({ error: "Item not found" });
      }

      cart.items.splice(index, 1);
      await cart.save();
      return res.json(cart);
    } else {
      const cart = memoryCarts.get(userId);
      if (!cart || index < 0 || index >= cart.items.length) {
        return res.status(404).json({ error: "Item not found" });
      }
      cart.items.splice(index, 1);
      return res.json(cart);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/checkout
router.post("/checkout", async (req, res) => {
  try {
    const userId = getUserId(req);
    if (mongoose.connection.readyState === 1) {
      let cart = await Cart.findOne({ userId });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    } else {
      if (memoryCarts.has(userId)) {
        memoryCarts.get(userId).items = [];
      }
    }
    res.json({ success: true, message: "Order placed successfully! Verified items dispatched." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
