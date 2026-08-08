import mongoose from "mongoose";

const mockExternalPriceSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  source: { type: String, enum: ["Amazon", "Flipkart", "Smartprix"], required: true },
  price: { type: Number, required: true },
  deliveryEtaMinutes: { type: Number, required: true },
});

export default mongoose.model("MockExternalPrice", mockExternalPriceSchema);
