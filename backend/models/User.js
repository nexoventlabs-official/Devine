import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Home' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsappPhone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, required: true },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    whatsappPhone: { type: String, default: '', index: true },
    email: { type: String, default: '', lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    addresses: [AddressSchema],
    wishlist: [{ type: String }],
    status: { type: String, default: 'active' }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
