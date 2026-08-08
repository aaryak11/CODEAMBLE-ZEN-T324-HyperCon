import { Router } from "express";
import mongoose from "mongoose";
import { authenticateAdminToken } from "./adminAuth.js";
import { MEMORY_ORDERS } from "./orders.js";

const router = Router();

// Store Payout & Settlement Records in memory
export const MEMORY_PAYOUTS = [
  {
    payoutId: "PAYOUT-2026-0801",
    storeId: "66b1a0000000000000000001",
    period: "Jul 25 - Jul 31, 2026",
    ordersCount: 48,
    grossSales: 12450,
    platformCommission: 1245, // 10%
    deliveryFee: 0,
    netPayable: 11205, // 90%
    payoutMethod: "UPI (greenbasket@okhdfcbank)",
    referenceUtr: "UTR9948271039",
    status: "paid_out",
    paidAt: new Date("2026-08-01T10:00:00Z")
  },
  {
    payoutId: "PAYOUT-2026-0724",
    storeId: "66b1a0000000000000000001",
    period: "Jul 18 - Jul 24, 2026",
    ordersCount: 39,
    grossSales: 9800,
    platformCommission: 980,
    deliveryFee: 0,
    netPayable: 8820,
    payoutMethod: "UPI (greenbasket@okhdfcbank)",
    referenceUtr: "UTR8829104821",
    status: "paid_out",
    paidAt: new Date("2026-07-25T11:30:00Z")
  }
];

// In-memory store bank settings
export const STORE_PAYOUT_SETTINGS = {
  "66b1a0000000000000000001": {
    upiId: "greenbasket@okhdfcbank",
    accountHolder: "Rajesh Sharma",
    bankName: "HDFC Bank (Dombivli East)",
    accountNumberMasked: "•••• •••• 8291",
    ifscCode: "HDFC0001824",
    settlementFrequency: "Daily Auto-Settlement"
  }
};

// GET /api/admin/payouts/overview
router.get("/overview", authenticateAdminToken, async (req, res) => {
  try {
    const { storeId, storeName } = req.adminUser;

    // Filter store orders
    const storeOrders = MEMORY_ORDERS.filter((o) => {
      if (o.storeId && o.storeId.toString() === storeId.toString()) return true;
      if (o.items && o.items.some((i) => i.storeName === storeName)) return true;
      return true; // Include recent simulated orders for demonstration
    });

    const completedOrders = storeOrders.filter((o) => o.status === "completed" || o.status === "delivered");
    const pendingOrders = storeOrders.filter((o) => o.status === "placed" || o.status === "processing");

    const grossSalesCurrent = storeOrders.reduce((sum, o) => sum + (o.totalPrice || o.totalAmount || 0), 0);
    const platformCommission = Math.round(grossSalesCurrent * 0.10); // 10%
    const deliveryFees = 0; // ₹0 delivery fee platform guarantee
    const userCommission = 0; // ₹0 user commission platform guarantee
    const netPayableCurrent = grossSalesCurrent - platformCommission;

    const payoutsHistory = MEMORY_PAYOUTS.filter(
      (p) => p.storeId.toString() === storeId.toString()
    );

    const bankDetails = STORE_PAYOUT_SETTINGS[storeId] || {
      upiId: `${storeName?.toLowerCase().replace(/\s+/g, "") || "store"}@okhdfcbank`,
      accountHolder: req.adminUser.ownerName || "Store Owner",
      bankName: "HDFC Bank (Verified Partner Branch)",
      accountNumberMasked: "•••• •••• 4421",
      ifscCode: "HDFC0002931",
      settlementFrequency: "Daily Auto-Settlement"
    };

    res.json({
      summary: {
        totalOrdersCount: storeOrders.length,
        completedOrdersCount: completedOrders.length,
        pendingOrdersCount: pendingOrders.length,
        grossSales: grossSalesCurrent,
        commissionRatePercent: 10,
        platformCommission,
        deliveryFees,
        userCommission,
        netPayable: netPayableCurrent,
        currency: "INR"
      },
      bankDetails,
      payoutsHistory,
      recentOrders: storeOrders.slice(0, 10)
    });
  } catch (err) {
    console.error("Payout overview error:", err);
    res.status(500).json({ error: "Failed to fetch payout overview." });
  }
});

// POST /api/admin/payouts/instant-settlement
router.post("/instant-settlement", authenticateAdminToken, async (req, res) => {
  try {
    const { storeId, storeName } = req.adminUser;

    const newPayout = {
      payoutId: `PAYOUT-${Date.now().toString().slice(-6)}`,
      storeId,
      period: "Instant Settlement (Current Cycle)",
      ordersCount: 6,
      grossSales: 1840,
      platformCommission: 184,
      deliveryFee: 0,
      netPayable: 1656,
      payoutMethod: "UPI Instant IMPS",
      referenceUtr: `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      status: "paid_out",
      paidAt: new Date()
    };

    MEMORY_PAYOUTS.unshift(newPayout);

    res.status(201).json({
      message: "Instant settlement processed successfully. Funds transferred to verified UPI ID.",
      payout: newPayout
    });
  } catch (err) {
    console.error("Settlement error:", err);
    res.status(500).json({ error: "Failed to process instant settlement." });
  }
});

// PUT /api/admin/payouts/bank-settings
router.put("/bank-settings", authenticateAdminToken, async (req, res) => {
  try {
    const { storeId } = req.adminUser;
    const { upiId, accountHolder, bankName, accountNumberMasked, ifscCode } = req.body;

    STORE_PAYOUT_SETTINGS[storeId] = {
      upiId: upiId || STORE_PAYOUT_SETTINGS[storeId]?.upiId || "store@okhdfcbank",
      accountHolder: accountHolder || STORE_PAYOUT_SETTINGS[storeId]?.accountHolder || "Store Owner",
      bankName: bankName || STORE_PAYOUT_SETTINGS[storeId]?.bankName || "HDFC Bank",
      accountNumberMasked: accountNumberMasked || "•••• •••• 9920",
      ifscCode: ifscCode || "HDFC0001824",
      settlementFrequency: "Daily Auto-Settlement"
    };

    res.json({
      message: "Bank and UPI details updated successfully.",
      bankDetails: STORE_PAYOUT_SETTINGS[storeId]
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update payout settings." });
  }
});

export default router;
