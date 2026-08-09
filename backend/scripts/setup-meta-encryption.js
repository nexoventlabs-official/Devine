// Register the EXISTING local public key on both WABAs' phone numbers and
// subscribe both WABAs to the app's webhooks. Does NOT regenerate keys.
// Run: node scripts/setup-meta-encryption.js
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

const publicKey = fs.readFileSync(path.join(__dirname, '../keys/flow_public.pem'), 'utf8');

const channels = [
  { name: 'B2B', token: process.env.WA_B2B_TOKEN, phoneId: process.env.WA_B2B_PHONE_NUMBER_ID, wabaId: process.env.WA_B2B_WABA_ID },
  { name: 'B2C', token: process.env.WA_B2C_TOKEN, phoneId: process.env.WA_B2C_PHONE_NUMBER_ID, wabaId: process.env.WA_B2C_WABA_ID }
];

for (const ch of channels) {
  console.log(`\n===== ${ch.name} =====`);
  const headers = { Authorization: `Bearer ${ch.token}` };

  // 1. Subscribe WABA to the app's webhooks (required for Flows health).
  try {
    const { data } = await axios.post(`${GRAPH}/${ch.wabaId}/subscribed_apps`, {}, { headers });
    console.log('  subscribed_apps:', JSON.stringify(data));
  } catch (e) {
    console.log('  subscribe FAILED:', e.response?.data?.error?.message || e.message);
  }

  // 2. Register the business public key on the phone number.
  try {
    const { data } = await axios.post(
      `${GRAPH}/${ch.phoneId}/whatsapp_business_encryption`,
      new URLSearchParams({ business_public_key: publicKey }),
      { headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('  public key upload:', JSON.stringify(data));
  } catch (e) {
    console.log('  public key upload FAILED:', e.response?.data?.error?.message || e.message);
  }

  // 3. Read back registration status.
  try {
    const { data } = await axios.get(`${GRAPH}/${ch.phoneId}/whatsapp_business_encryption`, { headers });
    console.log('  registration status:', data?.business_public_key_signature_status || 'n/a', '| key present:', !!data?.business_public_key);
  } catch (e) {
    console.log('  status read FAILED:', e.response?.data?.error?.message || e.message);
  }
}
console.log('\nDone.');
