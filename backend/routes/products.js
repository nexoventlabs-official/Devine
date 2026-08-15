import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Product from '../models/Product.js';
import cloudinaryService from '../services/cloudinary.js';
import { getClient } from '../services/metaCloud.js';
import { genOrderId } from '../services/ids.js';
import DealerProfile from '../models/DealerProfile.js';
import catalogService from '../services/catalogService.js';
import logger from '../services/logger.js';

const router = express.Router();

// Normalize incoming variants (JSON string from multipart form, or array) into
// clean [{ label, quantity, unit, price, mrp, dealerPrice }]. Skips empty rows.
function parseVariants(raw) {
  let arr = raw;
  if (typeof raw === 'string') {
    try { arr = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => {
      const quantity = Number(v.quantity) || 0;
      const unit = (v.unit || '').trim();
      const price = Number(v.price) || 0;
      const label = (v.label || '').trim() || (quantity && unit ? `${quantity} ${unit}` : unit || (quantity ? String(quantity) : ''));
      return {
        label,
        quantity,
        unit: unit || 'unit',
        price,
        mrp: Number(v.mrp) || 0,
        dealerPrice: Number(v.dealerPrice) || 0,
        imageUrl: v.imageUrl || '' // preserved existing image; overridden if a new file is uploaded
      };
    })
    .filter((v) => v.price > 0 || v.quantity > 0);
}

// Parse variants + upload any per-variant image files (field `variant_image_<i>`).
async function buildVariants(rawVariants, files) {
  const variants = parseVariants(rawVariants);
  for (let i = 0; i < variants.length; i++) {
    const f = (files || []).find((x) => x.fieldname === `variant_image_${i}`);
    if (f) {
      try {
        variants[i].imageUrl = await cloudinaryService.uploadBuffer(f.buffer, { folder: 'devine/products' });
      } catch (_) {}
    }
  }
  return variants;
}

const fileByField = (files, name) => (files || []).find((f) => f.fieldname === name);

// Public: list active products (used by B2C site + flows)
router.get('/', async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.featured = true;
  const products = await Product.find(req.query.all ? {} : filter).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

// Public: distinct categories for filter UI
router.get('/meta/categories', async (_req, res) => {
  const categories = await Product.distinct('category', { active: true });
  res.json({ success: true, data: categories.filter(Boolean).sort() });
});

// Public: single product detail with sanitized reviews + rating distribution.
// Raw reviewer phone numbers are never exposed (masked to last 4 digits).
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });

  const rawRatings = Array.isArray(p.ratings) ? p.ratings : [];
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rawRatings.forEach((r) => {
    const s = Math.round(r.rating || 0);
    if (distribution[s] !== undefined) distribution[s] += 1;
  });

  const maskReviewer = (phone) => {
    if (!phone) return 'Verified Buyer';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 4 ? `Customer ••••${digits.slice(-4)}` : 'Verified Buyer';
  };

  const reviews = rawRatings
    .filter((r) => r.rating)
    .map((r) => ({
      rating: r.rating,
      comment: r.comment || '',
      reviewer: maskReviewer(r.phone),
      date: r.createdAt || null
    }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const totalRatings = p.totalRatings || reviews.length;
  const avgRating = p.avgRating || p.rating || 0;

  // Strip PII-bearing raw ratings before sending to the public client.
  const { ratings, ...safe } = p;

  res.json({
    success: true,
    data: {
      ...safe,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings,
      reviewCount: p.reviewCount || totalRatings,
      ratingDistribution: distribution,
      reviews
    }
  });
});

