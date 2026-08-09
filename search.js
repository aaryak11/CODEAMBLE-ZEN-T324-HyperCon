import { Router } from "express";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import StoreInventory from "../models/StoreInventory.js";
import MockExternalPrice from "../models/MockExternalPrice.js";
import mongoose from "mongoose";
import { isDBConnected } from "../db.js";
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

function generateExplanation(winner, allResults) {
  if (!winner || allResults.length === 0) return '';
  const parts = [];
  const cheapest = allResults.reduce((a, b) => a.price < b.price ? a : b);
  const fastest = allResults.reduce((a, b) => 
    a.deliveryEtaMinutes < b.deliveryEtaMinutes ? a : b);
  
  if (winner.storeName === cheapest.storeName) {
    parts.push(`cheapest at ₹${winner.price}`);
  } else {
    const diff = winner.price - cheapest.price;
    parts.push(`₹${diff} more than ${cheapest.storeName}, but`);
  }
  
  if (winner.storeName === fastest.storeName) {
    parts.push(`fastest delivery in ${winner.deliveryEtaMinutes} min`);
  } else if (winner.deliveryEtaMinutes < fastest.deliveryEtaMinutes + 10) {
    parts.push(`only ${winner.deliveryEtaMinutes} min delivery`);
  }
  
  if (winner.distanceKm != null) {
    parts.push(`${winner.distanceKm.toFixed(1)} km away`);
  }
  
  if (winner.hasLiveFeed || winner.cameraStatus === 'live') {
    parts.push(`live camera for freshness verification`);
  }
  
  return `Best value: ${parts.join(', ')}.`;
}

