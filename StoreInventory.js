import mongoose from "mongoose";

const storeInventorySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  price: { type: Number, required: true },
  stockStatus: { type: String, enum: ["in_stock", "low_stock", "out_of_stock"], default: "in_stock" },
  lastUpdated: { type: Date, default: Date.now },
});

export default mongoose.model("StoreInventory", storeInventorySchema);
