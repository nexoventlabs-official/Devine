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
import catalogService from './catalogService.js';
import logger from './logger.js';

const CH = 'b2c';
const wa = () => getClient('b2c');
const GREETING = /^(hi|hello|hey|start|menu|hai|vanakkam|namaskaram)/i;

const FRONTEND = () => (process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '');
const cleanPhone = (p) => (p || '').replace(/\D/g, '');

export async function sendWelcome(phone, name = '') {
  const messageHeader = await getAsset(ASSET_KEYS.WELCOME_HEADER_B2C);
  const body =
    '🌿 *Namaskaram! Welcome to Devine Food Products.*\n\n' +
    'We make natural, preservative-free food products - straight from Tamil Nadu to your home since 2015.\n\n' +
    '*What brings you here today?*';
  const fId = flowId('b2c_service');
  await setStep(phone, CH, 'awaiting_service', { name });

  if (fId) {
    // Open with data_exchange (no payload) so Meta calls the endpoint's INIT,
    // which supplies the SERVICE_MENU data: base64 banner + services list.
    // (Opening with navigate + no data was leaving the screen empty/broken.)
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Choose Service',
      headerImageUrl: messageHeader || undefined,
      headerText: messageHeader ? undefined : 'Devine Natural Foods',
      bodyText: body,
      flowToken: `b2c_service_${cleanPhone(phone)}`,
      flowAction: 'data_exchange'
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
  const { phone, text, type, selectedId, flowResponse, location, name, order } = msg;

  if (type === 'text' && GREETING.test((text || '').trim())) {
    return sendWelcome(phone, name);
  }

  // Native WhatsApp catalog cart submission -> build cart + open order summary.
  if (type === 'order' && order) return handleCatalogOrder(phone, order, name);

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

  if (token.startsWith('b2c_service_')) {
    // Category chosen inside the flow -> send the catalog message for it.
    if (resp.selected_category) return showCategoryProducts(phone, resp.selected_category);
    // Track Order: an order was picked in the flow -> send its tracking message.
    if (resp.selected_service === 'track') {
      if (resp.selected_order) return sendOrderTracking(phone, resp.selected_order);
      return wa().sendButtons(phone, '📦 You have no orders yet. Browse our products to place your first order!', [
        { id: 'browse', text: 'Browse Products' },
        { id: 'menu', text: 'Choose Service' }
      ]);
    }
    if (resp.selected_service) return routeService(phone, resp.selected_service, name);
  }
  if (token.startsWith('b2c_order_summary_')) {
    // Order summary flow completed -> payment method chosen
    await patchContext(phone, CH, { customerName: resp.name || name || '' });
    return handlePaymentMethod(phone, resp.payment_method, resp.name || name);
  }
  if (token.startsWith('b2c_review_')) {
    return handleReviewSubmit(phone, resp);
  }
  if (token.startsWith('b2c_gifting_')) {
    return finishGifting(phone, resp, name);
  }
  return sendWelcome(phone, name);
}

// ---------- CORPORATE / BULK GIFTING (B2C, mirrors B2B) ----------
async function startGifting(phone, name) {
  const fId = flowId('b2c_gifting');
  await setStep(phone, CH, 'gifting_flow', { name });
  const intro =
    '🎁 *Devine Corporate Gifting — Premium Natural Gift Hampers*\n\n' +
    'We create custom gift hampers for:\n' +
    '✅ Festival & Diwali Gifting\n' +
    '✅ Client Appreciation\n' +
    '✅ Employee Wellness\n' +
    '✅ Wedding Favours (Bulk)\n\n' +
    'Hampers start from Rs.299 per unit (MOQ: 50 units).';
  if (fId) {
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Get a Quote',
      bodyText: intro,
      headerImageUrl: (await getAsset(ASSET_KEYS.GIFTING_HEADER)) || undefined,
      headerText: 'Corporate Gifting',
      screenName: 'GIFTING',
      flowToken: `b2c_gifting_${clean(phone)}`,
      flowAction: 'navigate'
    });
  }
  // Fallback if the B2C gifting flow isn't published yet.
  return wa().sendCtaUrl(phone, intro, 'Talk to us', supportLink());
}

