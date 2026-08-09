// Seeds default CRM templates (dealer welcome sequence + retention broadcasts).
// Run: node scripts/seedTemplates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Template from '../models/Template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const TEMPLATES = [
  {
    key: 'dealer_welcome_1',
    title: 'Dealer Welcome (Message 1)',
    channel: 'b2b',
    body:
      '🎉 Welcome to the Devine Dealer Family, [Name]!\n\n' +
      'You are now an authorised Devine dealer for [City/District].\n\n' +
      'Your Dealer ID: DVN-[XXXX]\n' +
      'Your Area Manager: [Manager] - [Number]\n\n' +
      '📄 Dealer Agreement | 📄 Price List | 📄 Brand Guidelines'
  },
  {
    key: 'dealer_welcome_2',
    title: 'How to Order (Message 2, +10 min)',
    channel: 'b2b',
    body:
      "Here's how to place orders with us:\n\n" +
      '1️⃣ WhatsApp your order to this number\n' +
      '2️⃣ Format: Product Name | Quantity | Delivery Address\n' +
      '3️⃣ We confirm within 2 hours\n' +
      '4️⃣ Dispatch within 48 hours\n' +
      '5️⃣ Payment: Advance / Credit (based on agreement)\n\n' +
      'For urgent orders, call your area manager directly.',
    buttons: [{ kind: 'reply', text: 'ORDER', payload: 'order' }]
  },
  {
    key: 'dealer_welcome_3',
    title: 'First Order Incentive (Message 3, +1 hr)',
    channel: 'b2b',
    body:
      '🎁 Welcome Offer - First Order Only\n\n' +
      'Place your first order within 7 days and get:\n' +
      '✅ 5% additional discount\n' +
      '✅ Free display stand (orders above Rs.15,000)\n' +
      '✅ Free product samples for customer trials\n\n' +
      'Reply ORDER to place your first order now.',
    buttons: [{ kind: 'reply', text: 'ORDER', payload: 'order' }]
  },
  {
    key: 'weekly_broadcast',
    title: 'Weekly Broadcast (Mon 10 AM)',
    channel: 'b2b',
    body:
      'Good morning [Name] 🌿\n\n' +
      'Devine Weekly Update - [Date]\n' +
      '📦 New stock available: [Products]\n' +
      "🔥 This week's fast-moving: [Product]\n" +
      '📣 Promotion: [Promo]',
    buttons: [{ kind: 'reply', text: 'ORDER', payload: 'order' }]
  },
  {
    key: 'restock_alert',
    title: 'Restock Alert (30 days since last order)',
    channel: 'b2b',
    body:
      "Hi [Name], it's been a while! 👋\n\n" +
      'Your customers may be running low on Devine products.\n\n' +
      'Top sellers this month in your region:\n' +
      '1. [Product1] - Rs.[Price1]\n' +
      '2. [Product2] - Rs.[Price2]\n' +
      '3. [Product3] - Rs.[Price3]\n\n' +
      'Click ORDER to restock. We dispatch within 48 hours.',
    buttons: [{ kind: 'reply', text: 'ORDER', payload: 'order' }]
  },
  {
    key: 'festival_alert',
    title: 'Festival Alert (21 days before)',
    channel: 'b2b',
    body:
      '🪔 [Festival] is in 21 days, [Name]!\n\n' +
      'Last year, Devine dealers sold [X]% more during [Festival] season.\n\n' +
      'Pre-order now and get:\n' +
      '✅ Priority dispatch\n' +
      '✅ Festival-ready packaging\n' +
      '✅ POP materials for your store',
    buttons: [{ kind: 'reply', text: 'PRE-ORDER', payload: 'preorder' }]
  },
  {
    key: 'new_product_launch',
    title: 'New Product Launch',
    channel: 'b2b',
    headerType: 'image',
    body:
      '🆕 New from Devine - [Product Name]\n\n' +
      '[Description]\n\n' +
      'Dealer price: Rs.[DealerPrice] | MRP: Rs.[MRP] | Margin: [Margin]\n' +
      'MOQ: [MOQ] units\n\n' +
      'Click SAMPLE to request a free sample before ordering.',
    buttons: [{ kind: 'reply', text: 'SAMPLE', payload: 'book_sample' }]
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  for (const t of TEMPLATES) {
    await Template.findOneAndUpdate({ key: t.key }, t, { upsert: true, new: true });
    console.log('Seeded template:', t.key);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
