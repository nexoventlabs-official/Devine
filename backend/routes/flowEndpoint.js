import express from 'express';
import { decryptRequest, encryptResponse } from '../services/flowCrypto.js';
import { districtOptions, stateOptions } from '../data/geo.js';
import Product from '../models/Product.js';
import SupplyCountry from '../models/SupplyCountry.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import DealerProfile from '../models/DealerProfile.js';
import BulkRange from '../models/BulkRange.js';
import { getAsset, getAssets, ASSET_KEYS } from '../services/assets.js';
import { urlToBase64 } from '../services/imageBase64.js';
import { DEFAULT_BANNER_B64, DEFAULT_ICON_B64 } from '../services/defaultFlowAssets.js';
import logger from '../services/logger.js';

const router = express.Router();

// Meta posts the raw encrypted envelope here. We must respond with a base64 string.
router.post('/', async (req, res) => {
  let aesKeyBuffer, initialVectorBuffer, decrypted;
  try {
    ({ decrypted, aesKeyBuffer, initialVectorBuffer } = decryptRequest(req.body));
  } catch (err) {
    logger.error('Flow endpoint decrypt failed', { error: err.message });
    // 421 tells Meta to refresh the public key.
    return res.status(421).send();
  }

  try {
    const { action, screen, data = {}, flow_token, version } = decrypted;
    const token = flow_token || data.flow_token || '';

    // Health check ping from Meta
    if (action === 'ping') {
      return sendEncrypted(res, { data: { status: 'active' } }, aesKeyBuffer, initialVectorBuffer);
    }

    // INIT — first screen open. Branch by flow token (export vs dealer vs B2C service).
    if (action === 'INIT') {
      if (token.startsWith('b2b_export_')) {
        return sendEncrypted(res, { screen: 'COUNTRY_SELECT', data: { countries: await countryOptions() } }, aesKeyBuffer, initialVectorBuffer);
      }
      // B2B service menu (banner + 1:1 service logos). Dealer status decides the first option.
      if (token.startsWith('b2b_service_')) {
        const phone = token.replace(/^b2b_service_/, '');
        const { b64: banner, hasBanner } = await getB2bBannerB64();
        return sendEncrypted(
          res,
          {
            screen: 'CHOOSE_SERVICE',
            data: {
              welcome_banner: banner,
              has_welcome_banner: hasBanner,
              heading: 'How can we help your business?',
              subheading: 'Select a service below to continue',
              services: await b2bServiceOptions(phone)
            }
          },
          aesKeyBuffer,
          initialVectorBuffer
        );
      }
      if (token.startsWith('b2b_dealer_') || token.startsWith('b2b_')) {
        return sendEncrypted(res, { screen: 'BUSINESS_NAME', data: {} }, aesKeyBuffer, initialVectorBuffer);
      }
      // B2C service menu (default for b2c_service_... or any welcome flow token)
      const { b64: welcomeBannerB64, hasBanner } = await getWelcomeBannerB64();
      const services = await serviceOptions();
      return sendEncrypted(
        res,
        {
          screen: 'SERVICE_MENU',
          data: {
            welcome_banner: welcomeBannerB64,
            has_welcome_banner: hasBanner,
            heading: 'Welcome to Devine Natural Foods 🌿',
            subheading: 'Select a service below to explore',
            services
          }
        },
        aesKeyBuffer,
        initialVectorBuffer
      );
    }

    if (action === 'data_exchange') {
      const response = await handleDataExchange(screen, data, token);
      return sendEncrypted(res, response, aesKeyBuffer, initialVectorBuffer);
    }

    // Fallback
    return sendEncrypted(res, { data: {} }, aesKeyBuffer, initialVectorBuffer);
  } catch (err) {
    logger.error('Flow endpoint processing error', { error: err.message, stack: err.stack });
    return sendEncrypted(
      res,
      { screen: 'BUSINESS_NAME', data: { error_message: 'Something went wrong. Please try again.' } },
      aesKeyBuffer,
      initialVectorBuffer
    );
  }
});

