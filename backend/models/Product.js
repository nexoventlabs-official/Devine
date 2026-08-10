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
    waveImageUrl: { type: String, default: '' }, // decorative bg for homepage featured card
    featured: { type: Boolean, default: false },
    gallery: [{ type: String }],
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    badges: [{ type: String }],
    inStock: { type: Boolean, default: true },
    active: { type: Boolean, default: true },

    // ---- Ratings (aggregated from customer reviews) ----
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    ratings: [
      {
        phone: String,
        orderId: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],

    // ---- Availability control ----
    // isPaused = manual "out of stock" toggle from admin (overrides inStock display)
    isPaused: { type: Boolean, default: false },
    // Legacy one-time auto-resume time (HH:mm)
    soldOutUntil: { type: String },
    // Recurring sold-out schedule (defines the AVAILABLE window; outside = sold out)
    soldOutSchedule: {
      enabled: { type: Boolean, default: false },
      type: { type: String, enum: ['daily', 'custom'], default: 'daily' },
      dailyStartTime: { type: String }, // HH:mm
      dailyEndTime: { type: String }, // HH:mm
      days: [
        {
          day: { type: String, enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
          enabled: { type: Boolean, default: false },
          startTime: String, // HH:mm
          endTime: String // HH:mm
        }
      ]
    }
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
