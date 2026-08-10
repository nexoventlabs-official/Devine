import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

async function list(label, token, wabaId) {
  const { data } = await axios.get(`${GRAPH}/${wabaId}/flows?fields=id,name,status&limit=100`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(`\n=== ${label} ===`);
  (data.data || []).forEach((f) => console.log(String(f.status).padEnd(10), f.name, `(${f.id})`));
}

await list('B2B', process.env.WA_B2B_TOKEN, process.env.WA_B2B_WABA_ID);
await list('B2C', process.env.WA_B2C_TOKEN, process.env.WA_B2C_WABA_ID);
