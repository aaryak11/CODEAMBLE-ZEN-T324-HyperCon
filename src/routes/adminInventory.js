import { Router } from "express";
import mongoose from "mongoose";
import StoreInventory from "../models/StoreInventory.js";
import Product from "../models/Product.js";
import { authenticateAdminToken } from "./adminAuth.js";
import { broadcastEvent } from "../realtime.js";
import { MEMORY_PRODUCTS } from "./search.js";

const router = Router();

// Store specific inventory memory repository
export const MEMORY_STORE_INVENTORY = [
  {
    _id: "inv_1",
    storeId: "66b1a0000000000000000001",
    productId: "p1",
    name: "Fresh Farm Tomatoes",
    category: "Produce & Veggies",
    unit: "1kg",
    price: 34,
    originalPrice: 42,
    stockStatus: "in_stock",
    shelfLocation: "Aisle 1 - Shelf B (Veg Rack)",
    imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  },
  {
    _id: "inv_2",
    storeId: "66b1a0000000000000000001",
    productId: "p2",
    name: "Cavendish Bananas",
    category: "Fresh Fruits",
    unit: "1 dozen",
    price: 52,
    originalPrice: 60,
    stockStatus: "in_stock",
    shelfLocation: "Aisle 2 - Fruit Display 1",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  },
  {
    _id: "inv_3",
    storeId: "66b1a0000000000000000001",
    productId: "p3",
    name: "Full Cream Farm Milk",
    category: "Dairy & Eggs",
    unit: "1 Litre",
    price: 64,
    originalPrice: 68,
    stockStatus: "in_stock",
    shelfLocation: "Dairy Chiller #3",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  },
  {
    _id: "inv_4",
    storeId: "66b1a0000000000000000001",
    productId: "p4",
    name: "Royal Gala Apples",
    category: "Fresh Fruits",
    unit: "1kg",
    price: 145,
    originalPrice: 165,
    stockStatus: "low_stock",
    shelfLocation: "Aisle 2 - Cold Rack",
    imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  },
  {
    _id: "inv_5",
    storeId: "66b1a0000000000000000001",
    productId: "p5",
    name: "Organic Brown Potatoes",
    category: "Produce & Veggies",
    unit: "1kg",
    price: 25,
    originalPrice: 30,
    stockStatus: "in_stock",
    shelfLocation: "Aisle 1 - Ground Bin 4",
    imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  },
  {
    _id: "inv_6",
    storeId: "66b1a0000000000000000001",
    productId: "p8",
    name: "Fresh Malai Paneer",
    category: "Dairy & Eggs",
    unit: "200g",
    price: 95,
    originalPrice: 105,
    stockStatus: "in_stock",
    shelfLocation: "Dairy Chiller #1",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
    lastUpdated: new Date()
  }
];

// GET /api/admin/inventory
router.get("/", authenticateAdminToken, async (req, res) => {
  try {
    const { storeId } = req.adminUser;

    let items = [];
    if (mongoose.connection.readyState === 1) {
      const inventoryList = await StoreInventory.find({ storeId }).populate("productId").lean();
      items = inventoryList.map((inv) => ({
        _id: inv._id,
        productId: inv.productId?._id,
        name: inv.productId?.name || "Perishable Item",
        category: inv.productId?.category || "Produce & Veggies",
        unit: inv.productId?.unit || "1kg",
        price: inv.price,
        stockStatus: inv.stockStatus,
        shelfLocation: inv.shelfLocation || "Main Display",
        imageUrl: inv.productId?.imageUrl || "",
        lastUpdated: inv.lastUpdated
      }));
    } else {
      // Memory filter
      items = MEMORY_STORE_INVENTORY.filter(
        (i) => i.storeId.toString() === storeId.toString()
      );
      if (items.length === 0) {
        // If it's a new signup store, provide starter copy from memory
        items = MEMORY_STORE_INVENTORY.slice(0, 4).map((i) => ({
          ...i,
          _id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          storeId: storeId
        }));
        MEMORY_STORE_INVENTORY.push(...items);
      }
    }

    const inStockCount = items.filter((i) => i.stockStatus === "in_stock").length;
    const lowStockCount = items.filter((i) => i.stockStatus === "low_stock").length;
    const outOfStockCount = items.filter((i) => i.stockStatus === "out_of_stock").length;

    res.json({
      totalCount: items.length,
      stats: { inStockCount, lowStockCount, outOfStockCount },
      items
    });
  } catch (err) {
    console.error("Fetch inventory error:", err);
    res.status(500).json({ error: "Failed to fetch store inventory." });
  }
});

