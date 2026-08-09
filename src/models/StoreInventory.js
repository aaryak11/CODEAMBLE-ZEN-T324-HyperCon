import mongoose from 'mongoose';

const StoreInventorySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  stockStatus: { 
    type: String, 
    enum: ['in_stock', 'low_stock', 'out_of_stock'], 
    default: 'in_stock' 
  },
  shelfLocation: { type: String, default: '' },
  lastRestocked: { type: Date, default: Date.now },
  freshnessBadge: { type: String, default: '' },
  batchDate: { type: Date }
}, { timestamps: true });

StoreInventorySchema.index({ storeId: 1, productId: 1 }, { unique: true });

export default mongoose.model('StoreInventory', StoreInventorySchema);
