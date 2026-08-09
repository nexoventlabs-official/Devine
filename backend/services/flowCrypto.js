// WhatsApp Flows endpoint encryption (RSA-OAEP + AES-GCM), per Meta spec.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let privateKeyCache = null;

function loadPrivateKey() {
  if (privateKeyCache) return privateKeyCache;
  const p = process.env.WA_FLOW_PRIVATE_KEY_PATH || './keys/flow_private.pem';
  const abs = path.isAbsolute(p) ? p : path.join(__dirname, '..', p);
  const pem = fs.readFileSync(abs, 'utf8');
  const passphrase = process.env.WA_FLOW_KEY_PASSPHRASE || '';
  privateKeyCache = crypto.createPrivateKey({ key: pem, passphrase });
  return privateKeyCache;
}

/**
 * Decrypt an incoming Flow data-exchange request.
 * @returns {{ decrypted: object, aesKeyBuffer: Buffer, initialVectorBuffer: Buffer }}
 */
export function decryptRequest(body) {
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = body;
  const privateKey = loadPrivateKey();

  const aesKeyBuffer = crypto.privateDecrypt(
    { key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(encrypted_aes_key, 'base64')
  );

  const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
  const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

  const TAG_LENGTH = 16;
  const encryptedBody = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const authTag = flowDataBuffer.subarray(-TAG_LENGTH);

  const decipher = crypto.createDecipheriv(`aes-${aesKeyBuffer.length * 8}-gcm`, aesKeyBuffer, initialVectorBuffer);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encryptedBody), decipher.final()]);

  return {
    decrypted: JSON.parse(decrypted.toString('utf-8')),
    aesKeyBuffer,
    initialVectorBuffer
  };
}

/**
 * Encrypt the response. IV is the request IV with all bits flipped.
 * @returns {string} base64 ciphertext (Meta expects a raw base64 string body)
 */
export function encryptResponse(responseObj, aesKeyBuffer, initialVectorBuffer) {
  const flippedIv = Buffer.from(initialVectorBuffer.map((b) => ~b & 0xff));
  const cipher = crypto.createCipheriv(`aes-${aesKeyBuffer.length * 8}-gcm`, aesKeyBuffer, flippedIv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(responseObj), 'utf-8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([encrypted, authTag]).toString('base64');
}

export function ensureKeysReadable() {
  try {
    loadPrivateKey();
    return true;
  } catch (err) {
    logger.warn('Flow private key not loadable yet', { error: err.message });
    return false;
  }
}

export default { decryptRequest, encryptResponse, ensureKeysReadable };
