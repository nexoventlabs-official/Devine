import mongoose from 'mongoose';

// A registered B2B dealer/distributor.
const DealerSchema = new mongoose.Schema(
  {
    dealerId: { type: String, unique: true, sparse: true, index: true }, // DVN-XXXX
    phone: { type: String, required: true, index: true },
    name: { type: String, default: '' },
    businessName: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    businessType: { type: String, default: '' }, // Retail Shop, Wholesale Distributor, etc.
    monthlyCapacity: { type: String, default: '' }, // range label
    status: { type: String, enum: ['lead', 'active', 'inactive'], default: 'lead' },
    areaManagerName: { type: String, default: '' },
    areaManagerNumber: { type: String, default: '' },
    lastOrderAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Dealer || mongoose.model('Dealer', DealerSchema);
