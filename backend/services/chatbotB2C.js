// B2C WhatsApp conversation handler.
import { getClient } from './metaCloud.js';
import { getAsset, ASSET_KEYS } from './assets.js';
import { flowId } from '../flows/flowKeys.js';
import { getConversation, setStep, patchContext, resetConversation } from './conversationState.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Lead from '../models/Lead.js';
import { emitOrder, emitLead } from './eventBus.js';
import { genOrderId } from './ids.js';
import logger from './logger.js';

const CH = 'b2c';
const wa = () => getClient('b2c');
const GREETING = /^(hi|hello|hey|start|menu|hai|vanakkam|namaskaram)/i;

const FRONTEND = () => (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');

export async function sendWelcome(phone, name = '') {
  const banner = await getAsset(ASSET_KEYS.WELCOME_BANNER_B2C);
  const body =
    '🌿 *Namaskaram! Welcome to Devine Food Products.*\n\n' +
    'We make natural, preservative-free food products - straight from Tamil Nadu to your home since 2015.\n\n' +
    '*What brings you here today?*';
  const fId = flowId('b2c_service');
  await setStep(phone, CH, 'awaiting_service', { name });

  if (fId) {
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Choose Service',
      headerImageUrl: banner || undefined,
      headerText: banner ? undefined : 'Devine Natural Foods',
      bodyText: body,
      screenName: 'SERVICE_MENU',
      flowToken: `b2c_service_${clean(phone)}`,
      flowAction: 'navigate'
    });
  }
  return wa().sendList(phone, 'Welcome', body, 'Choose Service', [
    {
      title: 'Services',
      rows: [
        { id: 'browse', title: 'Browse our products' },
        { id: 'gifting', title: 'Corporate / Bulk gifting' },
        { id: 'track', title: 'Track Order' },
        { id: 'talk', title: 'Talk to us' }
      ]
    }
  ]);
}

export async function handle(msg) {
  const { phone, text, type, selectedId, flowResponse, location, name } = msg;

  if (type === 'text' && GREETING.test((text || '').trim())) {
    return sendWelcome(phone, name);
  }

  if (flowResponse) return handleFlowResponse(phone, flowResponse, name);

  if (selectedId) return handleSelection(phone, selectedId, name);

  const convo = await getConversation(phone, CH);
  if (location && convo.step === 'awaiting_location') {
    return finishOrder(phone, convo, location);
  }

  return sendWelcome(phone, name);
}

async function handleFlowResponse(phone, resp, name) {
  const token = resp.flow_token || '';

  if (token.startsWith('b2c_service_') && resp.selected_service) {
    return routeService(phone, resp.selected_service, name);
  }
  if (token.startsWith('b2c_order_summary_')) {
    // Order summary flow completed -> payment method chosen
    await patchContext(phone, CH, { customerName: resp.name || name || '' });
    return handlePaymentMethod(phone, resp.payment_method, resp.name || name);
  }
  if (token.startsWith('b2c_review_')) {
    return handleReviewSubmit(phone, resp);
  }
  return sendWelcome(phone, name);
}

async function handleSelection(phone, selectedId, name) {
  // Service list fallback
  if (['browse', 'gifting', 'track', 'talk'].includes(selectedId)) {
    return routeService(phone, selectedId, name);
  }
  // Category chosen: cat_<slug>
  if (selectedId.startsWith('cat_')) {
    return showCategoryProducts(phone, selectedId.replace('cat_', ''));
  }
  // Add product: add_<retailerId>
  if (selectedId.startsWith('add_')) {
    return addToCart(phone, selectedId.replace('add_', ''));
  }
  // View cart summary
  if (selectedId === 'view_summary') {
    return openOrderSummary(phone);
  }
  if (selectedId === 'menu') {
    return sendWelcome(phone, name);
  }
  return sendWelcome(phone, name);
}

async function routeService(phone, service, name) {
  switch (service) {
    case 'browse':
      return showCategories(phone);
    case 'gifting':
      return wa().sendCtaUrl(
        phone,
        '🎁 For corporate/bulk gifting, our team will craft a custom hamper quote for you. Share your requirement and we will respond shortly.',
        'Talk to us',
        supportLink()
      );
    case 'track':
      return wa().sendCtaUrl(
        phone,
        '📦 Track your latest order live on the map.',
        'Track Order',
        `${FRONTEND()}/track`
      );
    case 'talk':
      return wa().sendCtaUrl(phone, "We're here to help! Tap below to chat or call us.", 'Call Us', supportLink());
    default:
      return sendWelcome(phone, name);
  }
}

