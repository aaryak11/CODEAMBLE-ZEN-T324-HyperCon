import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  selectedLocation: {
    label: { type: String, default: "Dombivli East, Thane" },
    lat: { type: Number, default: 19.2183 },
    lng: { type: Number, default: 73.0864 },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
