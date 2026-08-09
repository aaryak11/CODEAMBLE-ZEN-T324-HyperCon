import mongoose from 'mongoose';

const MockExternalPriceSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  source: { 
    type: String, 
    required: true,
    enum: ['Amazon Fresh', 'Blinkit', 'Zepto', 'BigBasket', 'JioMart', 'Smartprix']
  },
  price: { type: Number, required: true },
  deliveryEtaMinutes: { type: Number, required: true },
  inStock: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('MockExternalPrice', MockExternalPriceSchema);
