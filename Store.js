import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  address: String,
  cameraStreamId: { type: String, required: true }, // maps to a MediaMTX path, e.g. "store1"
  contact: String,
  rating: { type: Number, default: 4.5 },
  feedReliability: {
    type: String,
    enum: ["verified", "unreliable", "offline"],
    default: "verified",
  },
  lastVerificationCheck: Date,
});

export default mongoose.model("Store", storeSchema);
