import { Router } from "express";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import StoreInventory from "../models/StoreInventory.js";
import MockExternalPrice from "../models/MockExternalPrice.js";
import mongoose from "mongoose";
import { MEMORY_STORES } from "./stores.js";
import { MEMORY_STORE_INVENTORY } from "./adminInventory.js";

const router = Router();

function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function normalize(value, min, max) {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// Complete 35 products dataset for zero-config memory search
export const MEMORY_PRODUCTS = [
  { _id: "p1", name: "Fresh Farm Tomatoes", category: "Produce & Veggies", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80", price: 34 },
  { _id: "p2", name: "Cavendish Bananas", category: "Fresh Fruits", unit: "1 dozen", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80", price: 52 },
  { _id: "p3", name: "Full Cream Farm Milk", category: "Dairy & Eggs", unit: "1 Litre", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80", price: 64 },
  { _id: "p4", name: "Royal Gala Apples", category: "Fresh Fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80", price: 145 },
  { _id: "p5", name: "Organic Brown Potatoes", category: "Produce & Veggies", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", price: 25 },
  { _id: "p6", name: "Fresh Green Spinach", category: "Produce & Veggies", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80", price: 20 },
  { _id: "p7", name: "Alphonso Mangoes", category: "Fresh Fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80", price: 320 },
  { _id: "p8", name: "Fresh Malai Paneer", category: "Dairy & Eggs", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80", price: 95 },
  { _id: "p9", name: "Artisanal Sourdough Bread", category: "Bakery & Breads", unit: "1 loaf", imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=500&auto=format&fit=crop&q=80", price: 65 },
  { _id: "p10", name: "English Cucumber", category: "Produce & Veggies", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80", price: 28 },
  { _id: "p11", name: "Nashik Red Onions", category: "Produce & Veggies", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80", price: 32 },
  { _id: "p12", name: "Sweet Yellow Corn", category: "Produce & Veggies", unit: "2 cobs", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80", price: 30 },
  { _id: "p13", name: "Seedless Green Grapes", category: "Fresh Fruits", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80", price: 75 },
  { _id: "p14", name: "Farm Fresh Cow Curd", category: "Dairy & Eggs", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80", price: 45 },
  { _id: "p15", name: "Pure Vedic A2 Ghee", category: "Dairy & Eggs", unit: "500ml", imageUrl: "https://images.unsplash.com/photo-1628102491629-778571d893a3?w=500&auto=format&fit=crop&q=80", price: 360 },
  { _id: "p16", name: "100% Whole Wheat Bread", category: "Bakery & Breads", unit: "400g", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", price: 40 },
  { _id: "p17", name: "Organic Button Mushrooms", category: "Organic & Farm", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80", price: 55 },
  { _id: "p18", name: "Fresh Broccoli Florets", category: "Produce & Veggies", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80", price: 60 },
  { _id: "p19", name: "Sweet Green Peas", category: "Produce & Veggies", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80", price: 48 },
  { _id: "p20", name: "Farm Fresh Brown Eggs", category: "Dairy & Eggs", unit: "6 pcs", imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80", price: 68 },
  { _id: "p21", name: "Fresh Tender Coconut Water", category: "Beverages & Juices", unit: "1 pc", imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80", price: 45 },
  { _id: "p22", name: "Cold-Pressed Valencia Orange Juice", category: "Beverages & Juices", unit: "300ml", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80", price: 85 },
  { _id: "p23", name: "Hass Avocados", category: "Organic & Farm", unit: "2 pcs", imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80", price: 160 },
  { _id: "p24", name: "Wild Organic Raw Honey", category: "Organic & Farm", unit: "250g", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80", price: 180 },
  { _id: "p25", name: "Tri-Color Bell Peppers", category: "Produce & Veggies", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80", price: 95 },
  { _id: "p26", name: "Fresh Coriander Leaves", category: "Produce & Veggies", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1588879460405-560960533a69?w=500&auto=format&fit=crop&q=80", price: 15 },
  { _id: "p27", name: "Juicy Seedless Lemons", category: "Produce & Veggies", unit: "250g", imageUrl: "https://images.unsplash.com/photo-1534531141161-e416040d9d30?w=500&auto=format&fit=crop&q=80", price: 30 },
  { _id: "p28", name: "Mahabaleshwar Strawberries", category: "Fresh Fruits", unit: "200g box", imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80", price: 130 },
  { _id: "p29", name: "Blueberry Greek Yogurt", category: "Dairy & Eggs", unit: "150g", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80", price: 60 },
  { _id: "p30", name: "Organic Cold Pressed Olive Oil", category: "Organic & Farm", unit: "500ml", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80", price: 450 },
  { _id: "p31", name: "Multigrain Digestive Biscuits", category: "Bakery & Breads", unit: "250g pack", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80", price: 50 },
  { _id: "p32", name: "Kandhari Pomegranate", category: "Fresh Fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80", price: 140 },
  { _id: "p33", name: "Raw Organic Chia Seeds", category: "Organic & Farm", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=500&auto=format&fit=crop&q=80", price: 110 },
  { _id: "p34", name: "Fresh Mint Bunch", category: "Produce & Veggies", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80", price: 12 },
  { _id: "p35", name: "Unsweetened Almond Milk", category: "Beverages & Juices", unit: "1 Litre", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", price: 180 },
];

router.get("/", async (req, res) => {
  const product = req.query.product || req.query.q;
  const lat = req.query.lat || 19.2183;
  const lng = req.query.lng || 73.0864;

  if (!product) return res.status(400).json({ error: "product or q query param is required" });

  const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
  const queryLower = product.trim().toLowerCase();

  let matchedProducts = [];
  let inventoryEntries = [];
  let externalPrices = [];
  let storesList = MEMORY_STORES;

  if (mongoose.connection.readyState === 1) {
    try {
      const escapedQuery = product.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // 1. Try name match first
      matchedProducts = await Product.find({
        name: { $regex: escapedQuery, $options: "i" },
      }).lean();

      // 2. Fall back to category match if no name matches
      if (matchedProducts.length === 0) {
        matchedProducts = await Product.find({
          category: { $regex: escapedQuery, $options: "i" },
        }).lean();
      }

      if (matchedProducts.length > 0) {
        const pIds = matchedProducts.map((p) => p._id);
        [inventoryEntries, externalPrices, storesList] = await Promise.all([
          StoreInventory.find({ productId: { $in: pIds }, stockStatus: { $ne: "out_of_stock" } }).lean(),
          MockExternalPrice.find({ productId: { $in: pIds } }).lean(),
          Store.find().lean(),
        ]);
      }
    } catch (e) {}
  }

  // Memory fallback logic — strict relevance filter
  if (matchedProducts.length === 0) {
    // 1. First priority: match by product name substring
    const nameMatches = MEMORY_PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(queryLower)
    );

    // 2. Also check custom items added by store owners in admin panel
    const adminMatches = MEMORY_STORE_INVENTORY.filter(
      (inv) =>
        inv.name.toLowerCase().includes(queryLower) ||
        inv.category.toLowerCase().includes(queryLower)
    ).map((inv) => ({
      _id: inv.productId || inv._id,
      name: inv.name,
      category: inv.category,
      unit: inv.unit || "1kg",
      imageUrl: inv.imageUrl || "",
      price: inv.price,
    }));

    if (nameMatches.length > 0) {
      matchedProducts = nameMatches;
    } else {
      // 3. Fall back to category substring match ONLY if no name matched
      matchedProducts = MEMORY_PRODUCTS.filter((p) =>
        p.category.toLowerCase().includes(queryLower)
      );
    }

    // Merge admin inventory matches if any exist
    if (adminMatches.length > 0) {
      const existingIds = new Set(matchedProducts.map((p) => p._id.toString()));
      adminMatches.forEach((am) => {
        if (!existingIds.has(am._id.toString())) {
          matchedProducts.unshift(am);
        }
      });
    }

    // DO NOT fallback to random products if query doesn't match
    if (matchedProducts.length === 0) {
      return res.json({ query: product, userLocation, results: [] });
    }

    storesList = MEMORY_STORES;

    // Generate realistic inventory & external prices dynamically for matched memory products
    for (const prod of matchedProducts) {
      // Pick 2-3 local stores for each matched product
      const s1 = MEMORY_STORES[0];
      const s2 = MEMORY_STORES[1];
      const s3 = MEMORY_STORES[2];

      inventoryEntries.push(
        { storeId: s1._id, productId: prod._id, price: prod.price, stockStatus: "in_stock" },
        { storeId: s2._id, productId: prod._id, price: Math.round(prod.price * 0.95), stockStatus: "in_stock" },
        { storeId: s3._id, productId: prod._id, price: Math.round(prod.price * 1.05), stockStatus: "in_stock" }
      );

      externalPrices.push(
        { productId: prod._id, source: "Blinkit", price: Math.round(prod.price * 1.15), deliveryEtaMinutes: 15 },
        { productId: prod._id, source: "Amazon Fresh", price: Math.round(prod.price * 1.10), deliveryEtaMinutes: 90 }
      );
    }
  }

  const storeById = Object.fromEntries(storesList.map((s) => [s._id.toString(), s]));
  const productById = Object.fromEntries(matchedProducts.map((p) => [p._id.toString(), p]));

  const candidates = [];

  for (const entry of inventoryEntries) {
    const store = storeById[entry.storeId.toString()];
    const prod = productById[entry.productId.toString()];
    if (!store || !prod) continue;
    candidates.push({
      type: "local_store",
      productId: entry.productId,
      productName: prod.name,
      unit: prod.unit || "1kg",
      imageUrl: prod.imageUrl || "",
      storeId: store._id,
      storeName: store.name,
      price: entry.price,
      distanceKm: distanceKm(userLocation, store.location),
      deliveryEtaMinutes: 20,
      stockStatus: entry.stockStatus,
      hasLiveVerification: true,
    });
  }

  for (const entry of externalPrices) {
    const prod = productById[entry.productId.toString()];
    if (!prod) continue;
    candidates.push({
      type: "external",
      productId: entry.productId,
      productName: prod.name,
      unit: prod.unit || "1kg",
      imageUrl: prod.imageUrl || "",
      source: entry.source,
      storeName: entry.source,
      price: entry.price,
      distanceKm: null,
      deliveryEtaMinutes: entry.deliveryEtaMinutes,
      hasLiveVerification: false,
    });
  }

  if (candidates.length === 0) return res.json({ query: product, userLocation, results: [] });

  const localDistances = candidates.filter((c) => c.distanceKm !== null).map((c) => c.distanceKm);
  const neutralDistance = localDistances.length ? Math.max(...localDistances) : 0;
  candidates.forEach((c) => {
    if (c.distanceKm === null) c.distanceKm = neutralDistance;
  });

  const prices = candidates.map((c) => c.price);
  const distances = candidates.map((c) => c.distanceKm);
  const etas = candidates.map((c) => c.deliveryEtaMinutes);

  const priceRange = [Math.min(...prices), Math.max(...prices)];
  const distanceRange = [Math.min(...distances), Math.max(...distances)];
  const etaRange = [Math.min(...etas), Math.max(...etas)];

  const WEIGHTS = { price: 0.4, distance: 0.3, delivery: 0.3 };

  const scored = candidates.map((c) => {
    const priceScore = normalize(c.price, ...priceRange);
    const distanceScore = normalize(c.distanceKm, ...distanceRange);
    const etaScore = normalize(c.deliveryEtaMinutes, ...etaRange);

    const combinedScore =
      priceScore * WEIGHTS.price + distanceScore * WEIGHTS.distance + etaScore * WEIGHTS.delivery;

    return { ...c, score: Number(combinedScore.toFixed(4)) };
  });

  scored.sort((a, b) => a.score - b.score);
  scored.forEach((c, i) => {
    c.isSmartestOption = i === 0;
  });

  res.json({ query: product, userLocation, results: scored });
});

export default router;
