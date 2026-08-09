import express from 'express';
import { decryptRequest, encryptResponse } from '../services/flowCrypto.js';
import { districtOptions } from '../data/geo.js';
import Product from '../models/Product.js';
import SupplyCountry from '../models/SupplyCountry.js';
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
    const { action, screen, data = {}, version } = decrypted;

    // Health check ping from Meta
    if (action === 'ping') {
      return sendEncrypted(res, { data: { status: 'active' } }, aesKeyBuffer, initialVectorBuffer);
    }

    // INIT — first screen open (we mostly use navigate, so return empty data)
    if (action === 'INIT') {
      return sendEncrypted(res, { screen: 'BUSINESS_NAME', data: {} }, aesKeyBuffer, initialVectorBuffer);
    }

    if (action === 'data_exchange') {
      const response = await handleDataExchange(screen, data);
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

async function handleDataExchange(screen, data) {
  switch (screen) {
    // Dealer flow: business name captured -> go to state select (states embedded statically)
    case 'BUSINESS_NAME':
      return { screen: 'STATE_SELECT', data: {} };

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
      if (data.country && data.country !== 'enquiry') {
        const c = await SupplyCountry.findById(data.country).lean().catch(() => null);
        countryLabel = c?.name || data.country;
      }
      return {
        screen: 'EXPORT_DETAILS',
        data: {
          products: productOptions.length ? productOptions : [{ id: 'general', title: 'General' }],
          country_label: countryLabel
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
