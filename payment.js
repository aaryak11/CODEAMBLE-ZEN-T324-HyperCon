import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    return null;
  }
  return new Razorpay({ key_id, key_secret });
};

router.get("/key", (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  if (!keyId) {
    return res.status(404).json({
      success: false,
      message: "Razorpay Key ID not configured in server .env",
    });
  }
  res.json({
    success: true,
    key: keyId,
  });
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) missing in server environment.",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `hypercon_${Date.now()}`,
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: error?.error?.description || error?.message || "Unable to create Razorpay order",
    });
  }
});

router.post("/verify", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required Razorpay payment verification parameters",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "RAZORPAY_KEY_SECRET not set in server environment",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Payment verification failed: Invalid signature",
    });
  } catch (error) {
    console.error("Verification error:", error);

    res.status(500).json({
      success: false,
      message: error?.message || "Payment verification error",
    });
  }
});

export default router;