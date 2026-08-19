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
    quantity: { type: Number, default: 0 }, // pack size for single-size products (e.g. 20 sticks)
    // Per-product delivery/shipping charge (₹). 0 = free delivery for this item.
    deliveryCharge: { type: Number, default: 0 },
    // ---- Size/quantity variants (e.g. 250g, 500g, 1kg) each with its own price ----
    variants: [
      {
        label: { type: String, default: '' }, // display label e.g. "500 g" (auto-built if empty)
        quantity: { type: Number, default: 0 }, // numeric size e.g. 500
        unit: { type: String, default: 'g' }, // g | kg | ml | litre | piece | pack | ...
        price: { type: Number, default: 0 }, // B2C price for this size
        mrp: { type: Number, default: 0 },
        dealerPrice: { type: Number, default: 0 },
        imageUrl: { type: String, default: '' }, // per-size MAIN image
        images: [{ type: String }] // per-size ADDITIONAL images
      }
    ],
    imageUrl: { type: String, default: '' }, // main product image
    coverImageUrl: { type: String, default: '' }, // hero/cover image (detail page + carousel first)
    videoUrl: { type: String, default: '' }, // product video (Cloudinary)
    waveImageUrl: { type: String, default: '' }, // decorative bg for homepage featured card
    featured: { type: Boolean, default: false },
    gallery: [{ type: String }], // additional product images
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    badges: [{ type: String }],
    inStock: { type: Boolean, default: true },
    active: { type: Boolean, default: true },

    // Retailer IDs last pushed to the Meta catalog (base or per-variant), used to
    // clean up stale items when variants change.
    catalogItemIds: [{ type: String }],

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
