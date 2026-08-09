import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
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
      hasLiveVerification: { type: Boolean, default: false }
    },
  ],
});

export default mongoose.model("Cart", cartSchema);
