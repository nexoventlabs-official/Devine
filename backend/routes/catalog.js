import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Category from '../models/Category.js';
import FlowAsset from '../models/FlowAsset.js';
import SupplyCountry from '../models/SupplyCountry.js';
import BulkRange from '../models/BulkRange.js';
import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import cloudinaryService from '../services/cloudinary.js';
import catalogService from '../services/catalogService.js';
import { ASSET_KEYS } from '../services/assets.js';

const router = express.Router();

// ---------------- OFFERS ----------------
function sanitizeOffer(b = {}) {
  return {
    title: b.title,
    active: b.active !== false && b.active !== 'false',
    productIds: Array.isArray(b.productIds) ? b.productIds : [],
    b2c: {
      enabled: !!b.b2c?.enabled,
      type: b.b2c?.type === 'flat' ? 'flat' : 'percent',
      value: Number(b.b2c?.value) || 0
    },
    b2b: {
      enabled: !!b.b2b?.enabled,
      type: b.b2b?.type === 'flat' ? 'flat' : 'percent',
      value: Number(b.b2b?.value) || 0
    },
    startsAt: b.startsAt || null,
    endsAt: b.endsAt || null
  };
}

// Re-push affected products to the catalog so offer strikethrough updates.
async function resyncOfferProducts(productIds) {
  const ids = [...new Set((productIds || []).map(String))];
  if (!ids.length) return;
  const prods = await Product.find({ _id: { $in: ids } });
  for (const p of prods) catalogService.syncProductToMeta(p).catch(() => {});
}

router.get('/offers', auth, async (_req, res) => {
  const list = await Offer.find().sort({ createdAt: -1 }).populate('productIds', 'name retailerId price dealerPrice').lean();
  res.json({ success: true, data: list });
});

router.post('/offers', auth, async (req, res) => {
  const offer = await Offer.create(sanitizeOffer(req.body));
  res.json({ success: true, data: offer });
  resyncOfferProducts(offer.productIds).catch(() => {});
});

router.put('/offers/:id', auth, async (req, res) => {
  const prev = await Offer.findById(req.params.id).lean();
  const offer = await Offer.findByIdAndUpdate(req.params.id, sanitizeOffer(req.body), { new: true });
  res.json({ success: true, data: offer });
  // Re-sync both the old and new product sets (removed products lose the offer).
  const affected = [...(prev?.productIds || []), ...(offer?.productIds || [])];
  resyncOfferProducts(affected).catch(() => {});
});

router.delete('/offers/:id', auth, async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  res.json({ success: true });
  if (offer) resyncOfferProducts(offer.productIds).catch(() => {});
});

// ---------------- BULK / WHOLESALE RANGES ----------------
router.get('/bulk-ranges', async (req, res) => {
  const list = await BulkRange.find(req.query.all ? {} : { active: true }).sort({ order: 1, createdAt: 1 });
  res.json({ success: true, data: list });
});

router.post('/bulk-ranges', auth, upload.single('image'), async (req, res) => {
  try {
    const b = req.body;
    let imageUrl = b.imageUrl || '';
    if (req.file) imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/bulk-ranges', aspectRatio: '1:1' });
    const range = await BulkRange.create({
      name: b.name,
      moq: b.moq || '',
      order: Number(b.order) || 0,
      active: b.active !== 'false',
      imageUrl
    });
    res.json({ success: true, data: range });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/bulk-ranges/:id', auth, upload.single('image'), async (req, res) => {
  const update = { ...req.body };
  if (update.order !== undefined) update.order = Number(update.order);
  let oldImageUrl = null;
  if (req.file) {
    const existing = await BulkRange.findById(req.params.id).select('imageUrl').lean();
    oldImageUrl = existing?.imageUrl || null;
    update.imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/bulk-ranges', aspectRatio: '1:1' });
  }
  const range = await BulkRange.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, data: range });
  if (oldImageUrl && oldImageUrl !== update.imageUrl) cloudinaryService.deleteByUrl(oldImageUrl).catch(() => {});
});

router.delete('/bulk-ranges/:id', auth, async (req, res) => {
  const range = await BulkRange.findByIdAndDelete(req.params.id);
  if (range) cloudinaryService.deleteByUrl(range.imageUrl).catch(() => {});
  res.json({ success: true });
});