async function getWelcomeBannerB64() {
  try {
    const bannerUrl = await getAsset(ASSET_KEYS.WELCOME_BANNER_B2C);
    if (bannerUrl) {
      const b64 = await urlToBase64(bannerUrl, { width: 350, height: 44, crop: 'fill', quality: 25, format: 'jpg' });
      if (b64) return { b64, hasBanner: true };
    }
  } catch (_) {}
  return { b64: '', hasBanner: false };
}

// B2B welcome banner (8:1) as base64 for the CHOOSE_SERVICE screen.
async function getB2bBannerB64() {
  try {
    const bannerUrl = await getAsset(ASSET_KEYS.WELCOME_BANNER_B2B);
    if (bannerUrl) {
      const b64 = await urlToBase64(bannerUrl, { width: 350, height: 44, crop: 'fill', quality: 25, format: 'jpg' });
      if (b64) return { b64, hasBanner: true };
    }
  } catch (_) {}
  return { b64: '', hasBanner: false };
}

// Build the B2B service list with 1:1 logos. If the phone is already a dealer,
// the first option becomes "Already a Dealer - Profile".
async function b2bServiceOptions(phone) {
  const isDealer = phone ? !!(await DealerProfile.findOne({ phone }).lean().catch(() => null)) : false;
  const assets = await getAssets([
    ASSET_KEYS.B2B_ICON_DEALER,
    ASSET_KEYS.B2B_ICON_BULK,
    ASSET_KEYS.B2B_ICON_GIFTING,
    ASSET_KEYS.B2B_ICON_EXPORT
  ]);

  const items = [
    isDealer
      ? { id: 'already_dealer', title: 'Already a Dealer - Profile', description: 'View your dealer profile', rawUrl: assets[ASSET_KEYS.B2B_ICON_DEALER] || '' }
      : { id: 'dealer', title: 'Become a Dealer / Distributor', description: 'Get dealer pricing & product catalogue', rawUrl: assets[ASSET_KEYS.B2B_ICON_DEALER] || '' },
    { id: 'bulk', title: 'Bulk / Wholesale Enquiry', description: 'Volume orders at wholesale rates', rawUrl: assets[ASSET_KEYS.B2B_ICON_BULK] || '' },
    { id: 'gifting', title: 'Corporate Gifting (B2B)', description: 'Custom premium gift hampers', rawUrl: assets[ASSET_KEYS.B2B_ICON_GIFTING] || '' },
    { id: 'export', title: 'Export / International Supply', description: 'Ship Devine products worldwide', rawUrl: assets[ASSET_KEYS.B2B_ICON_EXPORT] || '' }
  ];

  return Promise.all(
    items.map(async ({ rawUrl, ...rest }) => {
      if (rawUrl) {
        try {
          const b64 = await urlToBase64(rawUrl, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
          if (b64) rest.image = b64;
        } catch (_) {}
      }
      return rest;
    })
  );
}

// Build 1:1 ratio icon options for B2C service menu (raw base64 format required for Meta Flow)
async function serviceOptions() {
  const assets = await getAssets([
    ASSET_KEYS.B2C_ICON_BROWSE,
    ASSET_KEYS.B2C_ICON_GIFTING,
    ASSET_KEYS.B2C_ICON_TRACK,
    ASSET_KEYS.B2C_ICON_TALK
  ]);

  const items = [
    {
      id: 'browse',
      title: 'Browse our products',
      description: 'Explore natural food items, honey, ghee & spices',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_BROWSE] || ''
    },
    {
      id: 'gifting',
      title: 'Corporate / Bulk gifting',
      description: 'Custom hampers starting from Rs.299 (MOQ: 50)',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_GIFTING] || ''
    },
    {
      id: 'track',
      title: 'Track Order',
      description: 'Live delivery status & map tracking',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_TRACK] || ''
    },
    {
      id: 'talk',
      title: 'Talk to us',
      description: 'Chat or call with customer support',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_TALK] || ''
    }
  ];

  return Promise.all(
    items.map(async (item) => {
      const { rawUrl, ...rest } = item;
      if (rawUrl) {
        try {
          const b64 = await urlToBase64(rawUrl, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
          if (b64) rest.image = b64;
        } catch (_) {}
      }
      return rest;
    })
  );
}

