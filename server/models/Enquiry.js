import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true
    },
    productInquired: {
      type: String,
      required: [true, 'Product inquired is required'],
      trim: true
    },
    inquiryType: {
      type: String,
      default: 'Product Inquiry & Pricing',
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Contacted', 'Completed'],
      default: 'Pending'
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find duplicate enquiries by phone + product
enquirySchema.index({ phone: 1, productInquired: 1 });

const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;
