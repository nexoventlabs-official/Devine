// Generate an RSA-2048 keypair for WhatsApp Flows endpoint encryption and
// upload the PUBLIC key to both WABAs (B2B + B2C).
// Run: node scripts/generateFlowKeys.js
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const KEYS_DIR = path.join(__dirname, '..', 'keys');
const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

function generate() {
  const passphrase = process.env.WA_FLOW_KEY_PASSPHRASE || 'devine_flow_2026';
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
  });
  if (!fs.existsSync(KEYS_DIR)) fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(path.join(KEYS_DIR, 'flow_private.pem'), privateKey);
  fs.writeFileSync(path.join(KEYS_DIR, 'flow_public.pem'), publicKey);
  console.log('Keys written to backend/keys/');
  return { publicKey };
}

async function uploadPublicKey(channel, publicKey) {
  const cfg =
    channel === 'b2b'
      ? { token: process.env.WA_B2B_TOKEN, phoneId: process.env.WA_B2B_PHONE_NUMBER_ID }
      : { token: process.env.WA_B2C_TOKEN, phoneId: process.env.WA_B2C_PHONE_NUMBER_ID };
  try {
    const { data } = await axios.post(
      `${GRAPH}/${cfg.phoneId}/whatsapp_business_encryption`,
      new URLSearchParams({ business_public_key: publicKey }),
      { headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(`[${channel}] public key uploaded:`, data);
  } catch (err) {
    console.error(`[${channel}] public key upload failed:`, err.response?.data || err.message);
  }
}

(async () => {
  const { publicKey } = generate();
  await uploadPublicKey('b2b', publicKey);
  await uploadPublicKey('b2c', publicKey);
  console.log('\nDone. Keep backend/keys/flow_private.pem secret (gitignored).');
})();
