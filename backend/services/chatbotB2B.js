// B2B WhatsApp conversation handler.
import { getClient } from './metaCloud.js';
import { getAsset, ASSET_KEYS } from './assets.js';
import { flowId } from '../flows/flowKeys.js';
import { getConversation, setStep, patchContext, resetConversation } from './conversationState.js';
import DealerProfile from '../models/DealerProfile.js';
import Lead from '../models/Lead.js';
import Product from '../models/Product.js';
import SupplyCountry from '../models/SupplyCountry.js';
import BulkRange from '../models/BulkRange.js';
import { resolveLocationAddress } from './geocode.js';
import { emitLead } from './eventBus.js';
import { genDealerId } from './ids.js';
import logger from './logger.js';

const CH = 'b2b';
const wa = () => getClient('b2b');

const GREETING = /^(hi|hello|hey|start|menu|hai|vanakkam|namaskaram)/i;

// ---- Welcome: image header + body + "Choose Service" flow CTA ----
export async function sendWelcome(phone, name = '') {
  // Message header image (original ratio) shown on the welcome chat bubble.
  const welcomeHeader = await getAsset(ASSET_KEYS.WELCOME_HEADER_B2B);
  const dealer = await DealerProfile.findOne({ phone });

  const services = [
    dealer
      ? { id: 'already_dealer', title: 'Already a Dealer - Profile' }
      : { id: 'dealer', title: 'Become a Dealer / Distributor' },
    { id: 'bulk', title: 'Bulk / Wholesale Enquiry' },
    { id: 'gifting', title: 'Corporate Gifting (B2B)' },
    { id: 'export', title: 'Export / International Supply' }
  ];

  const body =
    '🌿 *Welcome to Devine Food Products (Business)*\n\n' +
    'Natural, preservative-free products from Tamil Nadu since 2015.\n\n' +
    'Tap *Choose Service* to get started.';

  const fId = flowId('b2b_service');
  await setStep(phone, CH, 'awaiting_service', { name });

  if (fId) {
    // Endpoint-driven: INIT supplies the banner (8:1) + 1:1 service logos and,
    // when "Become a Dealer" is picked, the registration screens run in this flow.
    return wa().sendFlowMessage(phone, {
      flowId: fId,
      flowCta: 'Choose Service',
      headerImageUrl: welcomeHeader || undefined,
      headerText: welcomeHeader ? undefined : 'Devine Business',
      bodyText: body,
      footerText: 'Devine Natural Foods',
      screenName: 'CHOOSE_SERVICE',
      flowToken: `b2b_service_${clean(phone)}`,
      flowAction: 'data_exchange'
    });
  }
  // Fallback to buttons/list if the flow isn't published yet
  return wa().sendList(phone, 'Choose Service', body, 'Choose Service', [
    { title: 'Services', rows: services.map((s) => ({ id: s.id, title: s.title })) }
  ]);
}

// ---- Main entry ----
export async function handle(msg) {
  const { phone, text, type, selectedId, flowResponse, location, name } = msg;

  if (type === 'text' && GREETING.test((text || '').trim())) {
    return sendWelcome(phone, name);
  }

  // Flow completion payloads
  if (flowResponse) {
    return handleFlowResponse(phone, flowResponse, name);
  }

  // List/button fallback service selection (when flow unavailable)
  if (selectedId && ['dealer', 'already_dealer', 'bulk', 'gifting', 'export'].includes(selectedId)) {
    return routeService(phone, selectedId, name);
  }

  // Reply-button payloads from broadcast/retention templates.
  if (selectedId === 'menu') return sendWelcome(phone, name);
  if (selectedId === 'order' || selectedId === 'preorder') return handleOrderIntent(phone, name);
  if (selectedId === 'book_sample') return handleSampleRequest(phone, name);

  const convo = await getConversation(phone, CH);

  // Bulk flow: after MOQ + qty we asked for location
  if (location && convo.step === 'bulk_awaiting_location') {
    return finishBulk(phone, convo, location);
  }

  // Default: re-show welcome
  return sendWelcome(phone, name);
}

