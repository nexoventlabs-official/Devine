// Assign a unique trackId to any existing order that doesn't have one.
// Run: node scripts/backfill-trackids.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { genOrderId } from '../services/ids.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Order = (await import('../models/Order.js')).default;
await mongoose.connect(process.env.MONGODB_URI);

const orders = await Order.find({ $or: [{ trackId: { $exists: false } }, { trackId: null }, { trackId: '' }] });
let updated = 0;
for (const o of orders) {
  // Ensure uniqueness
  let tid;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    tid = genOrderId('TRK');
    const exists = await Order.findOne({ trackId: tid }).lean();
    if (!exists) break;
  }
  o.trackId = tid;
  await o.save();
  updated++;
  console.log(`  ${o.orderId} -> ${tid}`);
}
console.log(`Backfill complete. ${updated} order(s) updated. Total orders: ${await Order.countDocuments()}`);
await mongoose.disconnect();
