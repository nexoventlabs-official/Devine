// WhatsApp Commerce Catalog service (ESM).
// Syncs Devine products to the Meta catalog, embeds star ratings + details in
// the product description (shown on the native product detail card), and builds
// product_list sections for the B2C browse experience.
//
// FMCG products have no variants, so Product.retailerId IS the Meta retailer_id.
import Product from '../models/Product.js';
import { getClient } from './metaCloud.js';
import { buildOfferIndex, offerForProduct, b2cPricing } from './offers.js';
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

  // Size/quantity variants with per-size pricing.
  if (Array.isArray(p.variants) && p.variants.length) {
    const sizes = p.variants
      .map((v) => `${v.label || `${v.quantity} ${v.unit}`.trim()} - Rs.${v.price}`)
      .join('\n');
    parts.push(`Available sizes:\n${sizes}`);
  }

  parts.push(p.description || p.shortDesc || p.name);
  return parts.join('\n\n').substring(0, 5000);
}

const variantLabel = (v) => v.label || `${v.quantity || ''} ${v.unit || ''}`.trim();

/**
 * Expand a Product into one or more Meta catalog items:
 *  - No variants  -> a single item (retailerId = product.retailerId).
 *  - With variants -> one item per size (retailerId = `${base}__v${i}`), all
 *    sharing item_group_id = base so Meta renders a size picker.
 */
// Collect up to 10 extra image URLs for a catalog item (shown as the ‹ › carousel
// on the WhatsApp catalog detail screen), excluding the item's main image.
function extraImages(mainUrl, ...arrays) {
  const out = [];
  arrays.flat().forEach((u) => { if (u && u !== mainUrl && !out.includes(u)) out.push(u); });
  return out.slice(0, 10);
}

export function expandToCatalogItems(p, { includeRatings = true, offer = null } = {}) {
  const base = {
    description: buildProductDescription(p, { includeRatings }),
    currency: 'INR',
    category: p.category || 'Food',
    availability: availabilityOf(p),
    groupId: p.retailerId
  };
  if (Array.isArray(p.variants) && p.variants.length) {
    return p.variants.map((v, i) => {
      // With an active offer: catalog price = original (struck), sale_price = offer price.
      const pr = b2cPricing(v.price || p.price, offer);
      const mainUrl = v.imageUrl || p.imageUrl || null;
      return {
        ...base,
        retailerId: `${p.retailerId}__v${i}`,
        name: `${p.name} - ${variantLabel(v)}`,
        size: variantLabel(v),
        price: pr.original,
        salePrice: pr.offer,
        imageUrl: mainUrl,
        additionalImages: extraImages(mainUrl, v.images || [], p.coverImageUrl, p.gallery || [])
      };
    });
  }
  const pr = b2cPricing(p.price, offer);
  const mainUrl = p.imageUrl || null;
  return [{
    ...base,
    retailerId: p.retailerId,
    name: p.name,
    price: pr.original,
    salePrice: pr.offer,
    imageUrl: mainUrl,
    additionalImages: extraImages(mainUrl, p.coverImageUrl, p.gallery || [])
  }];
}

// Back-compat single-item mapper (used where a single payload is expected).
function toCatalogProduct(p, opts = {}) {
  return expandToCatalogItems(p, opts)[0];
}

/**
 * Sync a single product to the Meta catalog: upsert its (variant) items and
 * delete any stale items from a previous sync. Persists the pushed ids.
 * Non-throwing.
 */
export async function syncProductToMeta(product, { includeRatings = true } = {}) {
  if (!isEnabled()) return null;
  try {
    const wa = getClient(CHANNEL());
    const offer = await offerForProduct(product._id).catch(() => null);
    const items = expandToCatalogItems(product, { includeRatings, offer });
    const newIds = items.map((it) => it.retailerId);

    // Remove items that existed before but are no longer part of this product.
    const prevIds = product.catalogItemIds || [];
    const stale = prevIds.filter((id) => !newIds.includes(id));
    if (stale.length) await wa.deleteCatalogProducts(CATALOG_ID(), stale).catch(() => {});

    const res = await wa.batchUpsertCatalogProducts(CATALOG_ID(), items);
    await Product.updateOne({ _id: product._id }, { $set: { catalogItemIds: newIds } }).catch(() => {});
    logger.info('Catalog product synced', { retailerId: product.retailerId, items: newIds.length });
    return res;
  } catch (err) {
    logger.error('syncProductToMeta failed', { retailerId: product.retailerId, error: err.response?.data?.error?.message || err.message });
    return null;
  }
}

/** Remove a product (and all its variant items) from the Meta catalog. Non-throwing. */
export async function deleteProductFromMeta(productOrId) {
  if (!isEnabled()) return null;
  const ids = typeof productOrId === 'string'
    ? [productOrId]
    : [...new Set([...(productOrId?.catalogItemIds || []), productOrId?.retailerId].filter(Boolean))];
  if (!ids.length) return null;
  try {
    const wa = getClient(CHANNEL());
    return await wa.deleteCatalogProducts(CATALOG_ID(), ids);
  } catch (err) {
    logger.error('deleteProductFromMeta failed', { ids, error: err.response?.data?.error?.message || err.message });
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
  const products = await Product.find({ active: true });

  // Expand every product to its catalog items; track stale ids to remove.
  const offerIndex = await buildOfferIndex().catch(() => new Map());
  const allItems = [];
  const stale = [];
  for (const p of products) {
    const items = expandToCatalogItems(p, { offer: offerIndex.get(String(p._id)) || null });
    const newIds = items.map((it) => it.retailerId);
    (p.catalogItemIds || []).forEach((id) => { if (!newIds.includes(id)) stale.push(id); });
    allItems.push(...items);
    await Product.updateOne({ _id: p._id }, { $set: { catalogItemIds: newIds } }).catch(() => {});
  }
  if (stale.length) await wa.deleteCatalogProducts(CATALOG_ID(), stale).catch(() => {});

  const BATCH = 20;
  let pushed = 0;
  let failed = 0;
  for (let i = 0; i < allItems.length; i += BATCH) {
    const batch = allItems.slice(i, i + BATCH);
    try {
      await wa.batchUpsertCatalogProducts(CATALOG_ID(), batch);
      pushed += batch.length;
    } catch (err) {
      failed += batch.length;
      logger.error('autoSync batch failed', { start: i, error: err.response?.data?.error?.message || err.message });
    }
    if (i + BATCH < allItems.length) await new Promise((r) => setTimeout(r, 2000));
  }
  logger.info('Catalog autoSync complete', { pushed, failed, items: allItems.length, products: products.length });
  return { pushed, failed, total: allItems.length };
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
  const products = await Product.find({ active: true, category: categoryName }).select('retailerId variants').lean();
  // For variant products, reference the first variant's catalog id (the group card).
  const ids = products
    .map((p) => (p.variants && p.variants.length ? `${p.retailerId}__v0` : p.retailerId))
    .filter(Boolean);
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