// Order status -> label + 1:1 logo asset key (uploaded in admin Flow Images).
const STATUS_META = {
  pending: { label: 'Pending', key: ASSET_KEYS.ORDER_STATUS_PENDING },
  confirmed: { label: 'Confirmed', key: ASSET_KEYS.ORDER_STATUS_CONFIRMED },
  packed: { label: 'Packed', key: ASSET_KEYS.ORDER_STATUS_PACKED },
  dispatched: { label: 'Dispatched', key: ASSET_KEYS.ORDER_STATUS_DISPATCHED },
  out_for_delivery: { label: 'Out for Delivery', key: ASSET_KEYS.ORDER_STATUS_OUT_FOR_DELIVERY },
  delivered: { label: 'Delivered', key: ASSET_KEYS.ORDER_STATUS_DELIVERED },
  cancelled: { label: 'Cancelled', key: ASSET_KEYS.ORDER_STATUS_CANCELLED }
};

const _statusLogoCache = {};
async function statusLogoB64(status) {
  const meta = STATUS_META[status] || STATUS_META.confirmed;
  const cached = _statusLogoCache[status];
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.b64;
  let b64 = '';
  try {
    const url = await getAsset(meta.key);
    if (url) b64 = await urlToBase64(url, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
  } catch (_) {}
  _statusLogoCache[status] = { b64, at: Date.now() };
  return b64;
}

// Build the customer's order list for the in-flow Track Order screen.
async function orderOptions(phone) {
  const orders = await Order.find({ 'customer.phone': phone }).sort({ createdAt: -1 }).limit(10).lean();
  return Promise.all(
    orders.map(async (o) => {
      const meta = STATUS_META[o.status] || STATUS_META.confirmed;
      const item = {
        id: o.trackId || o.orderId,
        title: `${o.orderId} - Rs.${o.totalAmount}`,
        description: `${meta.label} - ${new Date(o.createdAt).toLocaleDateString('en-IN')}`
      };
      const b64 = await statusLogoB64(o.status);
      if (b64) item.image = b64;
      return item;
    })
  );
}

// Readable "Name - MOQ" label for a bulk range slug (admin-managed, with defaults).
async function bulkRangeLabelFor(slug) {
  if (!slug) return '';
  const r = await BulkRange.findOne({ slug }).lean().catch(() => null);
  if (r) return r.moq ? `${r.name} - ${r.moq}` : r.name;
  const defaults = {
    honey: 'Honey Range - MOQ 50/variant',
    gulkand: 'Gulkand Range - MOQ 50/variant',
    dryfruits: 'Dry Fruits - MOQ 25 kg',
    narumanam: 'Narumanam - MOQ 100/variant'
  };
  return defaults[slug] || slug;
}

// Bulk/wholesale product ranges (admin-managed) with 1:1 base64 logos for the flow.
async function bulkRangeOptions() {
  const ranges = await BulkRange.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
  if (!ranges.length) {
    // Sensible defaults if the admin hasn't configured any ranges yet.
    return [
      { id: 'honey', title: 'Honey Range', description: 'MOQ 50/variant' },
      { id: 'gulkand', title: 'Gulkand Range', description: 'MOQ 50/variant' },
      { id: 'dryfruits', title: 'Dry Fruits', description: 'MOQ 25 kg' },
      { id: 'narumanam', title: 'Narumanam', description: 'MOQ 100/variant' }
    ];
  }
  return Promise.all(
    ranges.map(async (r) => {
      const item = { id: r.slug || String(r._id), title: r.name, description: r.moq || '' };
      if (r.imageUrl) {
        try {
          const b64 = await urlToBase64(r.imageUrl, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
          if (b64) item.image = b64;
        } catch (_) {}
      }
      return item;
    })
  );
}

// Build the export country dropdown: an "Enquiry" option first, then admin-managed
// countries — each with its 1:1 logo (raw base64) so the Dropdown renders thumbnails.
async function countryOptions() {
  const list = await SupplyCountry.find({ active: true }).sort({ order: 1 }).lean();
  const items = await Promise.all(
    list.map(async (c) => {
      const item = { id: String(c._id), title: c.name };
      if (c.logoUrl) {
        try {
          const b64 = await urlToBase64(c.logoUrl, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
          if (b64) item.image = b64;
        } catch (_) {}
      }
      return item;
    })
  );
  return [{ id: 'enquiry', title: 'Enquiry (General)' }, ...items];
}

// Categories for the B2C browse flow with 1:1 image thumbnails in raw base64
async function categoryOptions() {
  let cats = await Category.find({ active: true }).sort({ order: 1 }).lean();
  if (!cats.length) {
    const names = (await Product.distinct('category', { active: true, inStock: true })).filter(Boolean);
    const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    cats = [];
    for (let i = 0; i < names.length; i++) {
      const slug = slugify(names[i]);
      try {
        await Category.findOneAndUpdate(
          { name: names[i] },
          { $setOnInsert: { name: names[i], slug, order: i, active: true } },
          { upsert: true }
        );
      } catch (_) { /* ignore */ }
      cats.push({ slug, name: names[i], imageUrl: '' });
    }
  }

  const products = await Product.find({ active: true, inStock: true }).select('category').lean();
  const countMap = {};
  products.forEach((p) => {
    if (p.category) countMap[p.category] = (countMap[p.category] || 0) + 1;
  });

  return Promise.all(
    cats.map(async (c) => {
      const item = {
        id: c.slug,
        title: c.name,
        description: countMap[c.name] ? `${countMap[c.name]} product(s) available` : 'Explore fresh natural products'
      };
      if (c.imageUrl) {
        try {
          const b64 = await urlToBase64(c.imageUrl, { width: 60, height: 60, crop: 'fill', quality: 25, format: 'jpg' });
          if (b64) item.image = b64;
        } catch (_) {}
      }
      return item;
    })
  );
}

async function handleDataExchange(screen, data, token = '') {
  switch (screen) {
    // B2B service selection: route to the chosen service's screens within the same flow.
    case 'CHOOSE_SERVICE': {
      const service = data.selected_service;
      if (service === 'dealer') {
        return { screen: 'BUSINESS_NAME', data: {} };
      }
      if (service === 'bulk') {
        return { screen: 'BULK_ORDER', data: { ranges: await bulkRangeOptions() } };
      }
      if (service === 'gifting') {
        const phone = token.replace(/^b2b_service_/, '');
        return { screen: 'GIFTING', data: { wa_number: `+${phone}` } };
      }
      if (service === 'export') {
        return { screen: 'COUNTRY_SELECT', data: { countries: await countryOptions() } };
      }
      // already_dealer (or anything else) -> finish flow; chatbot routes next.
      return {
        screen: 'SUCCESS',
        data: { extension_message_response: { params: { flow_token: token, selected_service: service } } }
      };
    }

    // Bulk: range chosen -> quantity + contact details (WhatsApp number prefilled).
    case 'BULK_ORDER': {
      const phone = token.replace(/^b2b_service_/, '');
      const product_label = await bulkRangeLabelFor(data.product_range || '');
      return { screen: 'BULK_DETAILS', data: { product_range: data.product_range || '', product_label, wa_number: `+${phone}` } };
    }

    // B2C service selection: browse -> show categories screen; else -> finish flow.
    case 'SERVICE_MENU': {
      const service = data.selected_service;
      if (service === 'browse') {
        return {
          screen: 'CATEGORY_SELECT',
          data: {
            // No banner on the category screen (per design) — hide the Image component.
            welcome_banner: '',
            has_welcome_banner: false,
            heading: '🛍️ Select a Category',
            subheading: 'Tap a category below to explore our products',
            categories: await categoryOptions()
          }
        };
      }
      if (service === 'gifting') {
        // Corporate / bulk gifting details captured within the same flow.
        const phone = token.replace(/^b2c_service_/, '');
        return { screen: 'GIFTING', data: { wa_number: `+${phone}` } };
      }
      if (service === 'track') {
        // Phone is embedded in the flow token: b2c_service_<phone>
        const phone = token.replace(/^b2c_service_/, '');
        const orders = await orderOptions(phone);
        if (!orders.length) {
          return {
            screen: 'SUCCESS',
            data: { extension_message_response: { params: { flow_token: token, selected_service: 'track', no_orders: true } } }
          };
        }
        return {
          screen: 'TRACK_ORDERS',
          data: {
            welcome_banner: '',
            has_welcome_banner: false,
            heading: '📦 Your Orders',
            subheading: 'Select an order to see live tracking',
            orders
          }
        };
      }
      // Other services (gifting/talk) complete the flow immediately (returns via nfm_reply).
      return {
        screen: 'SUCCESS',
        data: { extension_message_response: { params: { flow_token: token, selected_service: service } } }
      };
    }

    // Dealer flow: business name captured -> go to state select WITH the states list.
    case 'BUSINESS_NAME':
      return { screen: 'STATE_SELECT', data: { states: stateOptions() } };

    // Dealer flow: state chosen -> return districts for that state
    case 'STATE_SELECT': {
      const districts = districtOptions(data.state);
      return {
        screen: 'DISTRICT_CITY',
        data: { districts: districts.length ? districts : [{ id: 'other', title: 'Other' }] }
      };
    }

    // Dealer flow: district + city captured -> business profile screen
    case 'DISTRICT_CITY':
      return { screen: 'BUSINESS_PROFILE', data: {} };

    // Dealer flow: build the summary strings for the confirm screen
    case 'BUSINESS_PROFILE': {
      const typeMap = {
        retail: 'Retail Shop',
        wholesale: 'Wholesale Distributor',
        online: 'Online Seller (Amazon/Flipkart)',
        supermarket: 'Supermarket / Modern Trade',
        other: 'Other'
      };
      const capMap = {
        below_10k: 'Below Rs.10,000',
        '10k_50k': 'Rs.10,000 - Rs.50,000',
        '50k_2l': 'Rs.50,000 - Rs.2,00,000',
        above_2l: 'Above Rs.2,00,000'
      };
      return {
        screen: 'SUMMARY',
        data: {
          summary_business: data.business_name || '',
          summary_location: [data.city, data.district, data.state].filter(Boolean).join(', '),
          summary_type: typeMap[data.business_type] || data.business_type || '',
          summary_capacity: capMap[data.capacity] || data.capacity || ''
        }
      };
    }

    // Export flow: country chosen (or "enquiry") -> details screen with product list
    case 'COUNTRY_SELECT': {
      const products = await Product.find({ active: true }).select('name retailerId').lean();
      const productOptions = products.map((p) => ({ id: p.retailerId, title: p.name }));
      let countryLabel = 'Enquiry';
      let prefillCountry = ''; // for a specific country we prefill so we don't re-ask
      const isEnquiry = !data.country || data.country === 'enquiry';
      if (!isEnquiry) {
        const c = await SupplyCountry.findById(data.country).lean().catch(() => null);
        countryLabel = c?.name || data.country;
        prefillCountry = countryLabel;
      }
      return {
        screen: 'EXPORT_DETAILS',
        data: {
          products: productOptions.length ? productOptions : [{ id: 'general', title: 'General' }],
          country_label: countryLabel,
          country_of_import: prefillCountry,
          is_enquiry: isEnquiry
        }
      };
    }

    default:
      return { data: {} };
  }
}

function sendEncrypted(res, obj, aesKeyBuffer, initialVectorBuffer) {
  const encrypted = encryptResponse(obj, aesKeyBuffer, initialVectorBuffer);
  res.type('text/plain').send(encrypted);
}

export default router;
