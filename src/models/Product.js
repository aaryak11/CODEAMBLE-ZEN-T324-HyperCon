import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['vegetables', 'fruits', 'dairy', 'bakery', 'meat', 'seafood', 
           'flowers', 'staples', 'beverages']
  },
  unit: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  tags: [{ type: String }],
  isPerishable: { type: Boolean, default: true },
  avgShelfLife: { type: Number, default: 3 }
}, { timestamps: true });

ProductSchema.index({ name: 'text', tags: 'text' });

export default mongoose.model('Product', ProductSchema);