// Admin: create product (uploads image, auto-pushes New Product Launch template)
router.post('/', auth, upload.any(), async (req, res) => {
  try {
    const b = req.body;
    let imageUrl = b.imageUrl || '';
    const mainImg = fileByField(req.files, 'image');
    if (mainImg) {
      imageUrl = await cloudinaryService.uploadBuffer(mainImg.buffer, { folder: 'devine/products' });
    }
    const retailerId = b.retailerId || `dvn_${genOrderId('p').toLowerCase().replace(/-/g, '')}`;
    const product = await Product.create({
      name: b.name,
      retailerId,
      category: b.category,
      description: b.description || '',
      shortDesc: b.shortDesc || '',
      price: Number(b.price) || 0,
      mrp: Number(b.mrp) || 0,
      dealerPrice: Number(b.dealerPrice) || 0,
      margin: b.margin || '',
      moq: b.moq || '',
      unit: b.unit || 'unit',
      variants: await buildVariants(b.variants, req.files),
      imageUrl,
      rating: Number(b.rating) || 4.5,
      badges: b.badges ? String(b.badges).split(',').map((s) => s.trim()) : [],
      inStock: b.inStock !== 'false',
      active: b.active !== 'false'
    });

    // Respond first, then sync/broadcast in the background so the admin UI is snappy.
    res.status(201).json({ success: true, data: product });

    // Push to Meta Commerce Catalog (native product cards).
    catalogService.syncProductToMeta(product).catch(() => {});

    // Auto-announce "New Product Launch" to active B2B dealers (unless disabled).
    // Uses the approved WA template `new_product_launch` (product image header + SAMPLE button).
    if (b.announce !== 'false') {
      broadcastProductLaunch(product, imageUrl).catch((err) =>
        logger.warn('Product launch broadcast failed', { error: err.message })
      );
    }
    return;
  } catch (err) {
    logger.error('Create product error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, upload.any(), async (req, res) => {
  try {
    const b = req.body;
    const update = { ...b };
    let oldImageUrl = null;
    const mainImg = fileByField(req.files, 'image');
    if (mainImg) {
      const existing = await Product.findById(req.params.id).select('imageUrl').lean();
      oldImageUrl = existing?.imageUrl || null;
      update.imageUrl = await cloudinaryService.uploadBuffer(mainImg.buffer, { folder: 'devine/products' });
    }
    ['price', 'mrp', 'dealerPrice', 'rating'].forEach((k) => {
      if (update[k] !== undefined) update[k] = Number(update[k]);
    });
    if (update.variants !== undefined) update.variants = await buildVariants(update.variants, req.files);
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: product });
    // Keep the Meta catalog in sync (price/availability/description).
    if (product) catalogService.syncProductToMeta(product).catch(() => {});
    // Remove the replaced image from Cloudinary.
    if (oldImageUrl && oldImageUrl !== update.imageUrl) {
      cloudinaryService.deleteByUrl(oldImageUrl).catch(() => {});
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  cloudinaryService.deleteByUrl(p.imageUrl).catch(() => {});
  if (p.waveImageUrl) cloudinaryService.deleteByUrl(p.waveImageUrl).catch(() => {});
  catalogService.deleteProductFromMeta(p.retailerId).catch(() => {});
  res.json({ success: true, message: 'Deleted' });
});

// Admin: toggle out-of-stock (manual pause) -> resync availability to Meta
router.patch('/:id/availability', auth, async (req, res) => {
  try {
    const { inStock, isPaused } = req.body;
    const update = {};
    if (inStock !== undefined) update.inStock = inStock === true || inStock === 'true';
    if (isPaused !== undefined) update.isPaused = isPaused === true || isPaused === 'true';
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
    catalogService.syncProductToMeta(product).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: set recurring sold-out schedule
router.patch('/:id/schedule', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { soldOutSchedule: req.body.soldOutSchedule, soldOutUntil: req.body.soldOutUntil } },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: push all products to the Meta catalog
router.post('/catalog/sync', auth, async (req, res) => {
  try {
    const result = await catalogService.autoSync();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Record a product rating (called by the B2C review flow) -> recompute avg + resync
router.post('/:retailerId/rating', async (req, res) => {
  try {
    const { rating, phone, orderId, comment } = req.body;
    const r = Math.max(1, Math.min(5, Number(rating) || 0));
    const product = await Product.findOne({ retailerId: req.params.retailerId });
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    product.ratings.push({ phone, orderId, rating: r, comment });
    const total = product.ratings.length;
    const avg = product.ratings.reduce((s, x) => s + (x.rating || 0), 0) / total;
    product.totalRatings = total;
    product.avgRating = Math.round(avg * 10) / 10;
    product.reviewCount = total;
    product.rating = product.avgRating;
    await product.save();
    res.json({ success: true, data: { avgRating: product.avgRating, totalRatings: product.totalRatings } });
    catalogService.syncProductToMeta(product).catch(() => {});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Broadcast a new product to all active dealers via the launch template.
async function broadcastProductLaunch(product, imageUrl) {
  const dealers = await DealerProfile.find({ status: 'Active' }).select('phone name').lean();
  if (!dealers.length) return;
  const wa = getClient('b2b');
  const templateName = process.env.WA_TEMPLATE_PRODUCT_LAUNCH || 'new_product_launch';
  let sent = 0;
  for (const d of dealers) {
    try {
      await wa.sendTemplate(d.phone, templateName, {
        headerImageUrl: imageUrl || product.imageUrl || null,
        bodyParams: [
          product.name,
          product.shortDesc || product.description || '',
          String(product.dealerPrice || product.price || ''),
          String(product.mrp || product.price || ''),
          product.margin || '',
          product.moq || ''
        ]
      });
      sent++;
    } catch (err) {
      logger.warn('Launch send failed', { phone: d.phone, error: err.response?.data?.error?.message || err.message });
    }
  }
  logger.info('Product launch broadcast', { product: product.name, dealers: dealers.length, sent });
}

export default router;