// Complete 35 products dataset for zero-config memory search
export const MEMORY_PRODUCTS = [
  { _id: "p1", name: "Fresh Farm Tomatoes", category: "vegetables", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80", price: 34, tags: ["fresh","perishable","salad"] },
  { _id: "p2", name: "Cavendish Bananas", category: "fruits", unit: "1 dozen", imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80", price: 52, tags: ["fresh","perishable","tropical"] },
  { _id: "p3", name: "Full Cream Farm Milk", category: "dairy", unit: "1 Litre", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80", price: 64, tags: ["fresh","perishable","daily"] },
  { _id: "p4", name: "Royal Gala Apples", category: "fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80", price: 145, tags: ["fresh","perishable","imported"] },
  { _id: "p5", name: "Organic Brown Potatoes", category: "vegetables", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", price: 25, tags: ["fresh","staple","root"] },
  { _id: "p6", name: "Fresh Green Spinach", category: "vegetables", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80", price: 20, tags: ["fresh","perishable","leafy"] },
  { _id: "p7", name: "Alphonso Mangoes", category: "fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80", price: 320, tags: ["fresh","seasonal","premium"] },
  { _id: "p8", name: "Fresh Malai Paneer", category: "dairy", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80", price: 95, tags: ["fresh","perishable","protein"] },
  { _id: "p9", name: "Artisanal Sourdough Bread", category: "bakery", unit: "1 loaf", imageUrl: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=500&auto=format&fit=crop&q=80", price: 65, tags: ["fresh","perishable","daily"] },
  { _id: "p10", name: "English Cucumber", category: "vegetables", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop&q=80", price: 28, tags: ["fresh","perishable","salad"] },
  { _id: "p11", name: "Nashik Red Onions", category: "vegetables", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80", price: 32, tags: ["fresh","staple","cooking"] },
  { _id: "p12", name: "Sweet Yellow Corn", category: "vegetables", unit: "2 cobs", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&auto=format&fit=crop&q=80", price: 30, tags: ["fresh","perishable"] },
  { _id: "p13", name: "Seedless Green Grapes", category: "fruits", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80", price: 75, tags: ["fresh","perishable"] },
  { _id: "p14", name: "Farm Fresh Cow Curd", category: "dairy", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80", price: 45, tags: ["fresh","perishable","probiotic"] },
  { _id: "p15", name: "Pure Vedic A2 Ghee", category: "dairy", unit: "500ml", imageUrl: "https://images.unsplash.com/photo-1628102491629-778571d893a3?w=500&auto=format&fit=crop&q=80", price: 360, tags: ["staple"] },
  { _id: "p16", name: "100% Whole Wheat Bread", category: "bakery", unit: "400g", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", price: 40, tags: ["fresh","perishable","daily"] },
  { _id: "p17", name: "Organic Button Mushrooms", category: "vegetables", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80", price: 55, tags: ["fresh","organic"] },
  { _id: "p18", name: "Fresh Broccoli Florets", category: "vegetables", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80", price: 60, tags: ["fresh","perishable"] },
  { _id: "p19", name: "Sweet Green Peas", category: "vegetables", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80", price: 48, tags: ["fresh","perishable"] },
  { _id: "p20", name: "Farm Fresh Brown Eggs", category: "meat", unit: "6 pcs", imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=500&auto=format&fit=crop&q=80", price: 68, tags: ["fresh","protein","daily"] },
  { _id: "p21", name: "Fresh Tender Coconut Water", category: "beverages", unit: "1 pc", imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80", price: 45, tags: ["fresh","perishable","healthy"] },
  { _id: "p22", name: "Cold-Pressed Valencia Orange Juice", category: "beverages", unit: "300ml", imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80", price: 85, tags: ["fresh","perishable"] },
  { _id: "p23", name: "Hass Avocados", category: "fruits", unit: "2 pcs", imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&auto=format&fit=crop&q=80", price: 160, tags: ["fresh","organic"] },
  { _id: "p24", name: "Wild Organic Raw Honey", category: "staples", unit: "250g", imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&auto=format&fit=crop&q=80", price: 180, tags: ["organic"] },
  { _id: "p25", name: "Tri-Color Bell Peppers", category: "vegetables", unit: "500g", imageUrl: "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=500&auto=format&fit=crop&q=80", price: 95, tags: ["fresh","perishable","capsicum"] },
  { _id: "p26", name: "Fresh Coriander Leaves", category: "vegetables", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1588879460405-560960533a69?w=500&auto=format&fit=crop&q=80", price: 15, tags: ["fresh","perishable"] },
  { _id: "p27", name: "Juicy Seedless Lemons", category: "vegetables", unit: "250g", imageUrl: "https://images.unsplash.com/photo-1534531141161-e416040d9d30?w=500&auto=format&fit=crop&q=80", price: 30, tags: ["fresh","perishable"] },
  { _id: "p28", name: "Mahabaleshwar Strawberries", category: "fruits", unit: "200g box", imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80", price: 130, tags: ["fresh","seasonal"] },
  { _id: "p29", name: "Blueberry Greek Yogurt", category: "dairy", unit: "150g", imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80", price: 60, tags: ["fresh","probiotic"] },
  { _id: "p30", name: "Organic Cold Pressed Olive Oil", category: "staples", unit: "500ml", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80", price: 450, tags: ["organic"] },
  { _id: "p31", name: "Multigrain Digestive Biscuits", category: "bakery", unit: "250g pack", imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80", price: 50, tags: ["snack","biscuits"] },
  { _id: "p32", name: "Kandhari Pomegranate", category: "fruits", unit: "1kg", imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80", price: 140, tags: ["fresh"] },
  { _id: "p33", name: "Raw Organic Chia Seeds", category: "staples", unit: "200g", imageUrl: "https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=500&auto=format&fit=crop&q=80", price: 110, tags: ["organic"] },
  { _id: "p34", name: "Fresh Mint Bunch", category: "vegetables", unit: "1 bunch", imageUrl: "https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=500&auto=format&fit=crop&q=80", price: 12, tags: ["fresh","perishable"] },
  { _id: "p35", name: "Unsweetened Almond Milk", category: "beverages", unit: "1 Litre", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", price: 180, tags: ["dairy-free","healthy"] },
];

router.get("/", async (req, res) => {
  const query = (req.query.product || req.query.q || '').trim();
  const lat = req.query.lat || 19.2183;
  const lng = req.query.lng || 73.0864;

  const WEIGHTS = { price: 0.4, distance: 0.3, delivery: 0.3 };

  // Edge case guard: empty query
  if (!query) {
    return res.json({
      query: '', totalResults: 0, results: [], smartestPick: null,
      message: 'Please enter a product name to search',
      suggestions: ['Tomatoes', 'Onions', 'Paneer', 'Bread', 'Chicken', 'Mangoes'],
      algorithm: { weights: { price: 0.4, distance: 0.3, deliveryTime: 0.3 } }
    });
  }

  // Edge case guard: query under 2 chars
  if (query.length < 2) {
    return res.json({
      query, totalResults: 0, results: [], smartestPick: null,
      message: 'Search query must be at least 2 characters',
      algorithm: { weights: { price: 0.4, distance: 0.3, deliveryTime: 0.3 } }
    });
  }

  const userLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
  const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let matchedProducts = [];
  let inventoryEntries = [];
  let externalPrices = [];
  let storesList = MEMORY_STORES;

  if (isDBConnected()) {
    try {
      // 1. Try name match first
      matchedProducts = await Product.find({
        name: { $regex: sanitizedQuery, $options: "i" }
      }).lean();

      // 2. Try tag match if no name match
      if (matchedProducts.length === 0) {
        matchedProducts = await Product.find({
          tags: { $regex: sanitizedQuery, $options: "i" }
        }).lean();
      }

      // 3. Fall back to category match
      if (matchedProducts.length === 0) {
        matchedProducts = await Product.find({
          category: { $regex: sanitizedQuery, $options: "i" }
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
    } catch (e) {
      console.warn("DB search error, using memory fallback:", e.message);
    }
  }

  // Memory fallback logic — name → tag → category
  if (matchedProducts.length === 0) {
    const qLower = sanitizedQuery.toLowerCase();
    
    const nameMatches = MEMORY_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(qLower)
    );
    const tagMatches = nameMatches.length === 0 
      ? MEMORY_PRODUCTS.filter(p => p.tags?.some(t => 
          t.toLowerCase().includes(qLower)))
      : [];
    const categoryMatches = (nameMatches.length === 0 && tagMatches.length === 0)
      ? MEMORY_PRODUCTS.filter(p => p.category.toLowerCase().includes(qLower))
      : [];

    matchedProducts = nameMatches.length ? nameMatches 
                    : tagMatches.length ? tagMatches 
                    : categoryMatches;

    // Check custom items added by store owners in admin panel
    const adminMatches = (MEMORY_STORE_INVENTORY || []).filter(
      (inv) =>
        inv.name?.toLowerCase().includes(qLower) ||
        inv.category?.toLowerCase().includes(qLower)
    ).map((inv) => ({
      _id: inv.productId || inv._id,
      name: inv.name,
      category: inv.category,
      unit: inv.unit || "1kg",
      imageUrl: inv.imageUrl || "",
      price: inv.price,
    }));

    if (adminMatches.length > 0) {
      const existingIds = new Set(matchedProducts.map((p) => p._id.toString()));
      adminMatches.forEach((am) => {
        if (!existingIds.has(am._id.toString())) {
          matchedProducts.unshift(am);
        }
      });
    }

    if (matchedProducts.length === 0) {
      return res.json({
        query, totalResults: 0, results: [], smartestPick: null,
        message: `No products found matching "${query}"`,
        suggestions: ['Tomatoes', 'Onions', 'Paneer', 'Bread', 'Chicken', 'Mangoes'],
        algorithm: { weights: { price: 0.4, distance: 0.3, deliveryTime: 0.3 } }
      });
    }

    storesList = MEMORY_STORES;

    for (const prod of matchedProducts) {
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
      category: prod.category || "General",
      unit: prod.unit || "1kg",
      imageUrl: prod.imageUrl || "",
      storeId: store._id,
      storeName: store.name,
      price: entry.price,
      distanceKm: distanceKm(userLocation, store.location),
      deliveryEtaMinutes: store.avgDeliveryTime || 20,
      stockStatus: entry.stockStatus,
      trustScore: store.trustScore?.overall || store.rating || 4.0,
      trustScoreBreakdown: store.trustScore || null,
      cameraStatus: store.cameraStatus || 'offline',
      hasLiveFeed: store.cameraStatus === 'live',
      hasLiveVerification: store.cameraStatus === 'live' || true
    });
  }

  for (const entry of externalPrices) {
    const prod = productById[entry.productId.toString()];
    if (!prod) continue;
    candidates.push({
      type: "external",
      productId: entry.productId,
      productName: prod.name,
      category: prod.category || "General",
      unit: prod.unit || "1kg",
      imageUrl: prod.imageUrl || "",
      source: entry.source,
      storeName: entry.source,
      price: entry.price,
      distanceKm: null,
      deliveryEtaMinutes: entry.deliveryEtaMinutes,
      trustScore: 4.0,
      cameraStatus: 'offline',
      hasLiveFeed: false,
      hasLiveVerification: false
    });
  }

  if (candidates.length === 0) {
    return res.json({
      query, totalResults: 0, results: [], smartestPick: null,
      message: `No products found matching "${query}"`,
      suggestions: ['Tomatoes', 'Onions', 'Paneer', 'Bread', 'Chicken', 'Mangoes'],
      algorithm: { weights: { price: 0.4, distance: 0.3, deliveryTime: 0.3 } }
    });
  }

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

  const scored = candidates.map((c) => {
    const priceScore = normalize(c.price, ...priceRange);
    const distanceScore = normalize(c.distanceKm, ...distanceRange);
    const etaScore = normalize(c.deliveryEtaMinutes, ...etaRange);

    const combinedScore =
      priceScore * WEIGHTS.price + distanceScore * WEIGHTS.distance + etaScore * WEIGHTS.delivery;

    const priceComponent = Number((priceScore * WEIGHTS.price).toFixed(4));
    const distanceComponent = Number((distanceScore * WEIGHTS.distance).toFixed(4));
    const timeComponent = Number((etaScore * WEIGHTS.delivery).toFixed(4));

    return {
      ...c,
      score: Number(combinedScore.toFixed(4)),
      scoreBreakdown: {
        priceComponent,
        distanceComponent,
        timeComponent,
        totalScore: Number(combinedScore.toFixed(4)),
        priceNormalized: Number(priceScore.toFixed(4)),
        distanceNormalized: Number(distanceScore.toFixed(4)),
        timeNormalized: Number(etaScore.toFixed(4))
      }
    };
  });

  scored.sort((a, b) => a.score - b.score);
  scored.forEach((c, i) => {
    c.isSmartestOption = i === 0;
  });

  const smartestPick = scored.length > 0 ? {
    ...scored[0],
    explanation: generateExplanation(scored[0], scored)
  } : null;

  return res.json({
    query,
    totalResults: scored.length,
    smartestPick,
    results: scored,
    categories: [...new Set(scored.map(s => s.category).filter(Boolean))],
    algorithm: {
      weights: { price: 0.4, distance: 0.3, deliveryTime: 0.3 },
      method: 'Multi-Criteria Decision Analysis (Normalized Weighted Sum)',
      note: 'Lower score = better option'
    },
    meta: {
      userLocation: { lat: parseFloat(lat), lng: parseFloat(lng) },
      timestamp: new Date().toISOString(),
      dataSource: isDBConnected() ? 'database' : 'in-memory-fallback'
    }
  });
});

export default router;