async function finishGifting(phone, resp, name) {
  const lead = await Lead.create({
    channel: CH,
    type: 'gifting',
    name: name || resp.company || '',
    phone,
    businessName: resp.company || '',
    details: resp
  });
  emitLead(lead);
  const header = await getAsset(ASSET_KEYS.GIFTING_HEADER);
  const body =
    `Thank you! We've received your gifting request for *${resp.hampers}* hampers.\n\n` +
    'Our gifting specialist will share a custom catalogue and quote shortly.';
  await setStep(phone, CH, 'awaiting_service');
  const buttons = [{ id: 'menu', text: 'Choose Service' }];
  if (header) return wa().sendImageWithButtons(phone, header, body, buttons);
  return wa().sendButtons(phone, body, buttons);
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
      return startGifting(phone, name);
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
  let cats = await Category.find({ active: true }).sort({ order: 1 }).lean();

  // Fallback: if no Category docs exist yet, derive them from the products that
  // actually have stock, and auto-create Category rows so admin can add tile
  // images later. This prevents the "catalogue is being updated" dead-end.
  if (!cats.length) {
    const names = await Product.distinct('category', { active: true, inStock: true });
    const clean = names.filter(Boolean);
    if (!clean.length) {
      return wa().sendText(phone, 'Our catalogue is being updated. Please check back soon!');
    }
    const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    cats = [];
    for (let i = 0; i < clean.length; i++) {
      const name = clean[i];
      const slug = slugify(name);
      try {
        await Category.findOneAndUpdate(
          { name },
          { $setOnInsert: { name, slug, order: i, active: true } },
          { upsert: true }
        );
      } catch (_) { /* ignore dup races */ }
      cats.push({ name, slug, imageUrl: '' });
    }
  }
  await setStep(phone, CH, 'browsing');
  const cleanPhone = (p) => (p || '').replace(/\D/g, '');
  const fId = flowId('b2c_service');

  // Show each category as an image card with a "View Products" button.
  const withImages = cats.filter((c) => c.imageUrl);
  if (withImages.length) {
    for (const c of withImages.slice(0, 10)) {
      await wa()
        .sendImageWithButtons(phone, c.imageUrl, `*${c.name}*`, [{ id: `cat_${c.slug}`, text: 'View Products' }])
        .catch(() => {});
    }
    const noImage = cats.filter((c) => !c.imageUrl);
    if (noImage.length) {
      await wa().sendList(phone, 'More Categories', 'Select a category:', 'Categories', [
        { title: 'Categories', rows: noImage.map((c) => ({ id: `cat_${c.slug}`, title: c.name })) }
      ]);
    }
    return true;
  }

  // Fallback: interactive list directly without preamble text header message.
  return wa().sendList(phone, 'Categories', 'Select a category to explore our products.', 'Categories', [
    { title: 'Categories', rows: cats.map((c) => ({ id: `cat_${c.slug}`, title: c.name })) }
  ]);
}

