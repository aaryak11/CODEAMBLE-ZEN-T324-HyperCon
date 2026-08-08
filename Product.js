import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  unit: String, // e.g. "1kg", "500g", "dozen"
  imageUrl: String,
});

export default mongoose.model("Product", productSchema);
