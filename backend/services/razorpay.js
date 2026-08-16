import crypto from 'crypto';

// Razorpay is used as the WhatsApp Native Pay gateway (via the Meta payment
// configuration). This service only verifies the backup Razorpay webhook so we
// can confirm an order even if Meta's payment status callback is delayed/missed.
// Credentials live in backend/.env:
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET

export function isConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function webhookConfigured() {
  return !!process.env.RAZORPAY_WEBHOOK_SECRET;
}

/**
 * Verify the X-Razorpay-Signature header against the raw request body.
 * signature == HMAC_SHA256(rawBody, webhook_secret)
 */
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export default { isConfigured, webhookConfigured, verifyWebhookSignature };