async function handleFlowResponse(phone, resp, name) {
  const token = resp.flow_token || '';

  // Service flow completed. Dealer registration now runs INSIDE this flow, so a
  // completion carrying business details means dealer signup finished; otherwise
  // it's a plain service pick (bulk/gifting/export/already_dealer) to route.
  // Every B2B service now completes from the single Choose Service flow. Route by
  // the payload we get back (each service tags its completion or carries unique fields).
  if (token.startsWith('b2b_service_')) {
    // Dealer registration finished inside the flow
    if (resp.confirmed || resp.summary_business || resp.business_name) {
      return finishDealer(phone, resp, name);
    }
    // Bulk: range + quantity captured -> ask for delivery location next
    if (resp.service === 'bulk' || resp.product_range) {
      const ctx = {
        bulk_range: resp.product_range,
        bulk_label: resp.product_label || '',
        bulk_qty: resp.quantity,
        name: resp.name || name || '',
        contactPhone: resp.contact_phone || '',
        email: resp.email || ''
      };
      await patchContext(phone, CH, ctx);
      await setStep(phone, CH, 'bulk_awaiting_location', ctx);
      const locImg = await getAsset(ASSET_KEYS.BULK_HEADER);
      if (locImg) await wa().sendImage(phone, locImg, 'Great! One last step.').catch(() => {});
      return wa().sendLocationRequest(phone, '📍 Please share your location so we can arrange dispatch and pricing.');
    }
    // Corporate gifting
    if (resp.service === 'gifting' || resp.hampers) {
      return finishGifting(phone, resp, name);
    }
    // Export / international
    if (resp.service === 'export' || resp.products_required || resp.country_of_import) {
      return finishExport(phone, resp, name);
    }
    // "Already a Dealer - Profile" or any plain service pick
    if (resp.selected_service) {
      return routeService(phone, resp.selected_service, name);
    }
  }

  return sendWelcome(phone, name);
}

async function routeService(phone, service, name) {
  switch (service) {
    case 'dealer':
      return startDealer(phone, name);
    case 'already_dealer':
      return showDealerProfile(phone);
    case 'bulk':
      return startBulk(phone, name);
    case 'gifting':
      return startGifting(phone, name);
    case 'export':
      return startExport(phone, name);
    default:
      return sendWelcome(phone, name);
  }
}

// ---------- DEALER ----------
// Dealer registration runs INSIDE the Choose Service flow. This handler is only
// reached via the non-flow list fallback, so we capture interest and point the
// user back to Choose Service.
async function startDealer(phone, name) {
  await setStep(phone, CH, 'awaiting_service', { name });
  const lead = await Lead.create({
    channel: CH,
    type: 'dealer',
    name: name || '',
    phone,
    details: { via: 'fallback_interest' }
  });
  emitLead(lead);
  return wa().sendCtaUrl(
    phone,
    'Thanks for your interest in becoming a Devine dealer! 🌿\n\nTap *Choose Service* → *Become a Dealer* to complete a quick registration. Our team will also reach out shortly.',
    'Choose Service',
    serviceDeepLink()
  );
}

