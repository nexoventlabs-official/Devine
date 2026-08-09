import crypto from 'crypto';

// Short human-friendly ids, e.g. DVN-B2C-4F9A2C
export function genOrderId(prefix = 'DVN') {
  return `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function genDealerId() {
  return `DVN-${crypto.randomInt(1000, 9999)}`;
}

export default { genOrderId, genDealerId };
