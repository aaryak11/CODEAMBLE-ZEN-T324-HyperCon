import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  guestName: { type: String, default: "Guest Shopper" },
  items: [
    {
      storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productName: { type: String, required: true },
      storeName: { type: String, required: true },
      price: { type: Number, required: true },
      unit: { type: String, default: "1kg" },
      quantity: { type: Number, default: 1 },
      imageUrl: { type: String, default: "" },
      hasLiveVerification: { type: Boolean, default: false },
    },
  ],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },       // ₹0 delivery fee for user
  userCommission: { type: Number, default: 0 },    // ₹0 user platform markup
  storeCommissionPercent: { type: Number, default: 10 }, // 10% store owner commission
  storeEarnings: { type: Number, required: true },  // subtotal * 0.90
  total: { type: Number, required: true },          // subtotal
  location: {
    label: { type: String, default: "Dombivli East" },
    lat: { type: Number, default: 19.2183 },
    lng: { type: Number, default: 73.0864 },
  },
  orderTime: { type: String, default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  estimatedDelivery: { type: String, default: "15 - 25 Mins" },
  status: { type: String, default: "Confirmed & Dispatched" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