async function finishDealer(phone, resp, name) {
  const businessName = resp.summary_business || resp.business_name || '';
  const businessType = resp.summary_type || resp.business_type || '';
  const capacity = resp.summary_capacity || resp.capacity || '';
  // summary_location is "City, District, State" — split back out where possible.
  const [city = '', district = '', state = ''] = (resp.summary_location || '').split(',').map((s) => s.trim());

  const lead = await Lead.create({
    channel: CH,
    type: 'dealer',
    name: name || '',
    phone,
    businessName,
    businessType,
    state: resp.state || state,
    district: resp.district || district,
    city: resp.city || city,
    capacity,
    details: resp
  });
  emitLead(lead);

  // Register/refresh the dealer profile so the "Already a Dealer" path works.
  // A Devine Dealer ID is issued here; admin can later assign an area manager.
  try {
    const existing = await DealerProfile.findOne({ phone });
    await DealerProfile.findOneAndUpdate(
      { phone },
      {
        $set: {
          phone,
          name: name || existing?.name || '',
          businessName,
          businessType,
          state: resp.state || state,
          district: resp.district || district,
          city: resp.city || city,
          capacity,
          status: 'Active'
        },
        $setOnInsert: { dealerId: genDealerId() }
      },
      { new: true, upsert: true }
    );
  } catch (err) {
    logger.warn('DealerProfile upsert failed', { phone, error: err.message });
  }

  const pdf = await getAsset(ASSET_KEYS.DEALER_PDF);
  const displayName = name || resp.summary_business || 'there';
  const body =
    `Thank you ${displayName}! Here is our complete dealer information:\n\n` +
    '*Our dealer margin ranges from 20-35% depending on product and volume.*\n\n' +
    '*A Devine team member will call you within 2 hours to discuss your requirements.*\n\n' +
    "Meanwhile, here's what dealers say about us:\n\n" +
    '⭐⭐⭐⭐⭐ *"Best margins and fastest dispatch." - Karthik, Coimbatore*\n' +
    '⭐⭐⭐⭐⭐ *"Genuine natural products, great support." - Meera, Madurai*';

  await setStep(phone, CH, 'dealer_done');

  if (pdf) {
    return wa().sendDocumentWithCtaUrl(
      phone,
      pdf,
      'Devine-Dealer-Info.pdf',
      body,
      'Choose Service',
      serviceDeepLink(),
      'Devine Natural Foods'
    ).catch(() => wa().sendText(phone, body));
  }
  return wa().sendText(phone, body);
}

async function showDealerProfile(phone) {
  const dealer = await DealerProfile.findOne({ phone });
  if (!dealer) return sendWelcome(phone);
  const table =
    '📋 *Your Dealer Profile*\n' +
    '━━━━━━━━━━━━━━━\n' +
    `*Dealer ID:*  ${dealer.dealerId || '-'}\n` +
    `*Name:*  ${dealer.name || '-'}\n` +
    `*Business:*  ${dealer.businessName || '-'}\n` +
    `*Type:*  ${dealer.businessType || '-'}\n` +
    `*Location:*  ${[dealer.city, dealer.district, dealer.state].filter(Boolean).join(', ')}\n` +
    `*Capacity:*  ${dealer.capacity || '-'}\n` +
    `*Area Manager:*  ${dealer.areaManagerName || '-'} ${dealer.areaManagerPhone ? '(' + dealer.areaManagerPhone + ')' : ''}\n` +
    `*Status:*  ${dealer.status}\n` +
    '━━━━━━━━━━━━━━━';
  return wa().sendButtons(phone, table, [{ id: 'menu', text: 'Main Menu' }]);
}

// ---------- BULK ----------
async function startBulk(phone, name) {
  const fId = flowId('b2b_bulk');
  const ranges = [
    { id: 'honey', title: 'Honey Range - MOQ 50/variant' },
    { id: 'gulkand', title: 'Gulkand Range - MOQ 50/variant' },
    { id: 'dryfruits', title: 'Dry Fruits - MOQ 25 kg' },
    { id: 'narumanam', title: 'Narumanam - MOQ 100/variant' }
  ];
  await setStep(phone, CH, 'bulk_flow', { name });
  if (!fId) {
    return wa().sendList(phone, 'Bulk / Wholesale', 'Select a product range (MOQ applies).', 'Select', [
      { title: 'Ranges', rows: ranges }
    ]);
  }
  return wa().sendFlowMessage(phone, {
    flowId: fId,
    flowCta: 'Start',
    bodyText: 'For bulk orders, our minimum order quantities are listed inside. Select a range and quantity.',
    headerText: 'Bulk / Wholesale',
    screenName: 'BULK_ORDER',
    screenData: { ranges },
    flowToken: `b2b_bulk_${clean(phone)}`,
    flowAction: 'navigate'
  });
}