// POST /api/admin/inventory (Add new item)
router.post("/", authenticateAdminToken, async (req, res) => {
  try {
    const { storeId, storeName } = req.adminUser;
    const { name, category, price, unit, imageUrl, stockStatus, shelfLocation } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: "Product name and price are required." });
    }

    const parsedPrice = parseFloat(price);
    const itemStockStatus = stockStatus || "in_stock";
    const itemUnit = unit || "1kg";
    const itemCategory = category || "Produce & Veggies";
    const itemShelf = shelfLocation || "Main Aisle Shelf A";
    const itemImage =
      imageUrl ||
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80";

    let newItem;

    if (mongoose.connection.readyState === 1) {
      // Find or create product
      let product = await Product.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
      if (!product) {
        product = await Product.create({
          name,
          category: itemCategory,
          unit: itemUnit,
          imageUrl: itemImage,
          price: parsedPrice
        });
      }

      const invRecord = await StoreInventory.create({
        storeId,
        productId: product._id,
        price: parsedPrice,
        stockStatus: itemStockStatus,
        shelfLocation: itemShelf,
        lastUpdated: new Date()
      });

      newItem = {
        _id: invRecord._id,
        productId: product._id,
        name: product.name,
        category: product.category,
        unit: product.unit,
        price: invRecord.price,
        stockStatus: invRecord.stockStatus,
        shelfLocation: itemShelf,
        imageUrl: product.imageUrl,
        lastUpdated: invRecord.lastUpdated
      };
    } else {
      // Memory Store addition
      const newProductId = `p_custom_${Date.now()}`;
      MEMORY_PRODUCTS.push({
        _id: newProductId,
        name,
        category: itemCategory,
        unit: itemUnit,
        imageUrl: itemImage,
        price: parsedPrice
      });

      newItem = {
        _id: `inv_${Date.now()}`,
        storeId,
        productId: newProductId,
        name,
        category: itemCategory,
        unit: itemUnit,
        price: parsedPrice,
        originalPrice: Math.round(parsedPrice * 1.15),
        stockStatus: itemStockStatus,
        shelfLocation: itemShelf,
        imageUrl: itemImage,
        lastUpdated: new Date()
      };

      MEMORY_STORE_INVENTORY.unshift(newItem);
    }

    // Broadcast real-time new arrival event to customer browsers via WebSocket
    broadcastEvent("new_arrival", {
      storeId,
      storeName: storeName || "Local Partner Store",
      productName: newItem.name,
      category: newItem.category,
      price: newItem.price,
      unit: newItem.unit,
      imageUrl: newItem.imageUrl,
      shelfLocation: newItem.shelfLocation,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      message: "Product added to store inventory successfully.",
      item: newItem
    });
  } catch (err) {
    console.error("Add inventory error:", err);
    res.status(500).json({ error: "Failed to add product to inventory." });
  }
});

// PUT /api/admin/inventory/:id
router.put("/:id", authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId, storeName } = req.adminUser;
    const { price, stockStatus, unit, shelfLocation, name } = req.body;

    let updatedItem = null;

    if (mongoose.connection.readyState === 1) {
      const invRecord = await StoreInventory.findOne({ _id: id, storeId });
      if (!invRecord) {
        return res.status(404).json({ error: "Inventory item not found." });
      }

      if (price !== undefined) invRecord.price = parseFloat(price);
      if (stockStatus !== undefined) invRecord.stockStatus = stockStatus;
      if (shelfLocation !== undefined) invRecord.shelfLocation = shelfLocation;
      invRecord.lastUpdated = new Date();
      await invRecord.save();

      if (name || unit) {
        await Product.findByIdAndUpdate(invRecord.productId, {
          ...(name && { name }),
          ...(unit && { unit })
        });
      }

      const populated = await StoreInventory.findById(id).populate("productId").lean();
      updatedItem = {
        _id: populated._id,
        productId: populated.productId?._id,
        name: populated.productId?.name,
        category: populated.productId?.category,
        unit: populated.productId?.unit,
        price: populated.price,
        stockStatus: populated.stockStatus,
        shelfLocation: populated.shelfLocation,
        imageUrl: populated.productId?.imageUrl,
        lastUpdated: populated.lastUpdated
      };
    } else {
      const index = MEMORY_STORE_INVENTORY.findIndex(
        (i) => i._id.toString() === id.toString() && i.storeId.toString() === storeId.toString()
      );

      if (index === -1) {
        return res.status(404).json({ error: "Inventory item not found." });
      }

      if (price !== undefined) MEMORY_STORE_INVENTORY[index].price = parseFloat(price);
      if (stockStatus !== undefined) MEMORY_STORE_INVENTORY[index].stockStatus = stockStatus;
      if (unit !== undefined) MEMORY_STORE_INVENTORY[index].unit = unit;
      if (name !== undefined) MEMORY_STORE_INVENTORY[index].name = name;
      if (shelfLocation !== undefined) MEMORY_STORE_INVENTORY[index].shelfLocation = shelfLocation;
      MEMORY_STORE_INVENTORY[index].lastUpdated = new Date();

      updatedItem = MEMORY_STORE_INVENTORY[index];
    }

    // Broadcast inventory update
    broadcastEvent("inventory_update", {
      storeId,
      storeName: storeName || "Local Partner Store",
      item: updatedItem
    });

    res.json({
      message: "Inventory item updated successfully.",
      item: updatedItem
    });
  } catch (err) {
    console.error("Update inventory error:", err);
    res.status(500).json({ error: "Failed to update inventory item." });
  }
});

// DELETE /api/admin/inventory/:id
router.delete("/:id", authenticateAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.adminUser;

    if (mongoose.connection.readyState === 1) {
      await StoreInventory.findOneAndDelete({ _id: id, storeId });
    } else {
      const idx = MEMORY_STORE_INVENTORY.findIndex(
        (i) => i._id.toString() === id.toString() && i.storeId.toString() === storeId.toString()
      );
      if (idx !== -1) {
        MEMORY_STORE_INVENTORY.splice(idx, 1);
      }
    }

    res.json({ message: "Inventory item removed successfully.", id });
  } catch (err) {
    console.error("Delete inventory error:", err);
    res.status(500).json({ error: "Failed to delete inventory item." });
  }
});

export default router;
