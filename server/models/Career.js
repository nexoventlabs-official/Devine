import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema(
  {
    fullName: {
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
    roleApplied: {
      type: String,
      required: [true, 'Role applied for is required'],
      trim: true
    },
    experience: {
      type: String,
      required: [true, 'Experience level is required'],
      trim: true
    },
    coverNote: {
      type: String,
      required: [true, 'Cover note is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['New', 'Reviewed', 'Shortlisted', 'Rejected'],
      default: 'New'
    }
  },
  {
    timestamps: true
  }
);

const Career = mongoose.model('Career', careerSchema);

export default Career;
