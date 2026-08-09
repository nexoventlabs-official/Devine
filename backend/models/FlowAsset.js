import mongoose from 'mongoose';

// Admin "Flow Images" page: icons, header images, welcome banners, PDFs, and links
// used across the WhatsApp flows. Looked up by stable `key`.
const FlowAssetSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true }, // e.g. welcome_banner_b2b, dealer_pdf, google_review_link
    label: { type: String, default: '' },
    type: { type: String, enum: ['image', 'pdf', 'link'], default: 'image' },
    url: { type: String, default: '' },
    group: { type: String, default: 'general' } // b2b, b2c, general
  },
  { timestamps: true }
);

export default mongoose.models.FlowAsset || mongoose.model('FlowAsset', FlowAssetSchema);
