// Attempt to publish the two B2B draft flows and print the exact Meta error.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const headers = { Authorization: `Bearer ${process.env.WA_B2B_TOKEN}` };

const ids = {
  'Export Supply': '1706097863947395',
  'Dealer Registration': '1046111508296564'
};

for (const [name, id] of Object.entries(ids)) {
  try {
    const { data } = await axios.post(`${GRAPH}/${id}/publish`, {}, { headers });
    console.log(`${name}: PUBLISHED ✓`, JSON.stringify(data));
  } catch (e) {
    console.log(`${name}: publish FAILED ->`, JSON.stringify(e.response?.data?.error || e.message, null, 2));
  }
}
