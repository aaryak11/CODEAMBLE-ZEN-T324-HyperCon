import { Router } from "express";
import Store from "../models/Store.js";
import mongoose from "mongoose";
import { MEMORY_STORES } from "./stores.js";

const router = Router();

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

  res.json({ storeId: store._id, cameraStreamId: store.cameraStreamId, hlsUrl });
});

export default router;
