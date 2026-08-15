import mongoose from 'mongoose';

// Admin-created offers: apply a discount to selected products for B2C and/or B2B.
// The discounted price shows as the current price with the original struck through.
const OfferSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    active: { type: Boolean, default: true },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    b2c: {
      enabled: { type: Boolean, default: true },
      type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
      value: { type: Number, default: 0 }
    },
    b2b: {
      enabled: { type: Boolean, default: false },
      type: { type: String, enum: ['percent', 'flat'], default: 'percent' },
      value: { type: Number, default: 0 }
    },
    startsAt: { type: Date },
    endsAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
