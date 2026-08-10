import mongoose from 'mongoose';

// Admin-managed assets used inside WhatsApp flows/messages:
// welcome banners, service icons, PDFs, review links, etc.
const FlowImageSchema = new mongoose.Schema(
  {
    // Stable key referenced in code, e.g. 'b2b_welcome_banner', 'dealer_pdf',
    // 'b2c_welcome_banner', 'google_review_url', 'payment_method_banner'
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, default: '' },
    channel: { type: String, enum: ['b2b', 'b2c', 'both'], default: 'both' },
    type: { type: String, enum: ['image', 'pdf', 'url'], default: 'image' },
    url: { type: String, default: '' },
    // For pdf documents shown as header attachment
    filename: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.FlowImage || mongoose.model('FlowImage', FlowImageSchema);
