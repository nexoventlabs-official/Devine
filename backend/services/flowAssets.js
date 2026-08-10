import FlowImage from '../models/FlowImage.js';
import logger from './logger.js';

// Sensible fallbacks so flows still work before the admin uploads assets.
const FALLBACKS = {
  b2b_welcome_banner: 'https://res.cloudinary.com/zavohueh/image/upload/v1/devine/placeholder_banner.png',
  b2c_welcome_banner: 'https://res.cloudinary.com/zavohueh/image/upload/v1/devine/placeholder_banner.png'
};

const cache = new Map();
const TTL = 60 * 1000;

export async function getAsset(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.doc;
  try {
    const doc = await FlowImage.findOne({ key }).lean();
    cache.set(key, { doc, at: Date.now() });
    return doc;
  } catch (e) {
    logger.warn('getAsset error', { key, error: e.message });
    return null;
  }
}

export async function getAssetUrl(key, fallback = null) {
  const doc = await getAsset(key);
  return doc?.url || fallback || FALLBACKS[key] || null;
}

export function clearAssetCache() {
  cache.clear();
}

export default { getAsset, getAssetUrl, clearAssetCache };
