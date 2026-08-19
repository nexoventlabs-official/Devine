// One-time cleanup: delete Cloudinary assets under devine/products that are no
// longer referenced by any Product (orphans left by pre-fix edits).
// DRY RUN by default. Set DELETE=1 to actually delete.
//   node scripts/cleanup-cloudinary.js          -> report only
//   DELETE=1 node scripts/cleanup-cloudinary.js -> delete orphans
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/Product.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DO_DELETE = process.env.DELETE === '1';
const PREFIX = 'devine/products';

function publicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/upload/');
  if (parts.length !== 2) return null;
  const pathPart = parts[1].split('?')[0];
  const segs = pathPart.split('/').filter((s) => !/^v\d+$/.test(s) && !/^[a-z]+_/.test(s));
  let id = segs.join('/');
  id = id.replace(/\.[^/.]+$/, ''); // drop extension (image/video)
  return id || null;
}

async function listAll(resourceType) {
  const ids = [];
  let next;
  do {
    // eslint-disable-next-line no-await-in-loop
    const res = await cloudinary.api.resources({
      type: 'upload', resource_type: resourceType, prefix: PREFIX, max_results: 500, next_cursor: next
    });
    res.resources.forEach((r) => ids.push(r.public_id));
    next = res.next_cursor;
  } while (next);
  return ids;
}

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find().lean();

  const referenced = new Set();
  const add = (u) => { const id = publicIdFromUrl(u); if (id) referenced.add(id); };
  products.forEach((p) => {
    add(p.imageUrl); add(p.coverImageUrl); add(p.videoUrl); add(p.waveImageUrl);
    (p.gallery || []).forEach(add);
    (p.variants || []).forEach((v) => { add(v.imageUrl); (v.images || []).forEach(add); });
  });
  console.log('Referenced assets:', referenced.size);

  for (const rt of ['image', 'video']) {
    const all = await listAll(rt);
    const orphans = all.filter((id) => !referenced.has(id));
    console.log(`\n[${rt}] total under ${PREFIX}: ${all.length} | orphans: ${orphans.length}`);
    orphans.forEach((id) => console.log('  orphan:', id));
    if (DO_DELETE && orphans.length) {
      for (let i = 0; i < orphans.length; i += 100) {
        const batch = orphans.slice(i, i + 100);
        // eslint-disable-next-line no-await-in-loop
        await cloudinary.api.delete_resources(batch, { resource_type: rt });
        console.log(`  deleted ${batch.length} ${rt} assets`);
      }
    }
  }

  console.log(DO_DELETE ? '\nDONE (deleted orphans).' : '\nDRY RUN only. Re-run with DELETE=1 to remove the orphans above.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