async function finishBulk(phone, convo, location) {
  const range = convo.context?.bulk_range || '';
  const qty = convo.context?.bulk_qty || '';
  const custName = convo.context?.name || '';
  const contactPhone = convo.context?.contactPhone || '';
  const email = convo.context?.email || '';
  // Prefer WhatsApp's address; else reverse-geocode the shared coordinates.
  const address = await resolveLocationAddress(location);
  const rangeLabel = convo.context?.bulk_label || (await bulkRangeLabel(range));

  const lead = await Lead.create({
    channel: CH,
    type: 'bulk',
    name: custName,
    phone,
    email,
    details: { range, rangeLabel, quantity: qty, contactPhone, email, location, address }
  });
  emitLead(lead);

  const header = await getAsset(ASSET_KEYS.BULK_HEADER);
  const body =
    '✅ *Bulk Enquiry Received*\n\n' +
    `*Product:* ${rangeLabel}\n` +
    `*Quantity:* ${qty}\n` +
    (contactPhone ? `*Phone:* ${contactPhone}\n` : '') +
    (email ? `*Email:* ${email}\n` : '') +
    `*Location:* ${address}\n\n` +
    'Our team will contact you shortly with pricing and dispatch details.';
  await setStep(phone, CH, 'awaiting_service');
  const buttons = [{ id: 'menu', text: 'Choose Service' }];
  if (header) return wa().sendImageWithButtons(phone, header, body, buttons);
  return wa().sendButtons(phone, body, buttons);
}

// Resolve a bulk range slug to a readable "Name - MOQ" label (admin-managed,
// with a fallback to the legacy static labels).
async function bulkRangeLabel(slug) {
  if (!slug) return '';
  const r = await BulkRange.findOne({ slug }).lean().catch(() => null);
  if (r) return r.moq ? `${r.name} - ${r.moq}` : r.name;
  return labelRange(slug);
}

// ---------- GIFTING ----------
async function startGifting(phone, name) {
  const fId = flowId('b2b_gifting');
  await setStep(phone, CH, 'gifting_flow', { name });
  const intro =
    '🎁 *Devine Corporate Gifting - Premium Natural Gift Hampers*\n\n' +
    'We create custom gift hampers for:\n' +
    '✅ Diwali & Festival Gifting\n' +
    '✅ Client Appreciation Gifts\n' +
    '✅ Employee Wellness Hampers\n' +
    '✅ Wedding Favours (Bulk)\n\n' +
    'Our hampers start from Rs.299 per unit (MOQ: 50 units).';
  if (!fId) return wa().sendText(phone, intro + '\n\nReply with hampers count, budget, delivery date, company.');
  return wa().sendFlowMessage(phone, {
    flowId: fId,
    flowCta: 'Get a Quote',
    bodyText: intro,
    headerImageUrl: (await getAsset(ASSET_KEYS.GIFTING_HEADER)) || undefined,
    headerText: 'Corporate Gifting',
    screenName: 'GIFTING',
    flowToken: `b2b_gifting_${clean(phone)}`,
    flowAction: 'navigate'
  });
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
  const pdf = await getAsset(ASSET_KEYS.GIFTING_PDF);
  const body =
    `Thank you! We've received your corporate gifting request for *${resp.hampers}* hampers.\n\n` +
    'Our gifting specialist will share a custom catalogue and quote shortly.';
  await setStep(phone, CH, 'awaiting_service');
  if (pdf) {
    return wa().sendDocumentWithCtaUrl(phone, pdf, 'Devine-Gifting-Catalogue.pdf', body, 'Choose Service', serviceDeepLink())
      .catch(() => wa().sendText(phone, body));
  }
  return wa().sendCtaUrl(phone, body, 'Choose Service', serviceDeepLink());
}

