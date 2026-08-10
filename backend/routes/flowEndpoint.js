import express from 'express';
import { decryptRequest, encryptResponse } from '../services/flowCrypto.js';
import { districtOptions, stateOptions } from '../data/geo.js';
import Product from '../models/Product.js';
import SupplyCountry from '../models/SupplyCountry.js';
import Category from '../models/Category.js';
import { getAsset, getAssets, ASSET_KEYS } from '../services/assets.js';
import { urlToBase64 } from '../services/imageBase64.js';
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

    // INIT — first screen open. Branch by flow token (dealer vs export).
    if (action === 'INIT') {
      if (token.startsWith('b2b_export_')) {
        return sendEncrypted(res, { screen: 'COUNTRY_SELECT', data: { countries: await countryOptions() } }, aesKeyBuffer, initialVectorBuffer);
      }
      if (token.startsWith('b2c_service_')) {
        const welcomeBannerB64 = await getWelcomeBannerB64();
        const services = await serviceOptions();
        return sendEncrypted(
          res,
          {
            screen: 'SERVICE_MENU',
            data: {
              welcome_banner: welcomeBannerB64 || '',
              has_welcome_banner: !!welcomeBannerB64,
              services
            }
          },
          aesKeyBuffer,
          initialVectorBuffer
        );
      }
      // Dealer flow starts on business name.
      return sendEncrypted(res, { screen: 'BUSINESS_NAME', data: {} }, aesKeyBuffer, initialVectorBuffer);
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
    if (!bannerUrl) return '';
    return await urlToBase64(bannerUrl, { width: 1000, height: 125, crop: 'fill', format: 'jpg' });
  } catch (_) {
    return '';
  }
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
      rawUrl: assets[ASSET_KEYS.B2C_ICON_BROWSE] || 'https://img.icons8.com/color/120/shopping-bag--v1.png'
    },
    {
      id: 'gifting',
      title: 'Corporate / Bulk gifting',
      description: 'Custom hampers starting from Rs.299 (MOQ: 50)',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_GIFTING] || 'https://img.icons8.com/color/120/gift--v1.png'
    },
    {
      id: 'track',
      title: 'Track Order',
      description: 'Live delivery status & map tracking',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_TRACK] || 'https://img.icons8.com/color/120/deliver-food.png'
    },
    {
      id: 'talk',
      title: 'Talk to us',
      description: 'Chat or call with customer support',
      rawUrl: assets[ASSET_KEYS.B2C_ICON_TALK] || 'https://img.icons8.com/color/120/headset.png'
    }
  ];

  return Promise.all(
    items.map(async (item) => {
      const b64 = await urlToBase64(item.rawUrl, { width: 200, height: 200, crop: 'fill', format: 'png' });
      const { rawUrl, ...rest } = item;
      if (b64) rest.image = b64;
      return rest;
    })
  );
}

// Build the export country dropdown: an "Enquiry" option first, then admin-managed countries.
async function countryOptions() {
  const list = await SupplyCountry.find({ active: true }).sort({ order: 1 }).lean();
  return [{ id: 'enquiry', title: 'Enquiry (General)' }, ...list.map((c) => ({ id: String(c._id), title: c.name }))];
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
      const rawUrl = c.imageUrl || 'https://img.icons8.com/color/120/ingredients.png';
      const b64 = await urlToBase64(rawUrl, { width: 200, height: 200, crop: 'fill', format: 'png' });
      const item = {
        id: c.slug,
        title: c.name,
        description: countMap[c.name] ? `${countMap[c.name]} product(s) available` : 'Explore fresh natural products'
      };
      if (b64) item.image = b64;
      return item;
    })
  );
}

async function handleDataExchange(screen, data, token = '') {
  switch (screen) {
    // B2C service selection: browse -> show categories screen; else -> finish flow.
    case 'SERVICE_MENU': {
      const service = data.selected_service;
      if (service === 'browse') {
        const welcomeBannerB64 = await getWelcomeBannerB64();
        return {
          screen: 'CATEGORY_SELECT',
          data: {
            welcome_banner: welcomeBannerB64 || '',
            has_welcome_banner: !!welcomeBannerB64,
            categories: await categoryOptions()
          }
        };
      }
      // Non-browse services complete the flow immediately (returns via nfm_reply).
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
