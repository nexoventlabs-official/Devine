import mongoose from 'mongoose';

// Products power the B2C catalog and B2B dealer pricing, and auto-push to WhatsApp templates.
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    retailerId: { type: String, unique: true, index: true }, // stable id for WA catalog
    category: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    shortDesc: { type: String, default: '' },
    price: { type: Number, required: true }, // MRP / B2C price
    mrp: { type: Number, default: 0 },
    dealerPrice: { type: Number, default: 0 },
    margin: { type: String, default: '' }, // e.g. "20-35%"
    moq: { type: String, default: '' },
    unit: { type: String, default: 'unit' },
    imageUrl: { type: String, default: '' },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    badges: [{ type: String }],
    inStock: { type: Boolean, default: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
