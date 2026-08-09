// Deep detail for the two B2B draft flows to diagnose publish failure.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const token = process.env.WA_B2B_TOKEN;
const wabaId = process.env.WA_B2B_WABA_ID;
const headers = { Authorization: `Bearer ${token}` };

const { data } = await axios.get(`${GRAPH}/${wabaId}/flows?fields=id,name,status&limit=100`, { headers });
const drafts = (data.data || []).filter((f) => f.status === 'DRAFT');

for (const f of drafts) {
  console.log(`\n===== ${f.name} (${f.id}) =====`);
  try {
    const res = await axios.get(
      `${GRAPH}/${f.id}?fields=id,name,status,categories,validation_errors,json_version,data_api_version,endpoint_uri,health_status,preview`,
      { headers }
    );
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('  detail ERROR:', e.response?.data?.error?.message || e.message);
  }
}
