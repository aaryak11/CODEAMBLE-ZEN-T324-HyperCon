import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: { type: String, required: true },
  phone: { type: String, default: '' },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  trustScore: {
    overall: { type: Number, default: 4.0 },
    freshness: { type: Number, default: 4.0 },
    deliveryAccuracy: { type: Number, default: 4.0 },
    priceConsistency: { type: Number, default: 4.0 },
    cameraUptime: { type: Number, default: 80 }
  },
  cameraStreamId: { type: String, default: '' },
  cameraFeedUrl: { type: String, default: '' },
  cameraStatus: { 
    type: String, 
    enum: ['live', 'offline', 'unreliable'], 
    default: 'live' 
  },
  feedReliability: { 
    type: String, 
    enum: ['verified', 'unreliable', 'offline'], 
    default: 'verified' 
  },
  operatingHours: {
    open: { type: String, default: '07:00' },
    close: { type: String, default: '22:00' }
  },
  avgDeliveryTime: { type: Number, default: 25 },
  deliveryRadius: { type: Number, default: 5 },
  description: { type: String, default: '' },
  specialties: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('Store', StoreSchema);
