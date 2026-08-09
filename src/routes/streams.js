import { Router } from "express";
import Store from "../models/Store.js";
import mongoose from "mongoose";
import { MEMORY_STORES } from "./stores.js";
import { getVerificationLogs, verifyAllNow, verifyStoreStream } from "../services/feedVerifier.js";

const router = Router();

// GET /api/streams/health - Audit log of feed verification checks
router.get("/health", async (req, res) => {
  const logs = getVerificationLogs(100);
  let storesList = MEMORY_STORES;

  try {
    if (mongoose.connection.readyState === 1) {
      const dbStores = await Store.find().lean();
      if (dbStores && dbStores.length > 0) storesList = dbStores;
    }
  } catch (e) {}

  const summary = {
    totalStores: storesList.length,
    verifiedCount: storesList.filter((s) => (s.feedReliability || "verified") === "verified").length,
    unreliableCount: storesList.filter((s) => s.feedReliability === "unreliable").length,
    offlineCount: storesList.filter((s) => s.feedReliability === "offline").length,
    logs,
  };

  res.json(summary);
});

// POST /api/streams/verify-now - Manually trigger AI feed verification sweep
router.post("/verify-now", async (req, res) => {
  try {
    const results = await verifyAllNow();
    res.json({ success: true, count: results.length, logs: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/streams/:storeId - Get stream details for a store
router.get("/:storeId", async (req, res) => {
  let store = null;
  try {
    if (mongoose.connection.readyState === 1) {
      store = await Store.findById(req.params.storeId).lean();
    }
  } catch (e) {}

  if (!store) {
    store = MEMORY_STORES.find((s) => s._id === req.params.storeId) || MEMORY_STORES[0];
  }

  const base = process.env.MEDIAMTX_HLS_BASE || "http://localhost:8888";
  const hlsUrl = `${base}/${store.cameraStreamId}/index.m3u8`;

  res.json({
    storeId: store._id,
    cameraStreamId: store.cameraStreamId,
    feedReliability: store.feedReliability || "verified",
    hlsUrl,
  });
});

export default router;
