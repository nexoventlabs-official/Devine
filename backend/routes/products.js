import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Product from '../models/Product.js';
import cloudinaryService from '../services/cloudinary.js';
import { getClient } from '../services/metaCloud.js';
import { genOrderId } from '../services/ids.js';
import logger from '../services/logger.js';

const router = express.Router();

// Public: list active products (used by B2C site + flows)
router.get('/', async (req, res) => {
  const filter = { active: true };
  if (req.query.category) filter.category = req.query.category;
  const products = await Product.find(req.query.all ? {} : filter).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
});

router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: p });
});

// Admin: create product (uploads image, auto-pushes New Product Launch template)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const b = req.body;
    let imageUrl = b.imageUrl || '';
    if (req.file) {
      imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/products' });
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
      imageUrl,
      rating: Number(b.rating) || 4.5,
      badges: b.badges ? String(b.badges).split(',').map((s) => s.trim()) : [],
      inStock: b.inStock !== 'false',
      active: b.active !== 'false'
    });

    // Auto-push "New Product Launch" template to opted-in dealers/customers is a
    // marketing broadcast; here we only fire it if a launch template + audience
    // are configured. Non-fatal on failure.
    if (b.announce === 'true' && b.announcePhone) {
      try {
        const wa = getClient(b.announceChannel === 'b2c' ? 'b2c' : 'b2b');
        await wa.sendTemplate(b.announcePhone, process.env.WA_TEMPLATE_PRODUCT_LAUNCH || 'new_product_launch', {
          headerImageUrl: imageUrl,
          bodyParams: [product.name, product.description || product.shortDesc || '', String(product.dealerPrice || product.price), String(product.price), product.margin || '', product.moq || '']
        });
      } catch (err) {
        logger.warn('Product launch template send skipped', { error: err.message });
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    logger.error('Create product error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const b = req.body;
    const update = { ...b };
    if (req.file) {
      update.imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/products' });
    }
    ['price', 'mrp', 'dealerPrice', 'rating'].forEach((k) => {
      if (update[k] !== undefined) update[k] = Number(update[k]);
    });
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  if (p.imageUrl?.includes('cloudinary')) {
    const pid = cloudinaryService.extractPublicId(p.imageUrl);
    if (pid) cloudinaryService.deleteByPublicId(pid).catch(() => {});
  }
  res.json({ success: true, message: 'Deleted' });
});

export default router;
