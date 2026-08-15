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

// Build a Map<productId, liveOffer> (first live offer wins per product).
export async function buildOfferIndex() {
  const offers = await Offer.find({ active: true }).lean();
  const now = new Date();
  const map = new Map();
  for (const o of offers) {
    if (!isLive(o, now)) continue;
    for (const pid of o.productIds || []) {
      const key = String(pid);
      if (!map.has(key)) map.set(key, o);
    }
  }
  return map;
}

export async function offerForProduct(productId) {
  const idx = await buildOfferIndex();
  return idx.get(String(productId)) || null;
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

export default { applyDiscount, isLive, buildOfferIndex, offerForProduct, b2cPricing, b2bPricing };
