import mongoose from 'mongoose';

// B2B + B2C leads: dealer, bulk, corporate gifting, export, support callbacks.
const LeadSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ['b2b', 'b2c'], required: true, index: true },
    type: {
      type: String,
      enum: ['dealer', 'bulk', 'gifting', 'export', 'export_enquiry', 'support', 'review_issue'],
      required: true,
      index: true
    },
    name: { type: String, default: '' },
    phone: { type: String, required: true, index: true },
    email: { type: String, default: '' },
    businessName: { type: String, default: '' },
    businessType: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    capacity: { type: String, default: '' },
    // Flexible payload for flow-specific fields (products, quantity, budget, IEC, docs, etc.)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Closed'], default: 'New', index: true },
    seen: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
