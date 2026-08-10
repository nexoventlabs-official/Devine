// Push all active products to the Meta Commerce Catalog. Run: node scripts/catalog-sync.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const catalogService = (await import('../services/catalogService.js')).default;
await mongoose.connect(process.env.MONGODB_URI);
console.log('Catalog enabled:', catalogService.isEnabled(), '| id:', process.env.META_CATALOG_ID);
const res = await catalogService.autoSync();
console.log('Result:', JSON.stringify(res));
await mongoose.disconnect();
