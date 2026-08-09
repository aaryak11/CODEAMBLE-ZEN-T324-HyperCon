import { Router } from "express";
import Store from "../models/Store.js";
import StoreInventory from "../models/StoreInventory.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { isDBConnected } from "../db.js";
import { MEMORY_STORE_INVENTORY } from "./adminInventory.js";

const router = Router();

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const MEMORY_STORES = [
  {
    _id: "66b1a0000000000000000001",
    name: "Fresh Mart - Dombivli East",
    location: { lat: 19.2183, lng: 73.0864 },
    address: "Shop 12, Station Road, Dombivli East, Thane",
    phone: "9820198201",
    contact: "+91-9820198201",
    rating: 4.8,
    trustScore: { overall: 4.8, freshness: 4.9, deliveryAccuracy: 4.7, priceConsistency: 4.8, cameraUptime: 95 },
    cameraStreamId: "store1",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "live",
    feedReliability: "verified",
    operatingHours: { open: "07:00", close: "22:00" },
    avgDeliveryTime: 20,
    deliveryRadius: 5,
    description: "Your neighborhood fresh grocery store with daily farm-direct produce.",
    specialties: ["organic", "farm-fresh", "daily-delivery"]
  },
  {
    _id: "66b1a0000000000000000002",
    name: "Green Basket - AI Potato Demo",
    location: { lat: 19.2403, lng: 73.1305 },
    address: "45, Shivaji Chowk, Kalyan West, Thane",
    phone: "9833498334",
    contact: "+91-9833498334",
    rating: 4.5,
    trustScore: { overall: 4.5, freshness: 4.3, deliveryAccuracy: 4.6, priceConsistency: 4.5, cameraUptime: 88 },
    cameraStreamId: "potato_cam",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "live",
    feedReliability: "ai_generated",
    operatingHours: { open: "06:30", close: "23:00" },
    avgDeliveryTime: 25,
    deliveryRadius: 4,
    description: "Wholesale prices on everyday essentials. Bulk buying specialists.",
    specialties: ["wholesale", "bulk-deals", "staples"]
  },
  {
    _id: "66b1a0000000000000000003",
    name: "Nature's Harvest - Thane Central",
    location: { lat: 19.1970, lng: 72.9730 },
    address: "Viviana Mall Circle, Thane West",
    phone: "9877198771",
    contact: "+91-9877198771",
    rating: 4.9,
    trustScore: { overall: 4.9, freshness: 5.0, deliveryAccuracy: 4.8, priceConsistency: 4.9, cameraUptime: 98 },
    cameraStreamId: "store1",
    cameraFeedUrl: "https://videos.pexels.com/video-files/4066325/4066325-hd_1920_1080_25fps.mp4",
    cameraStatus: "live",
    feedReliability: "verified",
    operatingHours: { open: "07:00", close: "22:00" },
    avgDeliveryTime: 30,
    deliveryRadius: 6,
    description: "100% certified organic produce. Premium quality guaranteed.",
    specialties: ["organic", "certified", "premium"]
  }
];

const DEFAULT_MEMORY_INVENTORY = [
  { inventoryId: "inv1", productId: "p1", productName: "Fresh Farm Tomatoes", category: "vegetables", unit: "1kg", price: 34, originalPrice: 40, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack A", freshnessBadge: "Restocked 1h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv2", productId: "p2", productName: "Cavendish Bananas", category: "fruits", unit: "1 dozen", price: 52, originalPrice: 60, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack B", freshnessBadge: "Restocked this morning", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv3", productId: "p3", productName: "Full Cream Farm Milk", category: "dairy", unit: "1 Litre", price: 64, originalPrice: 68, stockStatus: "in_stock", shelfLocation: "Aisle 2, Rack A", freshnessBadge: "Fresh batch arrived today", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv4", productId: "p4", productName: "Royal Gala Apples", category: "fruits", unit: "1kg", price: 145, originalPrice: 160, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack C", freshnessBadge: "Restocked 2h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv5", productId: "p5", productName: "Organic Brown Potatoes", category: "vegetables", unit: "1kg", price: 25, originalPrice: 30, stockStatus: "in_stock", shelfLocation: "Aisle 3, Rack A", freshnessBadge: "Restocked yesterday", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv6", productId: "p6", productName: "Fresh Green Spinach", category: "vegetables", unit: "1 bunch", price: 20, originalPrice: 25, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack A", freshnessBadge: "Harvested today", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv7", productId: "p7", productName: "Alphonso Mangoes", category: "fruits", unit: "1kg", price: 320, originalPrice: 380, stockStatus: "low_stock", shelfLocation: "Aisle 1, Display Rack", freshnessBadge: "Seasonal Special", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv8", productId: "p8", productName: "Fresh Malai Paneer", category: "dairy", unit: "200g", price: 95, originalPrice: 110, stockStatus: "in_stock", shelfLocation: "Chiller 1", freshnessBadge: "Restocked 3h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv9", productId: "p9", productName: "Artisanal Sourdough Bread", category: "bakery", unit: "1 loaf", price: 65, originalPrice: 75, stockStatus: "in_stock", shelfLocation: "Bakery Counter", freshnessBadge: "Baked this morning", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv10", productId: "p10", productName: "English Cucumber", category: "vegetables", unit: "1kg", price: 28, originalPrice: 35, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack B", freshnessBadge: "Restocked 1h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv11", productId: "p11", productName: "Nashik Red Onions", category: "vegetables", unit: "1kg", price: 32, originalPrice: 38, stockStatus: "in_stock", shelfLocation: "Aisle 3, Rack B", freshnessBadge: "Restocked yesterday", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv12", productId: "p12", productName: "Sweet Yellow Corn", category: "vegetables", unit: "2 cobs", price: 30, originalPrice: 35, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack C", freshnessBadge: "Restocked this morning", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv13", productId: "p13", productName: "Seedless Green Grapes", category: "fruits", unit: "500g", price: 75, originalPrice: 90, stockStatus: "in_stock", shelfLocation: "Aisle 1, Rack D", freshnessBadge: "Restocked 2h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv14", productId: "p14", productName: "Farm Fresh Cow Curd", category: "dairy", unit: "500g", price: 45, originalPrice: 50, stockStatus: "in_stock", shelfLocation: "Chiller 2", freshnessBadge: "Restocked 1h ago", lastRestocked: new Date().toISOString() },
  { inventoryId: "inv15", productId: "p15", productName: "Pure Vedic A2 Ghee", category: "dairy", unit: "500ml", price: 360, originalPrice: 400, stockStatus: "in_stock", shelfLocation: "Aisle 2, Rack C", freshnessBadge: "Premium Stock", lastRestocked: new Date().toISOString() }
];

