// Dump the Flow JSON for the two B2B draft flows so we can build the endpoint handler.
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const token = process.env.WA_B2B_TOKEN;
const wabaId = process.env.WA_B2B_WABA_ID;
const headers = { Authorization: `Bearer ${token}` };

const outDir = path.join(__dirname, '../flows');
fs.mkdirSync(outDir, { recursive: true });

const { data } = await axios.get(`${GRAPH}/${wabaId}/flows?fields=id,name,status&limit=100`, { headers });
for (const f of data.data || []) {
  try {
    const assets = await axios.get(`${GRAPH}/${f.id}/assets`, { headers });
    const asset = assets.data?.data?.[0];
    if (!asset?.download_url) {
      console.log(`- ${f.name}: no downloadable asset`);
      continue;
    }
    const json = await axios.get(asset.download_url);
    const safeName = f.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    const file = path.join(outDir, `${safeName}.json`);
    fs.writeFileSync(file, JSON.stringify(json.data, null, 2));
    const screens = (json.data.screens || []).map((s) => s.id).join(', ');
    console.log(`✓ ${f.name} [${f.status}] -> ${path.basename(file)}  screens: ${screens}`);
  } catch (e) {
    console.log(`- ${f.name}: ${e.response?.status || ''} ${e.response?.data?.error?.message || e.message}`);
  }
}
console.log('\nSaved to backend/flows/');
