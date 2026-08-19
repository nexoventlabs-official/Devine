import Offer from '../models/Offer.js';

// Apply a percent/flat discount to a base price, returning a rounded, non-negative price.
export function applyDiscount(base, type, value) {
  base = Number(base) || 0;
  value = Number(value) || 0;
  if (!base || !value) return base;
  const out = type === 'flat' ? base - value : base - (base * value) / 100;
  return Math.max(0, Math.round(out));
}

// Is the offer currently live (active + within optional date window)?
export function isLive(offer, now = new Date()) {
  if (!offer || !offer.active) return false;
  if (offer.startsAt && now < new Date(offer.startsAt)) return false;
  if (offer.endsAt && now > new Date(offer.endsAt)) return false;
  return true;
}

// Build the live-offer index:
//   product: Map<productId, offer>            (whole-product offers)
//   variant: Map<`productId#index`, offer>    (specific-variant offers)
export async function buildOfferIndex() {
  const offers = await Offer.find({ active: true }).lean();
  const now = new Date();
  const product = new Map();
  const variant = new Map();
  for (const o of offers) {
    if (!isLive(o, now)) continue;
    for (const pid of o.productIds || []) {
      const key = String(pid);
      if (!product.has(key)) product.set(key, o);
    }
    for (const t of o.variantTargets || []) {
      if (t?.product == null || t?.index == null) continue;
      const key = `${String(t.product)}#${t.index}`;
      if (!variant.has(key)) variant.set(key, o);
    }
  }
  return { product, variant };
}

// Resolve the applicable offer: a variant-specific offer wins over a product-wide one.
export function resolveOffer(idx, productId, variantIndex = null) {
  if (!idx) return null;
  if (variantIndex != null) {
    const v = idx.variant.get(`${String(productId)}#${variantIndex}`);
    if (v) return v;
  }
  return idx.product.get(String(productId)) || null;
}

export async function offerForProduct(productId) {
  const idx = await buildOfferIndex();
  return resolveOffer(idx, productId);
}

export async function offerForVariant(productId, variantIndex) {
  const idx = await buildOfferIndex();
  return resolveOffer(idx, productId, variantIndex);
}

// B2C effective pricing for a base price given an (optional) offer.
export function b2cPricing(price, offer) {
  if (offer && offer.b2c?.enabled) {
    const off = applyDiscount(price, offer.b2c.type, offer.b2c.value);
    if (off > 0 && off < price) return { original: price, offer: off };
  }
  return { original: price, offer: null };
}

// B2B (dealer) effective pricing.
export function b2bPricing(dealerPrice, offer) {
  if (offer && offer.b2b?.enabled) {
    const off = applyDiscount(dealerPrice, offer.b2b.type, offer.b2b.value);
    if (off > 0 && off < dealerPrice) return { original: dealerPrice, offer: off };
  }
  return { original: dealerPrice, offer: null };
}

export default { applyDiscount, isLive, buildOfferIndex, resolveOffer, offerForProduct, offerForVariant, b2cPricing, b2bPricing };