router.get("/", async (req, res) => {
  try {
    if (isDBConnected()) {
      const stores = await Store.find().lean();
      if (stores.length > 0) return res.json(stores);
    }
  } catch (e) {}
  res.json(MEMORY_STORES);
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;
    let store, inventory;
    
    if (isDBConnected()) {
      store = await Store.findById(id).lean();
      if (!store) {
        store = MEMORY_STORES.find(s => s._id?.toString() === id || s.cameraStreamId === id);
      }
      if (!store) return res.status(404).json({ error: 'Store not found' });
      
      const dbInv = await StoreInventory.find({ storeId: store._id })
        .populate('productId')
        .lean();
      
      if (dbInv.length > 0) {
        inventory = dbInv;
      } else {
        inventory = DEFAULT_MEMORY_INVENTORY;
      }
    } else {
      store = MEMORY_STORES.find(s => 
        s._id?.toString() === id || s.cameraStreamId === id);
      if (!store) return res.status(404).json({ error: 'Store not found' });
      inventory = DEFAULT_MEMORY_INVENTORY;
    }
    
    let distance = null, estimatedDelivery = null;
    if (lat && lng && store.location) {
      distance = haversine(parseFloat(lat), parseFloat(lng), 
                          store.location.lat, store.location.lng);
      estimatedDelivery = Math.round(distance * 5 + 10);
    }
    
    const categories = {};
    const inventoryItems = inventory.map((inv, idx) => {
      const product = inv.productId || inv.product || {};
      const productName = product.name || inv.productName || 'Unknown';
      const cat = product.category || inv.category || 'other';
      const unit = product.unit || inv.unit || '';
      const price = inv.price || 50;
      const originalPrice = inv.originalPrice || Math.round(price * 1.15);
      
      const item = {
        inventoryId: inv._id || inv.inventoryId || `inv-${idx}`,
        productId: product._id || inv.productId || `prod-${idx}`,
        productName,
        category: cat,
        unit,
        price,
        originalPrice,
        discount: originalPrice > price 
          ? Math.round((1 - price / originalPrice) * 100) : 0,
        stockStatus: inv.stockStatus || 'in_stock',
        shelfLocation: inv.shelfLocation || 'Aisle 1',
        freshnessBadge: inv.freshnessBadge || 'Restocked today',
        lastRestocked: inv.lastRestocked || new Date().toISOString(),
        imageUrl: product.imageUrl || inv.imageUrl || ''
      };
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
      return item;
    });
    
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const openTime = store.operatingHours?.open || "07:00";
    const closeTime = store.operatingHours?.close || "22:00";
    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    
    res.json({
      store: {
        _id: store._id,
        name: store.name,
        address: store.address,
        phone: store.phone || store.contact || '',
        location: store.location,
        rating: store.rating || 4.0,
        trustScore: store.trustScore || { overall: store.rating || 4.0, freshness: 4.5, deliveryAccuracy: 4.0, priceConsistency: 4.2, cameraUptime: 90 },
        description: store.description || 'Your neighborhood fresh grocery store with daily farm-direct produce.',
        specialties: store.specialties || ["organic", "farm-fresh", "daily-delivery"],
        cameraStreamId: store.cameraStreamId || '',
        cameraFeedUrl: store.cameraFeedUrl || '',
        cameraStatus: store.cameraStatus || 'live',
        feedReliability: store.feedReliability || 'verified',
        operatingHours: store.operatingHours || { open: "07:00", close: "22:00" },
        isOpen,
        avgDeliveryTime: store.avgDeliveryTime || 25,
        deliveryRadius: store.deliveryRadius || 5
      },
      distance: distance ? Number(distance.toFixed(2)) : null,
      estimatedDelivery: estimatedDelivery || store.avgDeliveryTime || 25,
      totalProducts: inventoryItems.length,
      categories: Object.keys(categories),
      inventory: inventoryItems,
      inventoryByCategory: categories
    });
  } catch (error) {
    console.error('Store detail error:', error);
    res.status(500).json({ error: 'Failed to fetch store details' });
  }
});

export default router;
