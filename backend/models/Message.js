import mongoose from 'mongoose';

// CRM chat log — every inbound/outbound WhatsApp message, per channel + phone.
const MessageSchema = new mongoose.Schema(
  {
    channel: { type: String, enum: ['b2b', 'b2c'], required: true, index: true },
    phone: { type: String, required: true, index: true },
    name: { type: String, default: '' },
    direction: { type: String, enum: ['in', 'out'], required: true },
    type: { type: String, default: 'text' }, // text, interactive, image, document, template, flow, location
    body: { type: String, default: '' },
    raw: { type: mongoose.Schema.Types.Mixed },
    metaMessageId: { type: String, index: true },
    status: { type: String, default: 'sent' } // sent, delivered, read, failed
  },
  { timestamps: true }
);

MessageSchema.index({ channel: 1, phone: 1, createdAt: -1 });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
