import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';
import DealerProfile from '../models/DealerProfile.js';
import { getClient } from '../services/metaCloud.js';
import { getAsset, ASSET_KEYS } from '../services/assets.js';
import { genDealerId } from '../services/ids.js';
import { triggerReview } from '../services/chatbot.js';
import { generateInvoicePdf } from '../services/pdf.js';
import { scheduleDealerWelcome } from '../services/scheduler.js';
import { emitOrder } from '../services/eventBus.js';
import logger from '../services/logger.js';

const router = express.Router();

const FRONTEND = () => (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');

const STATUS_FLOW = ['pending', 'confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered'];
const STATUS_LABEL = {
  confirmed: 'Order Confirmed',
  packed: 'Packed & Ready',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered'
};

// Public: fetch an order for the tracking page.
router.get('/track/:orderId', async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).lean();
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order });
});

// Public/latest order for a phone (used when opening /track without id)
router.get('/latest/:phone', async (req, res) => {
  const order = await Order.findOne({ 'customer.phone': req.params.phone }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: order });
});

// Admin: list orders
router.get('/', auth, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, data: orders });
});

// Admin: update order status -> notify customer on WhatsApp + emit socket update
router.patch('/:orderId/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_FLOW.includes(status) && status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });

    order.status = status;
    order.trackingUpdates.push({ status, message: STATUS_LABEL[status] || status, timestamp: new Date() });
    await order.save();
    emitOrder(order);
    req.app.get('io')?.to(`order_${order.orderId}`).emit('status', { orderId: order.orderId, status, updates: order.trackingUpdates });

    const wa = getClient('b2c');
    const trackUrl = `${FRONTEND()}/track?order=${order.orderId}`;

    if (status === 'delivered') {
      // Generate invoice PDF + trigger review flow
      let pdfUrl = order.invoicePdfUrl;
      try {
        pdfUrl = await generateInvoicePdf(order);
        order.invoicePdfUrl = pdfUrl;
        await order.save();
      } catch (err) {
        logger.warn('Invoice PDF generation failed', { error: err.message });
      }
      const header = await getAsset(ASSET_KEYS.DELIVERED_PDF_HEADER);
      const body = `📦 *Delivered!* Thank you, ${order.customer?.name || 'there'}.\n\nHere is your invoice. We'd love your feedback!`;
      if (pdfUrl) {
        await wa.sendDocument(order.customer.phone, pdfUrl, `Devine-Invoice-${order.orderId}.pdf`, body).catch(() => {});
      } else if (header) {
        await wa.sendImage(order.customer.phone, header, body).catch(() => {});
      } else {
        await wa.sendText(order.customer.phone, body).catch(() => {});
      }
      // Kick off the review flow
      await triggerReview(order.customer.phone, order.orderId).catch(() => {});
    } else {
      const body = `📦 *${STATUS_LABEL[status] || status}*\n\nOrder ${order.orderId} update. Track it live below.`;
      await wa.sendCtaUrl(order.customer.phone, body, 'Track Order', trackUrl).catch(() => {});
    }

    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Order status update error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Driver GPS ping -> store + broadcast to tracking page via Socket.IO
router.post('/:orderId/driver-location', async (req, res) => {
  const { latitude, longitude } = req.body;
  const order = await Order.findOneAndUpdate(
    { orderId: req.params.orderId },
    { $set: { driverLocation: { latitude, longitude, updatedAt: new Date() } } },
    { new: true }
  );
  if (!order) return res.status(404).json({ success: false });
  req.app.get('io')?.to(`order_${order.orderId}`).emit('driver', { latitude, longitude, at: new Date() });
  res.json({ success: true });
});

// Admin: approve a dealer lead -> create DealerProfile + send welcome sequence
router.post('/dealers/approve', auth, async (req, res) => {
  try {
    const { phone, name, businessName, businessType, state, district, city, capacity, areaManagerName, areaManagerPhone } = req.body;
    const dealerId = genDealerId();
    const dealer = await DealerProfile.findOneAndUpdate(
      { phone },
      { dealerId, phone, name, businessName, businessType, state, district, city, capacity, areaManagerName, areaManagerPhone, status: 'Active' },
      { new: true, upsert: true }
    );
    // Welcome message (Message 1). Messages 2 & 3 are scheduled by the CRM sequence.
    const wa = getClient('b2b');
    const body =
      `🎉 *Welcome to the Devine Dealer Family, ${name || ''}!*\n\n` +
      `You are now an authorised Devine dealer for ${city || district || ''}.\n\n` +
      `*Your Dealer ID:* ${dealerId}\n` +
      `*Your Area Manager:* ${areaManagerName || ''} - ${areaManagerPhone || ''}`;
    await wa.sendText(phone, body).catch(() => {});
    // Fire the +10min and +1hr follow-up sequence.
    scheduleDealerWelcome(dealer);
    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
