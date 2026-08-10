// WhatsApp Commerce Catalog service (ESM).
// Syncs Devine products to the Meta catalog, embeds star ratings + details in
// the product description (shown on the native product detail card), and builds
// product_list sections for the B2C browse experience.
//
// FMCG products have no variants, so Product.retailerId IS the Meta retailer_id.
import Product from '../models/Product.js';
import { getClient } from './metaCloud.js';
import logger from './logger.js';

const CATALOG_ID = () => process.env.META_CATALOG_ID || '';
const CHANNEL = () => process.env.CATALOG_CHANNEL || 'b2c';

export function isEnabled() {
  return !!CATALOG_ID();
}

// Effective availability for Meta: active AND in stock AND not manually paused.
export function availabilityOf(p) {
  return p.active !== false && p.inStock !== false && !p.isPaused ? 'in stock' : 'out of stock';
}

/**
 * Build the rich product description shown on the WhatsApp product detail card.
 * Includes ⭐ star rating line, badges as #tags, and the product description —
 * mirroring the reference project's catalog detail page.
 */
export function buildProductDescription(p, { includeRatings = true } = {}) {
  const parts = [];
  if (p.unit && p.unit !== 'unit') parts.push(`Per ${p.unit}`);

  if (includeRatings) {
    const rating = p.avgRating || p.rating || 0;
    const total = p.totalRatings || p.reviewCount || 0;
    const filled = Math.min(Math.floor(rating), 5);
    const stars = '⭐'.repeat(filled) + '☆'.repeat(5 - filled);
    parts.push(total > 0 ? `${stars} ${rating.toFixed(1)}/5 (${total} reviews)` : '☆☆☆☆☆ New');
  }

  if (p.badges && p.badges.length) parts.push(p.badges.map((b) => `#${String(b).replace(/\s+/g, '')}`).join(' '));
  parts.push(p.description || p.shortDesc || p.name);
  return parts.join('\n\n').substring(0, 5000);
}

// Map a Product doc to the Meta catalog product payload.
function toCatalogProduct(p, { includeRatings = true } = {}) {
  return {
    retailerId: p.retailerId,
    name: p.name,
    description: buildProductDescription(p, { includeRatings }),
    price: p.price,
    salePrice: p.mrp && p.mrp > p.price ? p.price : null, // if MRP>price, show price as sale
    currency: 'INR',
    imageUrl: p.imageUrl || null,
    category: p.category || 'Food',
    availability: availabilityOf(p)
  };
}

/** Sync a single product to the Meta catalog (create/update). Non-throwing. */
export async function syncProductToMeta(product, { includeRatings = true } = {}) {
  if (!isEnabled()) return null;
  try {
    const wa = getClient(CHANNEL());
    const res = await wa.batchUpsertCatalogProducts(CATALOG_ID(), [toCatalogProduct(product, { includeRatings })]);
    logger.info('Catalog product synced', { retailerId: product.retailerId, name: product.name });
    return res;
  } catch (err) {
    logger.error('syncProductToMeta failed', { retailerId: product.retailerId, error: err.response?.data?.error?.message || err.message });
    return null;
  }
}

/** Remove a product from the Meta catalog. Non-throwing. */
export async function deleteProductFromMeta(retailerId) {
  if (!isEnabled() || !retailerId) return null;
  try {
    const wa = getClient(CHANNEL());
    return await wa.deleteCatalogProduct(CATALOG_ID(), retailerId);
  } catch (err) {
    logger.error('deleteProductFromMeta failed', { retailerId, error: err.response?.data?.error?.message || err.message });
    return null;
  }
}

/**
 * Push ALL active products to the Meta catalog in batches of 20.
 * @returns {{ pushed, failed, total }}
 */
export async function autoSync() {
  if (!isEnabled()) return { pushed: 0, failed: 0, total: 0, error: 'catalog_not_configured' };
  const wa = getClient(CHANNEL());
  const products = await Product.find({ active: true }).lean();
  const BATCH = 20;
  let pushed = 0;
  let failed = 0;
  for (let i = 0; i < products.length; i += BATCH) {
    const batch = products.slice(i, i + BATCH).map((p) => toCatalogProduct(p));
    try {
      await wa.batchUpsertCatalogProducts(CATALOG_ID(), batch);
      pushed += batch.length;
    } catch (err) {
      failed += batch.length;
      logger.error('autoSync batch failed', { start: i, error: err.response?.data?.error?.message || err.message });
    }
    if (i + BATCH < products.length) await new Promise((r) => setTimeout(r, 2000));
  }
  logger.info('Catalog autoSync complete', { pushed, failed, total: products.length });
  return { pushed, failed, total: products.length };
}

/** Re-sync every active product's description so latest ratings show on Meta. */
export async function syncRatingsToMeta() {
  return autoSync(); // descriptions already include ratings
}

/**
 * Build product_list sections for a category (native catalog message).
 * Returns null if catalog disabled or no products.
 */
export async function buildCategorySections(categoryName) {
  if (!isEnabled()) return null;
  const products = await Product.find({ active: true, category: categoryName }).select('retailerId').lean();
  const ids = products.map((p) => p.retailerId).filter(Boolean);
  if (!ids.length) return null;
  return { sections: [{ title: String(categoryName).substring(0, 24), productRetailerIds: ids.slice(0, 30) }], total: ids.length };
}

export default {
  isEnabled,
  availabilityOf,
  buildProductDescription,
  syncProductToMeta,
  deleteProductFromMeta,
  autoSync,
  syncRatingsToMeta,
  buildCategorySections
};