async function showCategories(phone) {
  const cats = await Category.find({ active: true }).sort({ order: 1 }).lean();
  if (!cats.length) {
    return wa().sendText(phone, 'Our catalogue is being updated. Please check back soon!');
  }
  await setStep(phone, CH, 'browsing');
  return wa().sendList(phone, 'Our Categories', 'Select a category to explore our products.', 'Categories', [
    { title: 'Categories', rows: cats.map((c) => ({ id: `cat_${c.slug}`, title: c.name })) }
  ]);
}

async function showCategoryProducts(phone, slug) {
  const cat = await Category.findOne({ slug }).lean();
  const products = await Product.find({ active: true, inStock: true, category: cat?.name || slug }).lean();
  if (!products.length) {
    return wa().sendText(phone, 'No products in this category yet.');
  }
  await setStep(phone, CH, 'browsing');
  // Send each product as an image card with an Add button (chunked to respect rate)
  for (const p of products.slice(0, 8)) {
    const body =
      `*${p.name}*\n` +
      `${p.shortDesc || p.description || ''}\n\n` +
      `⭐ ${p.rating || 4.5} (${p.reviewCount || 0})\n` +
      `*Rs.${p.price}*${p.mrp && p.mrp > p.price ? `  ~Rs.${p.mrp}~` : ''}`;
    await wa()
      .sendImageWithButtons(phone, p.imageUrl, body, [
        { id: `add_${p.retailerId}`, text: 'Add to cart' },
        { id: 'view_summary', text: 'View cart' }
      ])
      .catch(() => {});
  }
  return true;
}

async function addToCart(phone, retailerId) {
  const p = await Product.findOne({ retailerId }).lean();
  if (!p) return wa().sendText(phone, 'Sorry, that product is unavailable.');
  const convo = await getConversation(phone, CH);
  const cart = Array.isArray(convo.context?.cart) ? convo.context.cart : [];
  const existing = cart.find((i) => i.retailerId === retailerId);
  if (existing) existing.quantity += 1;
  else cart.push({ retailerId, name: p.name, price: p.price, quantity: 1, imageUrl: p.imageUrl });
  await patchContext(phone, CH, { cart });
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  return wa().sendButtons(
    phone,
    `✅ Added *${p.name}*.\n\n🛒 Cart total: *Rs.${total}* (${cart.length} item${cart.length > 1 ? 's' : ''})`,
    [
      { id: 'view_summary', text: 'Checkout' },
      { id: 'browse', text: 'Add more' }
    ]
  );
}

async function openOrderSummary(phone) {
  const convo = await getConversation(phone, CH);
  const cart = convo.context?.cart || [];
  if (!cart.length) {
    return wa().sendText(phone, '🛒 Your cart is empty. Type *menu* to browse products.');
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const summaryItems = cart.map((i) => `${i.quantity}x ${i.name} - Rs.${i.price * i.quantity}`).join('\n');
  const fId = flowId('b2c_order_summary');
  await setStep(phone, CH, 'order_summary');

  if (fId) {
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Order Summary',
      bodyText: 'Review your order and choose a payment method.',
      headerText: 'Order Summary',
      screenName: 'ORDER_SUMMARY',
      screenData: {
        summary_items: summaryItems,
        summary_total: `Rs.${total}`,
        customer_name: convo.name || ''
      },
      flowToken: `b2c_order_summary_${clean(phone)}`,
      flowAction: 'navigate'
    });
  }
  // Fallback
  return wa().sendButtons(
    phone,
    `🧾 *Order Summary*\n\n${summaryItems}\n\n*Total: Rs.${total}*\n\nChoose payment:`,
    [
      { id: 'pay_online', text: 'Online Payment' },
      { id: 'pay_cod', text: 'Cash on Delivery' }
    ]
  );
}

async function handlePaymentMethod(phone, method, name) {
  await patchContext(phone, CH, { paymentMethod: method === 'online' ? 'online' : 'cod', customerName: name || '' });
  await setStep(phone, CH, 'awaiting_location', { paymentMethod: method === 'online' ? 'online' : 'cod', customerName: name || '' });
  const img = await getAsset(ASSET_KEYS.PAYMENT_HEADER);
  if (img) await wa().sendImage(phone, img, 'Almost there!').catch(() => {});
  return wa().sendLocationRequest(phone, '📍 Please share your delivery location to continue.');
}

