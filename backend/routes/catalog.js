import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Category from '../models/Category.js';
import FlowAsset from '../models/FlowAsset.js';
import SupplyCountry from '../models/SupplyCountry.js';
import cloudinaryService from '../services/cloudinary.js';
import { ASSET_KEYS } from '../services/assets.js';

const router = express.Router();

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
  if (req.file) update.imageUrl = await cloudinaryService.uploadBuffer(req.file.buffer, { folder: 'devine/categories' });
  const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ success: true, data: cat });
});

router.delete('/categories/:id', auth, async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
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
    const { key, label, type = 'image', group = 'general' } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'key required' });
    let url = req.body.url || '';
    if (req.file) {
      const isPdf = req.file.mimetype === 'application/pdf';
      url = await cloudinaryService.uploadBuffer(req.file.buffer, {
        folder: `devine/flow-assets/${group}`,
        resourceType: isPdf ? 'raw' : 'image',
        preserveAspect: true
      });
    }
    const asset = await FlowAsset.findOneAndUpdate(
      { key },
      { key, label, type, group, ...(url ? { url } : {}) },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/flow-assets/:id', auth, async (req, res) => {
  await FlowAsset.findByIdAndDelete(req.params.id);
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

router.delete('/supply-countries/:id', auth, async (req, res) => {
  await SupplyCountry.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
