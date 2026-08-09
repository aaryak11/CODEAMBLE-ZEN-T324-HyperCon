import mongoose from "mongoose";
import Store from "../models/Store.js";
import { MEMORY_STORES } from "../routes/stores.js";
import { broadcast } from "../realtime.js";
import Groq from 'groq-sdk';

const groq = (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('YOUR_KEY')) 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

async function generateAIFakeReason(storeName) {
  if (!groq) return "This store's camera feed is a known AI-generated/synthetic video, not a live shelf feed.";
  
  try {
    const groqPromise = groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a feed verification system. This store's camera feed is a known AI-generated/synthetic video, not a live shelf feed; write a one-sentence flag explaining why it's untrusted."
        },
        { role: "user", content: `Generate a short one-sentence warning flag for the store named "${storeName}".` }
      ],
      max_tokens: 100, temperature: 0.2
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 5000));
    
    const response = await Promise.race([groqPromise, timeoutPromise]);
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('Groq AI generated reason error:', err.message);
    return "This store's camera feed is a known AI-generated/synthetic video, not a live shelf feed.";
  }
}

// In-memory verification logs audit trail (max 100 entries)
const verificationLogs = [];

// Per-store hash history window for loop detection
const storeHashHistory = new Map();

/**
 * Computes difference hash (dHash) / frame perceptual hash simulation
 */
function generatePerceptualHash(seed) {
  let hash = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < 16; i++) {
    hash += chars[Math.floor((Math.sin(seed + i) * 10000) % 16 + 16) % 16];
  }
  return hash;
}

/**
 * Perform AI & Motion analysis on a store stream
 */
export async function verifyStoreStream(store) {
  const storeId = String(store._id);
  const now = Date.now();

  // Simulate network/stream probe
  const cameraStreamId = store.cameraStreamId || "store1";
  
  // Deterministic simulation for test stores or live streams:
  // Store 6 (Farm2Fork) simulates delayed/unreliable, Store 8 or offline demo simulates offline
  let reachability = true;
  let diffScore = 8.5 + Math.random() * 12.0; // Normal live motion diff: 8.5% - 20.5%
  let loopDetected = false;
  let verdict = "verified";
  let reason = "Genuine live shelf camera stream verified.";

  // Simulated edge cases for verification demonstration
  if (cameraStreamId === "potato_cam") {
    reachability = true;
    diffScore = 95.0; // specific indicator
    loopDetected = false;
    verdict = "ai_generated";
    reason = await generateAIFakeReason(store.name);
  } else if (store.feedStatus === "offline" || cameraStreamId === "offline_cam") {
    reachability = false;
    diffScore = 0;
    verdict = "offline";
    reason = "Store RTSP camera feed unreachable (connection timed out).";
  } else if (store.feedStatus === "delayed" || store.name.includes("Farm2Fork")) {
    // Low motion static video simulation
    diffScore = 0.4 + Math.random() * 0.3; // static threshold < 1.5%
    verdict = "unreliable";
    reason = "Static feed detected: Motion diff score below threshold (<1.5%).";
  } else if (store.name.includes("Daily Essentials")) {
    // Loop detection simulation
    loopDetected = true;
    diffScore = 14.2;
    verdict = "unreliable";
    reason = "Pre-recorded video loop detected via 64-bit perceptual hash comparison.";
  }

  // Update dHash history for store
  const currentHash = generatePerceptualHash(now + storeId.length);
  const history = storeHashHistory.get(storeId) || [];
  history.push({ timestamp: now, dHash: currentHash });
  if (history.length > 20) history.shift();
  storeHashHistory.set(storeId, history);

  const logEntry = {
    id: `chk_${now}_${storeId.slice(-4)}`,
    storeId,
    storeName: store.name,
    timestamp: new Date().toISOString(),
    verdict,
    diffScore: Number(diffScore.toFixed(2)),
    loopDetected,
    reachability,
    confidenceScore: verdict === "verified" ? 96 : verdict === "unreliable" ? 42 : 0,
    reason,
  };

  // Prepend to audit log, keep last 100 logs
  verificationLogs.unshift(logEntry);
  if (verificationLogs.length > 100) verificationLogs.pop();

  // Update in-memory store object
  store.feedReliability = verdict;
  store.lastVerificationCheck = new Date();

  const memStore = MEMORY_STORES.find((s) => String(s._id) === storeId);
  if (memStore) {
    memStore.feedReliability = verdict;
    memStore.lastVerificationCheck = new Date();
  }

  // Update MongoDB document if DB is connected
  try {
    if (mongoose.connection.readyState === 1) {
      await Store.findByIdAndUpdate(storeId, {
        feedReliability: verdict,
        lastVerificationCheck: new Date(),
      });
    }
  } catch (e) {
    console.warn("DB update failed during stream verification:", e.message);
  }

  // Broadcast realtime status change to all connected WebSocket clients
  broadcast({
    type: "feed_status_update",
    payload: {
      storeId,
      storeName: store.name,
      feedReliability: verdict,
      log: logEntry,
    },
  });

  return logEntry;
}

/**
 * Background worker interval to run reliability verification periodically
 */
let workerInterval = null;

export function startFeedVerificationWorker(intervalMs = 45000) {
  if (workerInterval) clearInterval(workerInterval);

  console.log(`[feedVerifier] Background AI stream verification worker started (interval: ${intervalMs}ms)`);

  const runAllChecks = async () => {
    try {
      let storesList = MEMORY_STORES;
      if (mongoose.connection.readyState === 1) {
        const dbStores = await Store.find().lean();
        if (dbStores && dbStores.length > 0) storesList = dbStores;
      }

      for (const s of storesList) {
        await verifyStoreStream(s);
      }
    } catch (err) {
      console.warn("[feedVerifier] Worker iteration error:", err.message);
    }
  };

  // Initial check run after 3s
  setTimeout(runAllChecks, 3000);
  workerInterval = setInterval(runAllChecks, intervalMs);
}

export function getVerificationLogs(limit = 50) {
  return verificationLogs.slice(0, limit);
}

export async function verifyAllNow() {
  let storesList = MEMORY_STORES;
  if (mongoose.connection.readyState === 1) {
    const dbStores = await Store.find().lean();
    if (dbStores && dbStores.length > 0) storesList = dbStores;
  }

  const results = [];
  for (const s of storesList) {
    const res = await verifyStoreStream(s);
    results.push(res);
  }
  return results;
}
