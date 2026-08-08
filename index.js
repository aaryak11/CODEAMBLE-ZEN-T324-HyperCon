import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { connectDB } from "./db.js";
import Store from "./models/Store.js";
import Product from "./models/Product.js";
import StoreInventory from "./models/StoreInventory.js";
import MockExternalPrice from "./models/MockExternalPrice.js";

import http from "http";
import productsRouter from "./routes/products.js";
import storesRouter from "./routes/stores.js";
import searchRouter from "./routes/search.js";
import streamsRouter from "./routes/streams.js";
import cartRouter from "./routes/cart.js";
import authRouter from "./routes/auth.js";
import ordersRouter from "./routes/orders.js";
import adminAuthRouter from "./routes/adminAuth.js";
import adminInventoryRouter from "./routes/adminInventory.js";
import adminPayoutsRouter from "./routes/adminPayouts.js";
import supportRouter from "./routes/support.js";
import { initRealtime } from "./realtime.js";
import { startFeedVerificationWorker } from "./services/feedVerifier.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, status: "healthy", timestamp: new Date() }));

// Customer Routes
app.use("/api/auth", authRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/products", productsRouter);
app.use("/api/stores", storesRouter);
app.use("/api/search", searchRouter);
app.use("/api/streams", streamsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/support", supportRouter);

// Store Owner Admin Routes
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/inventory", adminInventoryRouter);
app.use("/api/admin/payouts", adminPayoutsRouter);

const server = http.createServer(app);
initRealtime(server);

const PORT = process.env.PORT || 4000;

async function autoSeedIfEmpty() {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const storeCount = await Store.countDocuments();
    if (storeCount === 0) {
      console.log("[server] Database is empty. Seeding initial stores & products...");
      const store1 = await Store.create({
        name: "Fresh Mart - Dombivli East",
        location: { lat: 19.2183, lng: 73.0864 },
        address: "Station Road, Dombivli East, Thane",
        cameraStreamId: "store1",
        contact: "+91-9820198201",
        rating: 4.8,
      });

      const store2 = await Store.create({
        name: "Green Basket - Kalyan West",
        location: { lat: 19.2403, lng: 73.1305 },
        address: "Shivaji Chowk, Kalyan West, Thane",
        cameraStreamId: "store2",
        contact: "+91-9833498334",
        rating: 4.5,
      });

      const store3 = await Store.create({
        name: "Nature's Harvest - Thane Central",
        location: { lat: 19.1970, lng: 72.9730 },
        address: "Viviana Mall Circle, Thane West",
        cameraStreamId: "store1",
        contact: "+91-9877198771",
        rating: 4.9,
      });

      const tomato = await Product.create({
        name: "Tomato",
        category: "Vegetables",
        unit: "1kg",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80",
      });

      const banana = await Product.create({
        name: "Banana",
        category: "Fruits",
        unit: "1 dozen",
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80",
      });

      const milk = await Product.create({
        name: "Farm Fresh Milk",
        category: "Dairy",
        unit: "1 Litre",
        imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80",
      });

      const apple = await Product.create({
        name: "Royal Gala Apples",
        category: "Fruits",
        unit: "1kg",
        imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80",
      });

      const potato = await Product.create({
        name: "Organic Potato",
        category: "Vegetables",
        unit: "1kg",
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80",
      });

      await StoreInventory.insertMany([
        { storeId: store1._id, productId: tomato._id, price: 38, stockStatus: "in_stock" },
        { storeId: store2._id, productId: tomato._id, price: 34, stockStatus: "in_stock" },
        { storeId: store3._id, productId: tomato._id, price: 36, stockStatus: "in_stock" },

        { storeId: store1._id, productId: banana._id, price: 55, stockStatus: "in_stock" },
        { storeId: store2._id, productId: banana._id, price: 60, stockStatus: "low_stock" },
        { storeId: store3._id, productId: banana._id, price: 52, stockStatus: "in_stock" },

        { storeId: store1._id, productId: milk._id, price: 66, stockStatus: "in_stock" },
        { storeId: store2._id, productId: milk._id, price: 68, stockStatus: "in_stock" },
        { storeId: store3._id, productId: milk._id, price: 64, stockStatus: "in_stock" },

        { storeId: store1._id, productId: apple._id, price: 160, stockStatus: "in_stock" },
        { storeId: store2._id, productId: apple._id, price: 145, stockStatus: "in_stock" },

        { storeId: store1._id, productId: potato._id, price: 28, stockStatus: "in_stock" },
        { storeId: store2._id, productId: potato._id, price: 25, stockStatus: "in_stock" },
      ]);

      await MockExternalPrice.insertMany([
        { productId: tomato._id, source: "Amazon Fresh", price: 45, deliveryEtaMinutes: 120 },
        { productId: tomato._id, source: "Blinkit", price: 42, deliveryEtaMinutes: 15 },
        { productId: tomato._id, source: "Smartprix", price: 40, deliveryEtaMinutes: 90 },

        { productId: banana._id, source: "Zepto", price: 65, deliveryEtaMinutes: 10 },
        { productId: banana._id, source: "Amazon Fresh", price: 62, deliveryEtaMinutes: 120 },

        { productId: milk._id, source: "BigBasket", price: 70, deliveryEtaMinutes: 45 },
        { productId: milk._id, source: "Blinkit", price: 67, deliveryEtaMinutes: 15 },

        { productId: apple._id, source: "Amazon Fresh", price: 180, deliveryEtaMinutes: 120 },
        { productId: apple._id, source: "Smartprix", price: 150, deliveryEtaMinutes: 90 },
      ]);

      console.log("[server] Auto-seeding completed.");
    }
  } catch (e) {
    console.warn("[server] Auto-seed skipped:", e.message);
  }
}

connectDB()
  .then(async () => {
    await autoSeedIfEmpty();
    server.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT} with WebSockets enabled on /ws`);
      startFeedVerificationWorker(30000);
    });
  })
  .catch((err) => {
    console.error("[server] failed to start server:", err.message);
    process.exit(1);
  });
