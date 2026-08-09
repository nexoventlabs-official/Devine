import mongoose from 'mongoose';

// Approved/authorised dealers. Drives "Already a Dealer - Profile" service.
const DealerProfileSchema = new mongoose.Schema(
  {
    dealerId: { type: String, unique: true, index: true }, // DVN-XXXX
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    businessName: { type: String, default: '' },
    businessType: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    capacity: { type: String, default: '' },
    areaManagerName: { type: String, default: '' },
    areaManagerPhone: { type: String, default: '' },
    lastOrderAt: { type: Date },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  { timestamps: true }
);

export default mongoose.models.DealerProfile || mongoose.model('DealerProfile', DealerProfileSchema);
