// Produce the FLOW_PRIVATE_KEY_B64 value for Render, and self-test that our
// crypto round-trips an encrypted ping exactly like Meta would.
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const privPem = fs.readFileSync(path.join(__dirname, '../keys/flow_private.pem'), 'utf8');
const pubPem = fs.readFileSync(path.join(__dirname, '../keys/flow_public.pem'), 'utf8');
const b64 = Buffer.from(privPem, 'utf8').toString('base64');

// Write the env value to a copy-paste file (gitignored keys dir).
const outPath = path.join(__dirname, '../keys/FLOW_PRIVATE_KEY_B64.txt');
fs.writeFileSync(outPath, b64);
console.log('FLOW_PRIVATE_KEY_B64 written to backend/keys/FLOW_PRIVATE_KEY_B64.txt');
console.log('Length:', b64.length, 'chars');
console.log('WA_FLOW_KEY_PASSPHRASE =', process.env.WA_FLOW_KEY_PASSPHRASE);

// ---- Self-test: simulate Meta's encrypted ping and our decrypt+respond ----
process.env.FLOW_PRIVATE_KEY_B64 = b64; // force env path in flowCrypto
const { decryptRequest, encryptResponse } = await import('../services/flowCrypto.js');

const aesKey = crypto.randomBytes(16);
const iv = crypto.randomBytes(16);
const pub = crypto.createPublicKey(pubPem);
const encryptedAesKey = crypto.publicEncrypt(
  { key: pub, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  aesKey
).toString('base64');

const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
const plaintext = JSON.stringify({ action: 'ping', version: '3.0' });
const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();
const encrypted_flow_data = Buffer.concat([enc, tag]).toString('base64');

const body = { encrypted_aes_key: encryptedAesKey, encrypted_flow_data, initial_vector: iv.toString('base64') };
const { decrypted, aesKeyBuffer, initialVectorBuffer } = decryptRequest(body);
console.log('\nDecrypted request:', JSON.stringify(decrypted));

// Build ping response and decrypt it back the way Meta would.
const respB64 = encryptResponse({ data: { status: 'active' } }, aesKeyBuffer, initialVectorBuffer);
const respBuf = Buffer.from(respB64, 'base64');
const flippedIv = Buffer.from(initialVectorBuffer.map((x) => ~x & 0xff));
const respTag = respBuf.subarray(-16);
const respCipher = respBuf.subarray(0, -16);
const decipher = crypto.createDecipheriv('aes-128-gcm', aesKeyBuffer, flippedIv);
decipher.setAuthTag(respTag);
const respPlain = Buffer.concat([decipher.update(respCipher), decipher.final()]).toString('utf8');
console.log('Round-trip ping response:', respPlain);
console.log(respPlain === '{"data":{"status":"active"}}' ? '\nSELF-TEST PASSED ✅' : '\nSELF-TEST FAILED ❌');
