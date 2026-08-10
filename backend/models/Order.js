import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    retailerId: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    imageUrl: String
  },
  { _id: false }
);

const TrackingUpdateSchema = new mongoose.Schema(
  {
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

// B2C customer orders with live tracking + review state.
const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    channel: { type: String, default: 'b2c' },
    customer: {
      name: { type: String, default: '' },
      phone: { type: String, required: true, index: true }
    },
    items: [OrderItemSchema],
    itemsTotal: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'cod' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'cancelled'], default: 'pending' },
    paymentRef: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    deliveryLocation: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    storeLocation: {
      latitude: { type: Number, default: 13.0827 },
      longitude: { type: Number, default: 80.2707 }
    },
    driverLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date
    },
    trackingUpdates: [TrackingUpdateSchema],
    expectedDelivery: { type: Date },
    invoicePdfUrl: { type: String, default: '' },
    review: {
      rating: Number,
      comment: String,
      productRetailerId: String,
      submittedAt: Date
    }
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
