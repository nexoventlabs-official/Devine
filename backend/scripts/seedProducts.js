// One-time migration: upload the (formerly hardcoded) product SVGs to Cloudinary
// and create Product documents in MongoDB. Idempotent by retailerId/name.
//
// Usage:  node scripts/seedProducts.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Product = (await import('../models/Product.js')).default;
const cloudinaryService = (await import('../services/cloudinary.js')).default;

const CREATIVES_DIR = path.join(__dirname, '..', '..', 'frontend', 'public', 'assets', 'creatives');

const SEED = [
  {
    name: 'Gulganth Dry Fruits', retailerId: 'dvn_gulganth_dry_fruits', category: 'Gulkand & Dry Fruits',
    description: 'Exquisite sun-cooked Damask rose petals generously blended with premium cashew nuts, almonds, and pistachios for a royal, invigorating after-meal bite.',
    shortDesc: 'Rose petals with premium dry fruits.',
    price: 699, badges: ['Royal formulation', 'Rich in dry fruits', '100% Natural'], file: 'Gulganth_Dry_Fruits.svg'
  },
  {
    name: 'Honey Amla', retailerId: 'dvn_honey_amla', category: 'Honey & Infusions',
    description: 'Fresh organic Indian gooseberries (Amla) slow-steeped in pure wild mountain honey. A classic Ayurvedic daily immunity booster loaded with Vitamin C.',
    shortDesc: 'Amla steeped in wild mountain honey.',
    price: 649, badges: ['Ayurvedic recipe', 'Immunity booster', '100% Natural'], file: 'Honey_Amla.svg',
    featured: true, wave: 'Honey_Amla_wave.svg'
  },
  {
    name: 'Honey Fig', retailerId: 'dvn_honey_fig', category: 'Honey & Infusions',
    description: 'Sun-dried Turkish figs soaked in rich raw forest honey. High in natural dietary fiber, iron, and essential minerals for daily vitality.',
    shortDesc: 'Turkish figs in raw forest honey.',
    price: 699, badges: ['Rich in fiber', 'Raw forest honey', 'No added sugar'], file: 'Honey_Fig.svg',
    featured: true, wave: 'Honey_Fig_wave.svg'
  },
  {
    name: 'Honey Garlic', retailerId: 'dvn_honey_garlic', category: 'Honey & Infusions',
    description: 'Aged mountain garlic cloves fermented in pure raw honey. A potent traditional remedy known for cardiovascular wellness and natural immunity.',
    shortDesc: 'Aged garlic fermented in raw honey.',
    price: 599, badges: ['Aged fermentation', 'Heart health', 'Traditional remedy'], file: 'Honey_Garlic.svg',
    featured: true, wave: 'Honey_Garlic_wave.svg'
  },
  {
    name: 'Honey Mappillai Mix', retailerId: 'dvn_honey_mappillai_mix', category: 'Honey & Infusions',
    description: 'A heritage South Indian herbal honey blend infused with traditional invigorating herbs, nuts, and botanical extracts for sustained stamina.',
    shortDesc: 'Heritage herbal honey blend.',
    price: 799, badges: ['Heritage blend', 'Herbal tonic', 'Energy booster'], file: 'Honey_Mappillai_Mix.svg'
  },
  {
    name: 'Gulkand Rose Petal Jam', retailerId: 'dvn_gulkand_rose_jam', category: 'Gulkand & Dry Fruits',
    description: 'Authentic sun-cured Damask rose petal preserve prepared using age-old slow cooking techniques. Naturally cooling for digestive health.',
    shortDesc: 'Sun-cured Damask rose preserve.',
    price: 499, badges: ['Sun-cured roses', 'Natural cooling', 'Pure recipe'], file: 'Gulkand_Rose_Petal_Jam.svg'
  },
  {
    name: 'Narumanam Mouth Freshener', retailerId: 'dvn_narumanam_mouth_freshener', category: 'Digestives & Beeda',
    description: 'A fragrant blend of roasted fennel seeds, silver-coated cardamom, dry dates, and herbal cooling seeds for long-lasting fresh breath.',
    shortDesc: 'Herbal after-meal mouth freshener.',
    price: 399, badges: ['Fresh breath', 'Herbal blend', 'After-meal digestive'], file: 'Narumanam_Mouth_Freshener.svg'
  },
  {
    name: 'Narumanam Agarbatti', retailerId: 'dvn_narumanam_agarbatti', category: 'Aromatics & Sambrani',
    description: 'Hand-rolled sacred incense sticks crafted with natural flower resins, sandalwood oils, and pure botanical extracts for peaceful meditation.',
    shortDesc: 'Hand-rolled natural incense sticks.',
    price: 249, badges: ['Hand-rolled', 'Natural resins', 'Long-burning'], file: 'Narumanam_Agrabatti.svg'
  },
  {
    name: 'Narumanam Cup Sambrani', retailerId: 'dvn_narumanam_cup_sambrani', category: 'Aromatics & Sambrani',
    description: 'Traditional charcoal-free sambrani cups filled with pure benzoin resin (Loban). Emits a soothing, purifying herbal smoke for homes and temples.',
    shortDesc: 'Charcoal-free Loban sambrani cups.',
    price: 299, badges: ['Pure Loban resin', 'Charcoal-free', 'Purifying fragrance'], file: 'Narumanam_Cup_sambrani.svg'
  }
];

async function uploadCreative(fileName, { preserveAspect = false } = {}) {
  const full = path.join(CREATIVES_DIR, fileName);
  if (!fs.existsSync(full)) {
    console.warn(`  ! missing file: ${fileName}`);
    return '';
  }
  const buffer = fs.readFileSync(full);
  const publicId = fileName.replace(/\.[^.]+$/, '');
  const url = await cloudinaryService.uploadBuffer(buffer, {
    folder: 'devine/products',
    publicId,
    preserveAspect
  });
  return url;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB. Seeding products...');

  for (const item of SEED) {
    const imageUrl = await uploadCreative(item.file);
    let waveImageUrl = '';
    if (item.wave) waveImageUrl = await uploadCreative(item.wave, { preserveAspect: true });

    const doc = {
      name: item.name,
      retailerId: item.retailerId,
      category: item.category,
      description: item.description,
      shortDesc: item.shortDesc,
      price: item.price,
      mrp: item.price,
      badges: item.badges,
      imageUrl,
      waveImageUrl,
      featured: Boolean(item.featured),
      inStock: true,
      active: true
    };

    const saved = await Product.findOneAndUpdate(
      { retailerId: item.retailerId },
      { $set: doc },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`  ✓ ${saved.name}${item.featured ? ' (featured)' : ''}`);
  }

  const count = await Product.countDocuments();
  console.log(`Done. Total products in DB: ${count}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
