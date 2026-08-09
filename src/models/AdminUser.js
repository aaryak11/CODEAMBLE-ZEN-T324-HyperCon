import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
  storeName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: "store_owner" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AdminUser", adminUserSchema);
