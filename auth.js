import { Router } from "express";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = Router();

// In-memory fallback users for instant execution mode
const memoryUsers = new Map();

// Helper to generate IDs
const genId = () => "usr_" + Math.random().toString(36).substring(2, 9);


// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if using Mongoose DB connection
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: password, // demo simple password
        selectedLocation: location || { label: "Dombivli East, Thane", lat: 19.2183, lng: 73.0864 },
      });

      return res.json({
        success: true,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          selectedLocation: newUser.selectedLocation,
          token: "jwt_mock_" + newUser._id,
        },
      });
    } else {
      // In-memory fallback
      if (memoryUsers.has(cleanEmail)) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const id = genId();
      const userObj = {
        id,
        name: name.trim(),
        email: cleanEmail,
        password: password,
        selectedLocation: location || { label: "Dombivli East, Thane", lat: 19.2183, lng: 73.0864 },
        token: "jwt_mock_" + id,
      };
      memoryUsers.set(cleanEmail, userObj);

      return res.json({
        success: true,
        user: {
          id: userObj.id,
          name: userObj.name,
          email: userObj.email,
          selectedLocation: userObj.selectedLocation,
          token: userObj.token,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          selectedLocation: user.selectedLocation,
          token: "jwt_mock_" + user._id,
        },
      });
    } else {
      const userObj = memoryUsers.get(cleanEmail);
      if (!userObj || userObj.password !== password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return res.json({
        success: true,
        user: {
          id: userObj.id,
          name: userObj.name,
          email: userObj.email,
          selectedLocation: userObj.selectedLocation,
          token: userObj.token,
        },
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/location
router.put("/location", async (req, res) => {
  try {
    const { userId, location } = req.body;
    if (!userId || !location) {
      return res.status(400).json({ error: "userId and location are required" });
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findByIdAndUpdate(userId, { selectedLocation: location }, { new: true });
      if (user) {
        return res.json({ success: true, selectedLocation: user.selectedLocation });
      }
    } else {
      // In memory fallback update
      for (const [email, userObj] of memoryUsers.entries()) {
        if (userObj.id === userId) {
          userObj.selectedLocation = location;
          return res.json({ success: true, selectedLocation: location });
        }
      }
    }

    res.json({ success: true, selectedLocation: location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
