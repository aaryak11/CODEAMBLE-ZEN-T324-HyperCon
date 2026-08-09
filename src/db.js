import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  
  if (!uri || uri.includes('PLACEHOLDER') || uri.includes('xxxxx')) {
    console.warn('⚠️  No valid MongoDB URI. Running in MEMORY-ONLY mode.');
    console.warn('⚠️  All routes will use in-memory fallbacks. Demo-safe.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Falling back to in-memory data.');
      isConnected = false;
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
      isConnected = false;
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.warn('⚠️  Continuing with in-memory fallback data.');
    isConnected = false;
  }
};

export const isDBConnected = () => mongoose.connection.readyState === 1;
