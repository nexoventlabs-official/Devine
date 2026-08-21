import express from 'express';
import auth from '../middleware/auth.js';
import Order from '../models/Order.js';
import DealerProfile from '../models/DealerProfile.js';
import { getClient } from '../services/metaCloud.js';
import { getAsset, ASSET_KEYS } from '../services/assets.js';
import { genDealerId, genOrderId } from '../services/ids.js';
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

// Parse "lat,lng" out of a plain string or a Google Maps URL (?q=.., @lat,lng, etc.)
function parseLatLng(str) {
  if (!str) return null;
  const m = String(str).match(/(-?\d{1,3}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (!m) return null;
  const latitude = parseFloat(m[1]);
  const longitude = parseFloat(m[2]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

// Resolve the admin-configured office/dispatch location (used as the tracking origin).
async function getOfficeLocation() {
  try {
    return parseLatLng(await getAsset(ASSET_KEYS.OFFICE_LOCATION));
  } catch {
    return null;
  }
}

// Public: fetch an order for the tracking page.
router.get('/track/:orderId', async (req, res) => {
  const key = req.params.orderId;
  const order = await Order.findOne({ $or: [{ trackId: key }, { orderId: key }] }).lean();
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  // Use the admin-configured office location as the tracking origin (store marker).
  const office = await getOfficeLocation();
  if (office) order.storeLocation = office;
  res.json({ success: true, data: order });
});

// Public/latest order for a phone (used when opening /track without id)
router.get('/latest/:phone', async (req, res) => {
  const order = await Order.findOne({ 'customer.phone': req.params.phone }).sort({ createdAt: -1 }).lean();
  if (order) {
    const office = await getOfficeLocation();
    if (office) order.storeLocation = office;
  }
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
    const trackUrl = `${FRONTEND()}/track?order=${order.trackId || order.orderId}`;

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
      `*Your Dealer ID:* ${dealer.dealerId}\n` +
      `*Your Area Manager:* ${areaManagerName || 'To be assigned'} - ${areaManagerPhone || ''}`;
    await wa.sendText(phone, body).catch(() => {});

    // Attach the 3 dealer documents (uploaded in admin Flow Images), if available.
    const [agreement, priceList, brandGuide] = await Promise.all([
      getAsset(ASSET_KEYS.DEALER_AGREEMENT_PDF),
      getAsset(ASSET_KEYS.DEALER_PRICE_LIST_PDF),
      getAsset(ASSET_KEYS.DEALER_BRAND_GUIDE_PDF)
    ]);
    if (agreement) await wa.sendDocument(phone, agreement, 'Devine-Dealer-Agreement.pdf', '📄 Devine Dealer Agreement').catch(() => {});
    if (priceList) await wa.sendDocument(phone, priceList, 'Devine-Price-List-Dealer.pdf', '📄 Product Price List — Dealer Copy').catch(() => {});
    if (brandGuide) await wa.sendDocument(phone, brandGuide, 'Devine-Brand-Guidelines.pdf', '📄 Brand Guidelines — How to display Devine products').catch(() => {});

    // Fire the +10min and +1hr follow-up sequence.
    scheduleDealerWelcome(dealer);
    res.json({ success: true, data: dealer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create order from Website Checkout (COD or Online)
router.post('/create', async (req, res) => {
  try {
    const { items, customer, deliveryLocation, paymentMethod, paymentRef, deliveryCharge } = req.body;

    if (!items || !items.length || !customer || !customer.phone) {
      return res.status(400).json({ success: false, message: 'Items and customer phone number are required' });
    }

    const orderId = genOrderId('ORD');
    const trackId = genOrderId('TRK');

    const itemsTotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const charge = Number(deliveryCharge) || (itemsTotal >= 500 ? 0 : 50);
    const totalAmount = itemsTotal + charge;

    const formattedItems = items.map((i) => ({
      retailerId: i.retailerId || i._id || 'ITEM',
      name: i.name + (i.sizeLabel ? ` (${i.sizeLabel})` : ''),
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
      imageUrl: i.imageUrl || i.image || ''
    }));

    const cleanPhone = String(customer.phone).replace(/[^\d+]/g, '').trim();
    const cleanWhatsapp = customer.whatsappPhone ? String(customer.whatsappPhone).replace(/[^\d+]/g, '').trim() : cleanPhone;

    const isPaid = paymentMethod === 'online' && paymentRef ? 'paid' : 'pending';

    const order = await Order.create({
      orderId,
      trackId,
      channel: 'website',
      customer: {
        name: customer.name || 'Valued Customer',
        phone: cleanPhone,
        whatsappPhone: cleanWhatsapp,
        email: customer.email || ''
      },
      items: formattedItems,
      itemsTotal,
      deliveryCharge: charge,
      totalAmount,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: isPaid,
      paymentRef: paymentRef || '',
      status: 'pending',
      deliveryLocation: {
        latitude: deliveryLocation?.latitude || null,
        longitude: deliveryLocation?.longitude || null,
        address: deliveryLocation?.address || 'Standard Delivery'
      },
      trackingUpdates: [
        { status: 'pending', message: 'Order Placed via Website', timestamp: new Date() }
      ]
    });

    // Notify Admin via Socket.IO
    emitOrder(order);
    req.app.get('io')?.emit('new_order', order);

    // Send WhatsApp notification if customer phone is provided
    try {
      const wa = getClient('b2c');
      const trackUrl = `${FRONTEND()}/track?order=${order.trackId}`;
      const msg =
        `🎉 *Order Confirmed!*\n\n` +
        `Thank you for ordering with Devine, ${customer.name || ''}.\n` +
        `*Order ID:* ${order.orderId}\n` +
        `*Total Amount:* ₹${order.totalAmount}\n` +
        `*Payment Method:* ${(paymentMethod || 'cod').toUpperCase()}\n\n` +
        `Track your order live: ${trackUrl}`;
      await wa.sendText(cleanWhatsapp || cleanPhone, msg).catch(() => {});
    } catch (err) {
      logger.warn('WhatsApp order alert skipped', { error: err.message });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    logger.error('Order creation error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch My Orders for User (matches website orders AND WhatsApp B2C chatbot orders)
router.get('/my-orders', async (req, res) => {
  try {
    const { phone, whatsapp } = req.query;
    if (!phone && !whatsapp) {
      return res.status(400).json({ success: false, message: 'Phone or WhatsApp number required' });
    }

    const phones = new Set();
    if (phone) {
      const p = String(phone).trim();
      phones.add(p);
      phones.add(p.replace(/[^\d+]/g, ''));
      phones.add(p.replace(/^\+?91/, ''));
    }
    if (whatsapp) {
      const w = String(whatsapp).trim();
      phones.add(w);
      phones.add(w.replace(/[^\d+]/g, ''));
      phones.add(w.replace(/^\+?91/, ''));
    }

    const queryPhones = Array.from(phones).filter(Boolean);
    const regexList = queryPhones.map((p) => new RegExp(p.replace('+', '\\+'), 'i'));

    const orders = await Order.find({
      $or: [
        { 'customer.phone': { $in: regexList } },
        { 'customer.whatsappPhone': { $in: regexList } }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (err) {
    logger.error('My orders fetch error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
