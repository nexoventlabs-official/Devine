import mongoose from 'mongoose';

// Tracks each WhatsApp user's conversation state per channel (b2b/b2c).
const ConversationSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    channel: { type: String, enum: ['b2b', 'b2c'], required: true, index: true },
    name: { type: String, default: '' },
    // Current step in the state machine, e.g. 'welcome', 'awaiting_service', 'dealer_flow'
    step: { type: String, default: 'new' },
    // Free-form bag for flow data collected across screens
    context: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastInboundAt: { type: Date, default: Date.now },
    lastOutboundAt: { type: Date }
  },
  { timestamps: true }
);

ConversationSchema.index({ phone: 1, channel: 1 }, { unique: true });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
