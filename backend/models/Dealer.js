import mongoose from 'mongoose';

// A registered B2B dealer/distributor.
const DealerSchema = new mongoose.Schema(
  {
    dealerId: { type: String, unique: true, index: true }, // DVN-XXXX
    phone: { type: String, required: true, index: true },
    name: { type: String, default: '' },
    businessName: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    businessType: { type: String, default: '' },
    monthlyCapacity: { type: String, default: '' },
    status: { type: String, enum: ['lead', 'approved', 'rejected'], default: 'lead', index: true },
    areaManagerName: { type: String, default: '' },
    areaManagerPhone: { type: String, default: '' },
    lastOrderAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Dealer || mongoose.model('Dealer', DealerSchema);
