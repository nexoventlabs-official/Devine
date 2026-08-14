import mongoose from 'mongoose';

// B2B bulk/wholesale product ranges (name + MOQ text + 1:1 tile image).
// Shown as radio options with logos in the Choose Service -> Bulk flow.
const BulkRangeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },       // e.g. "Honey Range"
    moq: { type: String, default: '' },           // e.g. "MOQ 50/variant"
    slug: { type: String, index: true },
    imageUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

BulkRangeSchema.pre('save', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
  next();
});

export default mongoose.models.BulkRange || mongoose.model('BulkRange', BulkRangeSchema);