// ---------------- CATEGORIES ----------------
router.get('/categories', async (req, res) => {
  const cats = await Category.find(req.query.all ? {} : { active: true }).sort({ order: 1 });
  res.json({ success: true, data: cats });
});

router.post('/categories', auth, upload.single('image'), async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || '';
    if (req.file) imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/categories' });
    const cat = await Category.create({
      name: req.body.name,
      imageUrl,
      order: Number(req.body.order) || 0,
      active: req.body.active !== 'false'
    });
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/categories/:id', auth, upload.single('image'), async (req, res) => {
  const update = { ...req.body };
  let oldImageUrl = null;
  if (req.file) {
    const existing = await Category.findById(req.params.id).select('imageUrl').lean();
    oldImageUrl = existing?.imageUrl || null;
    update.imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/categories' });
  }
  const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, data: cat });
  // Remove the replaced tile image from Cloudinary.
  if (oldImageUrl && oldImageUrl !== update.imageUrl) {
    cloudinaryService.deleteByUrl(oldImageUrl).catch(() => {});
  }
});

router.delete('/categories/:id', auth, async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (cat) cloudinaryService.deleteByUrl(cat.imageUrl).catch(() => {});
  res.json({ success: true });
});

// ---------------- FLOW IMAGES (icons/banners/pdf/links) ----------------
router.get('/flow-assets', async (req, res) => {
  const assets = await FlowAsset.find().sort({ group: 1, key: 1 });
  res.json({ success: true, data: assets, keys: ASSET_KEYS });
});

// Upsert by key. Accepts a file (image/pdf) OR a url (for links).
router.post('/flow-assets', auth, upload.single('file'), async (req, res) => {
  try {
    const { key, label, type = 'image', group = 'general', aspectRatio } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key required' });
    const existing = await FlowAsset.findOne({ key }).select('url').lean();
    const oldUrl = existing?.url || null;
    let url = req.body.url || '';
    if (req.file) {
      const isPdf = req.file.mimetype === 'application/pdf';
      const ratio = aspectRatio || (key.toLowerCase().includes('banner') ? '8:1' : '1:1');
      url = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `devine/flow-assets/${group}`,
        resourceType: isPdf ? 'raw' : 'image',
        preserveAspect: isPdf,
        aspectRatio: ratio
      });
    }
    const asset = await FlowAsset.findOneAndUpdate(
      { key },
      { key, label, type, group, ...(url ? { url } : {}) },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: asset });
    // Remove the replaced asset from Cloudinary (image or PDF).
    if (url && oldUrl && oldUrl !== url) {
      cloudinaryService.deleteByUrl(oldUrl).catch(() => {});
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/flow-assets/:id', auth, async (req, res) => {
  const asset = await FlowAsset.findByIdAndDelete(req.params.id);
  if (asset) cloudinaryService.deleteByUrl(asset.url).catch(() => {});
  res.json({ success: true });
});

// ---------------- SUPPLY COUNTRIES (export) ----------------
router.get('/supply-countries', async (req, res) => {
  const list = await SupplyCountry.find(req.query.all ? {} : { active: true }).sort({ order: 1 });
  res.json({ success: true, data: list });
});

router.post('/supply-countries', auth, upload.single('logo'), async (req, res) => {
  try {
    let logoUrl = req.body.logoUrl || '';
    if (req.file) logoUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/supply-countries' });
    const country = await SupplyCountry.create({
      name: req.body.name,
      logoUrl,
      order: Number(req.body.order) || 0,
      active: req.body.active !== 'false'
    });
    res.status(201).json({ success: true, data: country });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/supply-countries/:id', auth, upload.single('logo'), async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.order !== undefined) update.order = Number(req.body.order) || 0;
    if (req.body.active !== undefined) update.active = req.body.active !== 'false';
    if (req.file) update.logoUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/supply-countries' });
    else if (req.body.logoUrl) update.logoUrl = req.body.logoUrl;
    const country = await SupplyCountry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!country) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: country });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/supply-countries/:id', auth, async (req, res) => {
  await SupplyCountry.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