async function showCategoryProducts(phone, slug) {
  const cat = await Category.findOne({ slug }).lean();
  const categoryName = cat?.name || slug;
  const products = await Product.find({ active: true, inStock: true, category: categoryName }).lean();
  if (!products.length) {
    return wa().sendText(phone, 'No products in this category yet.');
  }
  await setStep(phone, CH, 'browsing');

  // Preferred: native WhatsApp catalog product_list (real product cards with
  // ratings + details on the product page). Falls back to image cards below.
  try {
    const built = await catalogService.buildCategorySections(categoryName);
    if (built) {
      await wa().sendProductList(
        phone,
        process.env.META_CATALOG_ID,
        categoryName,
        `Browse our ${categoryName}. Tap a product for full details, ratings & to add to cart.`,
        built.sections,
        'Devine Natural Foods'
      );
      return true;
    }
  } catch (err) {
    logger.warn('Catalog product_list failed, using image cards', { error: err.response?.data?.error?.message || err.message });
  }

  // Fallback: send each product as an image card with an Add button.
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

// Convert a native WhatsApp catalog order (cart submission) into our cart,
// then open the order-summary flow (review + payment method).
async function handleCatalogOrder(phone, order, name) {
  const items = order.product_items || [];
  const cart = [];
  for (const it of items) {
    const p = await Product.findOne({ retailerId: it.product_retailer_id }).lean();
    if (!p) continue;
    cart.push({
      retailerId: p.retailerId,
      name: p.name,
      price: p.price,
      quantity: Number(it.quantity) || 1,
      imageUrl: p.imageUrl
    });
  }
  if (!cart.length) {
    return wa().sendText(phone, 'We could not read your cart. Type *menu* to browse again.');
  }
  await patchContext(phone, CH, { cart, customerName: name || '' });
  return openOrderSummary(phone);
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
  const trackId = genOrderId('TRK');
  const expected = new Date(Date.now() + 3 * 24 * 3600 * 1000);

  const order = await Order.create({
    orderId,
    trackId,
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
  const trackUrl = `${FRONTEND()}/track?order=${trackId}`;

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

// Called from the webhook when a native WhatsApp Pay transaction succeeds.
export async function confirmPaidOrder(referenceId, payment = {}) {
  const order = await Order.findOne({ orderId: referenceId });
  if (!order) {
    logger.warn('confirmPaidOrder: order not found', { referenceId });
    return;
  }
  order.paymentStatus = 'paid';
  if (order.status === 'pending' || !order.status) order.status = 'confirmed';
  order.paymentRef = payment?.transaction?.id || payment?.reference_id || referenceId;
  await order.save();
  emitOrder(order);

  const phone = order.customer?.phone;
  const expected = order.expectedDelivery ? new Date(order.expectedDelivery) : new Date(Date.now() + 3 * 864e5);
  const confirmImg = await getAsset(ASSET_KEYS.ORDER_CONFIRMED);
  const body =
    `✅ *Payment received! Order Confirmed, ${order.customer?.name || 'there'}!*\n\n` +
    `*Order ID:* ${order.orderId}\n` +
    `*Total Paid:* Rs.${order.totalAmount}\n` +
    `*Expected delivery:* ${expected.toDateString()}\n\n` +
    "We'll send you tracking details once dispatched.";
  const trackUrl = `${FRONTEND()}/track?order=${order.trackId || order.orderId}`;
  if (confirmImg) return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl, 'Devine Natural Foods', confirmImg);
  return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl);
}

// Called when a native payment fails/cancels.
export async function failPaidOrder(referenceId) {
  const order = await Order.findOne({ orderId: referenceId });
  if (!order) return;
  order.paymentStatus = 'failed';
  await order.save();
  emitOrder(order);
  return wa().sendButtons(
    order.customer?.phone,
    '⚠️ Your payment did not go through. You can retry or choose Cash on Delivery.',
    [
      { id: 'retry_payment', text: 'Retry Payment' },
      { id: 'menu', text: 'Choose Service' }
    ]
  );
}

// Status -> label + 1:1 logo asset key (uploaded in admin Flow Images).
const ORDER_STATUS_UI = {
  pending: { label: 'Pending', key: ASSET_KEYS.ORDER_STATUS_PENDING },
  confirmed: { label: 'Order Confirmed', key: ASSET_KEYS.ORDER_STATUS_CONFIRMED },
  packed: { label: 'Packed', key: ASSET_KEYS.ORDER_STATUS_PACKED },
  dispatched: { label: 'Dispatched', key: ASSET_KEYS.ORDER_STATUS_DISPATCHED },
  out_for_delivery: { label: 'Out for Delivery', key: ASSET_KEYS.ORDER_STATUS_OUT_FOR_DELIVERY },
  delivered: { label: 'Delivered', key: ASSET_KEYS.ORDER_STATUS_DELIVERED },
  cancelled: { label: 'Cancelled', key: ASSET_KEYS.ORDER_STATUS_CANCELLED }
};

// Send the tracking message for a specific order (chosen in the Track Order flow).
async function sendOrderTracking(phone, trackKey) {
  const order = await Order.findOne({ $or: [{ trackId: trackKey }, { orderId: trackKey }] }).lean();
  if (!order) return wa().sendText(phone, 'Sorry, we could not find that order. Type *menu* to start again.');
  const ui = ORDER_STATUS_UI[order.status] || ORDER_STATUS_UI.confirmed;
  const logo = await getAsset(ui.key);
  const itemsCount = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  const eta = order.expectedDelivery ? new Date(order.expectedDelivery).toDateString() : 'TBA';
  const body =
    `📦 *Order ${order.orderId}*\n\n` +
    `*Track ID:* ${order.trackId || order.orderId}\n` +
    `*Status:* ${ui.label}\n` +
    `*Items:* ${itemsCount}\n` +
    `*Total:* Rs.${order.totalAmount}\n` +
    `*Expected delivery:* ${eta}\n\n` +
    'Tap below for live map tracking.';
  const trackUrl = `${FRONTEND()}/track?order=${order.trackId || order.orderId}`;
  if (logo) return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl, 'Devine Natural Foods', logo);
  return wa().sendCtaUrl(phone, body, 'Track Order', trackUrl);
}

function supportLink() {
  const num = process.env.WA_B2C_DISPLAY_NUMBER || '';
  return num ? `https://wa.me/${num.replace(/\D/g, '')}` : `${FRONTEND()}/contact`;
}
function clean(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default { sendWelcome, handle, startReview, confirmPaidOrder, failPaidOrder };
