import mongoose from 'mongoose';

// B2C browse categories (name + tile image), uploaded alongside products.
const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, index: true },
    imageUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CategorySchema.pre('save', function (next) {
  if (!this.slug && this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  next();
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
