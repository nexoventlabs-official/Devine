import mongoose from 'mongoose';

// CRM-managed message templates + trigger sequences (welcome, weekly, restock, festival, launch).
const TemplateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true }, // dealer_welcome_1, weekly_broadcast, restock_alert, etc.
    title: { type: String, required: true },
    channel: { type: String, enum: ['b2b', 'b2c', 'both'], default: 'b2b' },
    category: { type: String, default: 'MARKETING' },
    // Rendering: body may contain [Name], [City] style tokens replaced at send time.
    body: { type: String, default: '' },
    headerType: { type: String, enum: ['none', 'image', 'document'], default: 'none' },
    headerUrl: { type: String, default: '' },
    buttons: [
      {
        kind: { type: String, enum: ['reply', 'url'], default: 'reply' },
        text: String,
        payload: String, // reply id or url
        _id: false
      }
    ],
    // Optional Meta approved template name (for out-of-24h sends)
    metaTemplateName: { type: String, default: '' },
    metaStatus: { type: String, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);
