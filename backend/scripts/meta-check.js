// Connectivity check: validates B2B + B2C tokens / WABA / phone number IDs.
// Run: node scripts/meta-check.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

const channels = [
  {
    name: 'B2B',
    token: process.env.WA_B2B_TOKEN,
    phoneNumberId: process.env.WA_B2B_PHONE_NUMBER_ID,
    wabaId: process.env.WA_B2B_WABA_ID
  },
  {
    name: 'B2C',
    token: process.env.WA_B2C_TOKEN,
    phoneNumberId: process.env.WA_B2C_PHONE_NUMBER_ID,
    wabaId: process.env.WA_B2C_WABA_ID
  }
];

async function check(ch) {
  console.log(`\n===== ${ch.name} =====`);
  const headers = { Authorization: `Bearer ${ch.token}` };
  // 1. Phone number info
  try {
    const { data } = await axios.get(`${GRAPH}/${ch.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`, { headers });
    console.log(`  phone#: ${data.display_phone_number}  name: ${data.verified_name}  quality: ${data.quality_rating}`);
  } catch (e) {
    console.log(`  phone# ERROR: ${e.response?.data?.error?.message || e.message}`);
  }
  // 2. WABA flows
  try {
    const { data } = await axios.get(`${GRAPH}/${ch.wabaId}/flows?fields=id,name,status&limit=100`, { headers });
    console.log(`  flows (${data.data?.length || 0}):`, (data.data || []).map((f) => `${f.name}[${f.status}]`).join(', ') || '(none)');
  } catch (e) {
    console.log(`  flows ERROR: ${e.response?.data?.error?.message || e.message}`);
  }
  // 3. Message templates
  try {
    const { data } = await axios.get(`${GRAPH}/${ch.wabaId}/message_templates?fields=name,status&limit=100`, { headers });
    console.log(`  templates (${data.data?.length || 0}):`, (data.data || []).map((t) => `${t.name}[${t.status}]`).join(', ') || '(none)');
  } catch (e) {
    console.log(`  templates ERROR: ${e.response?.data?.error?.message || e.message}`);
  }
}

for (const ch of channels) {
  // eslint-disable-next-line no-await-in-loop
  await check(ch);
}
console.log('\nDone.');