async function finishOrder(phone, convo, location) {
  const cart = convo.context?.cart || [];
  if (!cart.length) return sendWelcome(phone);
  const itemsTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryCharge = itemsTotal >= 500 ? 0 : 40;
  const orderId = genOrderId('DVN-B2C');
  const expected = new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const order = await Order.create({
    orderId,
    channel: 'b2c',
    customer: { name: convo.context?.customerName || convo.name || '', phone },
    items: cart,
    itemsTotal,
    deliveryCharge,
    totalAmount: itemsTotal + deliveryCharge,
    paymentMethod: convo.context?.paymentMethod || 'cod',
    paymentStatus: 'pending',
    status: 'confirmed',
    deliveryLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address || ''
    },
    expectedDelivery: expected,
    trackingUpdates: [{ status: 'confirmed', message: 'Order confirmed', timestamp: new Date() }]
  });
  emitOrder(order);

  await patchContext(phone, CH, { cart: [] });
  await setStep(phone, CH, 'ordered');

  // Online payment -> trigger WhatsApp native Pay (Review & Pay -> UPI).
  if (order.paymentMethod === 'online' && process.env.WHATSAPP_PAYMENT_CONFIG) {
    try {
      const payImg = await getAsset(ASSET_KEYS.PAYMENT_HEADER);
      await wa().sendOrderDetails(phone, orderId, order.items, order.totalAmount, {
        shipping: order.deliveryCharge,
        headerImageUrl: payImg || null
      });
      return true; // payment webhook will confirm + send tracking
    } catch (err) {
      logger.warn('Native payment send failed, falling back to confirmation', { error: err.message });
    }
  }

  const confirmImg = await getAsset(ASSET_KEYS.ORDER_CONFIRMED);
  const body =
    `✅ *Order Confirmed! Thank you, ${order.customer.name || 'there'}!*\n\n` +
    `*Order ID:* ${orderId}\n` +
    `*Total:* Rs.${order.totalAmount}\n` +
    `*Payment:* ${order.paymentMethod === 'online' ? 'Online' : 'Cash on Delivery'}\n` +
    `*Expected delivery:* ${expected.toDateString()}\n\n` +
    "We'll send you tracking details once dispatched.";
  const trackUrl = `${FRONTEND()}/track?order=${orderId}`;

  if (confirmImg) {
    return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl, 'Devine Natural Foods', confirmImg);
  }
  return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl);
}

// ---------- REVIEW ----------
export async function startReview(phone, orderId) {
  const order = await Order.findOne({ orderId }).lean();
  const products = (order?.items || []).map((i) => ({ id: i.retailerId, title: i.name }));
  const fId = flowId('b2c_review');
  await setStep(phone, CH, 'reviewing', { reviewOrderId: orderId });
  if (fId && products.length) {
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Leave a Review',
      headerImageUrl: (await getAsset(ASSET_KEYS.REVIEW_HEADER)) || undefined,
      headerText: 'Rate your order',
      bodyText: 'How was your Devine experience? Your feedback helps us serve you better.',
      screenName: products.length > 1 ? 'PICK_PRODUCT' : 'RATE',
      screenData: products.length > 1 ? { products } : { product: products[0]?.id || '' },
      flowToken: `b2c_review_${clean(phone)}`,
      flowAction: 'navigate'
    });
  }
  return wa().sendText(phone, 'Please reply with your rating (1-5) and a short review.');
}

async function handleReviewSubmit(phone, resp) {
  const convo = await getConversation(phone, CH);
  const orderId = convo.context?.reviewOrderId;
  const rating = parseInt(resp.rating, 10) || 0;
  if (orderId) {
    await Order.findOneAndUpdate(
      { orderId },
      { $set: { review: { rating, comment: resp.review || '', productRetailerId: resp.product || '', submittedAt: new Date() } } }
    );
  }
  await setStep(phone, CH, 'awaiting_service');

  if (rating >= 5) {
    const img = await getAsset(ASSET_KEYS.REVIEW_5STAR_HEADER);
    const link = await getAsset(ASSET_KEYS.GOOGLE_REVIEW_LINK, 'https://g.page/r/');
    const body =
      'Thank you so much! 🙏\n\n' +
      'Would you like to share this on Google? It helps us reach more families.\n\n' +
      'As a thank you - here is 10% off your next order:\n' +
      '*Code: DIVINE10* (valid 7 days)';
    return wa().sendCtaUrl(phone, body, 'Leave a Google Review', link, 'Devine Natural Foods', img || null);
  }

  // 1-3 stars (or 4) -> issue path + internal alert
  const lead = await Lead.create({
    channel: CH,
    type: 'review_issue',
    phone,
    details: { orderId, rating, comment: resp.review || '' }
  });
  emitLead(lead);
  const img = await getAsset(ASSET_KEYS.REVIEW_ISSUE_HEADER);
  const body =
    "We're sorry to hear that. 😔\n\n" +
    'Our team will call you within 2 hours to resolve this.';
  const buttons = [{ id: 'menu', text: 'Choose Service' }];
  if (img) return wa().sendImageWithButtons(phone, img, body, buttons);
  return wa().sendButtons(phone, body, buttons);
}

function supportLink() {
  const num = process.env.WA_B2C_DISPLAY_NUMBER || '';
  return num ? `https://wa.me/${num.replace(/\D/g, '')}` : `${FRONTEND()}/contact`;
}
function clean(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default { sendWelcome, handle, startReview };