// ---------- EXPORT ----------
async function startExport(phone, name) {
  const fId = flowId('b2b_export');
  const countries = await SupplyCountry.find({ active: true }).sort({ order: 1 }).lean();
  const options = [
    { id: 'enquiry', title: 'Enquiry' },
    ...countries.map((c) => ({ id: String(c._id), title: c.name }))
  ];
  await setStep(phone, CH, 'export_flow', { name });
  if (!fId) {
    return wa().sendList(phone, 'Export / International', 'Select a country or make an enquiry.', 'Select', [
      { title: 'Countries', rows: options.slice(0, 10) }
    ]);
  }
  return wa().sendFlowMessage(phone, {
    flowId: fId,
    flowCta: 'Start',
    bodyText: 'Select a destination country or make a general enquiry. Our export team responds within 24 hours.',
    headerImageUrl: (await getAsset(ASSET_KEYS.EXPORT_HEADER)) || undefined,
    headerText: 'Export / International Supply',
    screenName: 'COUNTRY_SELECT',
    screenData: { countries: options },
    flowToken: `b2b_export_${clean(phone)}`,
    flowAction: 'data_exchange'
  });
}

async function finishExport(phone, resp, name) {
  const lead = await Lead.create({
    channel: CH,
    type: 'export',
    name: name || '',
    phone,
    details: resp
  });
  emitLead(lead);
  const header = await getAsset(ASSET_KEYS.EXPORT_HEADER);
  const body = '🌍 Thank you! *Our export team will respond within 24 hours.*';
  await setStep(phone, CH, 'awaiting_service');
  const buttons = [{ id: 'menu', text: 'Choose Service' }];
  if (header) return wa().sendImageWithButtons(phone, header, body, buttons);
  return wa().sendButtons(phone, body, buttons);
}

// ---------- ORDER / SAMPLE (from broadcast reply buttons) ----------
async function handleOrderIntent(phone, name) {
  await setStep(phone, CH, 'placing_order');
  const lead = await Lead.create({
    channel: CH,
    type: 'order',
    name: name || '',
    phone,
    details: { via: 'reply_button' }
  });
  emitLead(lead);
  return wa().sendText(
    phone,
    '🛒 *Place your order*\n\n' +
      'Reply in this format:\n*Product Name | Quantity | Delivery Address*\n\n' +
      'We confirm within 2 hours and dispatch within 48 hours. For urgent orders, call your area manager.'
  );
}

async function handleSampleRequest(phone, name) {
  await setStep(phone, CH, 'sample_requested');
  const lead = await Lead.create({
    channel: CH,
    type: 'sample',
    name: name || '',
    phone,
    details: { via: 'reply_button' }
  });
  emitLead(lead);
  const header = await getAsset(ASSET_KEYS.LEAD_THANKS_HEADER);
  const body = '🎁 Thank you! *Our team will contact you shortly* to arrange your free sample.';
  const buttons = [{ id: 'menu', text: 'Choose Service' }];
  if (header) return wa().sendImageWithButtons(phone, header, body, buttons);
  return wa().sendButtons(phone, body, buttons);
}

// ---------- helpers ----------
function labelRange(id) {
  return (
    {
      honey: 'Honey Range',
      gulkand: 'Gulkand Range',
      dryfruits: 'Dry Fruits',
      narumanam: 'Narumanam'
    }[id] || id
  );
}

function serviceDeepLink() {
  const num = process.env.WA_B2B_DISPLAY_NUMBER || '';
  return num ? `https://wa.me/${num.replace(/\D/g, '')}?text=hi` : 'https://wa.me/';
}

function clean(phone) {
  return String(phone || '').replace(/\D/g, '');
}

export default { sendWelcome, handle };
