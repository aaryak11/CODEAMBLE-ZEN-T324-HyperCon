import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import AdminUser from "../models/AdminUser.js";
import Store from "../models/Store.js";
import { MEMORY_STORES } from "./stores.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "hypercon_secret_jwt_store_owner_2026";

// In-memory admin users store for zero-config fallback
export const MEMORY_ADMIN_USERS = [
  {
    _id: "admin_user_001",
    storeId: "66b1a0000000000000000001",
    storeName: "Green Basket Fresh Organics",
    ownerName: "Rajesh Sharma",
    email: "owner@greenbasket.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    phone: "+91 98200 12345",
    role: "store_owner",
    createdAt: new Date("2026-01-01")
  }
];

// Helper to authenticate JWT token
export function authenticateAdminToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Store owner authentication token required." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== "store_owner") {
      return res.status(403).json({ error: "Invalid or expired store owner token." });
    }
    req.adminUser = decoded;
    next();
  });
}

// POST /api/admin/signup
router.post("/signup", async (req, res) => {
  try {
    const { storeName, ownerName, email, password, phone, location, address } = req.body;

    if (!storeName || !ownerName || !email || !password) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    const emailNormalized = email.trim().toLowerCase();
    const storeLat = location?.lat || 19.2183;
    const storeLng = location?.lng || 73.0867;
    const storeAddress = address || location?.address || "Dombivli East, Maharashtra";

    const passwordHash = await bcrypt.hash(password, 10);

    let storeId;
    let newStore;
    let newAdminUser;

    if (mongoose.connection.readyState === 1) {
      // Check existing email
      const existing = await AdminUser.findOne({ email: emailNormalized });
      if (existing) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      // Create new store
      const cameraStreamId = `store_${Date.now()}`;
      newStore = await Store.create({
        name: storeName,
        location: { lat: storeLat, lng: storeLng },
        address: storeAddress,
        cameraStreamId,
        contact: phone || "+91 98000 00000",
        rating: 4.8
      });

      storeId = newStore._id;

      // Create admin user
      newAdminUser = await AdminUser.create({
        storeId,
        storeName,
        ownerName,
        email: emailNormalized,
        passwordHash,
        phone,
        role: "store_owner"
      });
    } else {
      // Memory Store Fallback
      const existing = MEMORY_ADMIN_USERS.find((u) => u.email === emailNormalized);
      if (existing) {
        return res.status(400).json({ error: "An account with this email already exists." });
      }

      storeId = `store_${Date.now()}`;
      newStore = {
        _id: storeId,
        name: storeName,
        location: { lat: storeLat, lng: storeLng },
        address: storeAddress,
        cameraStreamId: `stream_${Date.now()}`,
        contact: phone || "+91 98000 00000",
        rating: 4.8,
        feedStatus: "active"
      };
      MEMORY_STORES.unshift(newStore);

      newAdminUser = {
        _id: `admin_${Date.now()}`,
        storeId,
        storeName,
        ownerName,
        email: emailNormalized,
        passwordHash,
        phone,
        role: "store_owner",
        createdAt: new Date()
      };
      MEMORY_ADMIN_USERS.push(newAdminUser);
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: newAdminUser._id,
        storeId: storeId,
        email: emailNormalized,
        ownerName,
        role: "store_owner"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Store owner account created successfully.",
      token,
      user: {
        id: newAdminUser._id,
        ownerName,
        storeName,
        email: emailNormalized,
        phone,
        role: "store_owner",
        storeId
      },
      store: newStore
    });
  } catch (err) {
    console.error("Admin signup error:", err);
    res.status(500).json({ error: "Failed to create store owner account." });
  }
});

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailNormalized = email.trim().toLowerCase();
    let adminUser = null;
    let store = null;

    if (mongoose.connection.readyState === 1) {
      adminUser = await AdminUser.findOne({ email: emailNormalized }).lean();
      if (adminUser) {
        store = await Store.findById(adminUser.storeId).lean();
      }
    } else {
      adminUser = MEMORY_ADMIN_USERS.find((u) => u.email === emailNormalized);
      if (adminUser) {
        store = MEMORY_STORES.find((s) => s._id.toString() === adminUser.storeId.toString()) || MEMORY_STORES[0];
      }
    }

    if (!adminUser) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        userId: adminUser._id,
        storeId: adminUser.storeId,
        email: adminUser.email,
        ownerName: adminUser.ownerName,
        role: "store_owner"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Store owner logged in successfully.",
      token,
      user: {
        id: adminUser._id,
        ownerName: adminUser.ownerName,
        storeName: adminUser.storeName,
        email: adminUser.email,
        phone: adminUser.phone,
        role: "store_owner",
        storeId: adminUser.storeId
      },
      store: store || {
        _id: adminUser.storeId,
        name: adminUser.storeName,
        address: "Dombivli, Maharashtra",
        feedStatus: "active"
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Authentication failed." });
  }
});

// GET /api/admin/me
router.get("/me", authenticateAdminToken, async (req, res) => {
  try {
    const { userId, storeId } = req.adminUser;
    let adminUser = null;
    let store = null;

    if (mongoose.connection.readyState === 1) {
      adminUser = await AdminUser.findById(userId).select("-passwordHash").lean();
      store = await Store.findById(storeId).lean();
    } else {
      adminUser = MEMORY_ADMIN_USERS.find((u) => u._id.toString() === userId.toString());
      store = MEMORY_STORES.find((s) => s._id.toString() === storeId.toString()) || MEMORY_STORES[0];
    }

    if (!adminUser) {
      return res.status(404).json({ error: "Store owner profile not found." });
    }

    res.json({
      user: {
        id: adminUser._id,
        ownerName: adminUser.ownerName,
        storeName: adminUser.storeName,
        email: adminUser.email,
        phone: adminUser.phone,
        role: "store_owner",
        storeId: adminUser.storeId
      },
      store: store || {
        _id: adminUser.storeId,
        name: adminUser.storeName,
        address: "Dombivli, Maharashtra",
        feedStatus: "active"
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch store owner profile." });
  }
});

export default router;
