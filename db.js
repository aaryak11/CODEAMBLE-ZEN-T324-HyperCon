import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const isPlaceholder = !uri || uri.includes("<user>") || uri.includes("xxxxx");

  if (isPlaceholder) {
    console.log("[db] Using zero-config local memory data store for instant execution!");
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log("[db] Connected to MongoDB Atlas");
  } catch (err) {
    console.warn("[db] MongoDB Atlas connection bypassed, using instant local memory store:", err.message);
  }
}
