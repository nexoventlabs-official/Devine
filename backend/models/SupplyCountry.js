import mongoose from 'mongoose';

// Export / International supply countries (1:1 logo + name), managed from admin.
const SupplyCountrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    logoUrl: { type: String, default: '' }, // 1:1 ratio
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.SupplyCountry || mongoose.model('SupplyCountry', SupplyCountrySchema);
