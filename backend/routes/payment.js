import express from 'express';
import logger from '../services/logger.js';
import { verifyWebhookSignature, webhookConfigured } from '../services/razorpay.js';
import b2c from '../services/chatbotB2C.js';

const router = express.Router();

// Backup payment confirmation path. Meta Native WhatsApp Pay confirms orders via
// the Meta status webhook (handleStatus -> confirmPaidOrder); this Razorpay
// webhook is a safety net that confirms the same order using the reference_id we
// stamp into the Razorpay notes when sending order_details.
//
// Register this URL in Razorpay Dashboard > Settings > Webhooks:
//   https://kavithahostel.me/api/payment/razorpay-webhook
//   events: payment.captured, payment.failed, order.paid
router.post('/razorpay-webhook', async (req, res) => {
  try {
    if (!webhookConfigured()) return res.status(503).json({ status: 'razorpay webhook not configured' });

    const signature = req.headers['x-razorpay-signature'];
    if (!verifyWebhookSignature(req.rawBody, signature)) {
      logger.warn('Razorpay webhook: invalid signature');
      return res.status(400).json({ status: 'invalid signature' });
    }

    const body = req.body || {};
    const event = body.event || '';
    const payEntity = body?.payload?.payment?.entity;
    const orderEntity = body?.payload?.order?.entity;
    const notes = payEntity?.notes || orderEntity?.notes || {};
    const referenceId = notes.reference_id || payEntity?.receipt || orderEntity?.receipt;

    logger.info('Razorpay webhook', { event, referenceId, paymentId: payEntity?.id });

    if (!referenceId) {
      return res.json({ status: 'ok', note: 'no reference_id' });
    }

    if (['payment.captured', 'order.paid', 'payment_link.paid'].includes(event)) {
      await b2c.confirmPaidOrder(referenceId, { transaction: { id: payEntity?.id }, reference_id: referenceId });
    } else if (event === 'payment.failed') {
      await b2c.failPaidOrder(referenceId);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Razorpay webhook error', { error: err.message });
    // Ack with 200 so Razorpay doesn't hammer retries; we've logged it.
    res.json({ status: 'error', message: err.message });
  }
});

// Create Razorpay Order for Website Checkout
router.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ success: false, message: 'Razorpay keys not configured' });
    }

    // Call Razorpay API to create order
    const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // convert to paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error('Razorpay order creation error', { data });
      return res.status(response.status).json({ success: false, message: data.error?.description || 'Razorpay order creation failed' });
    }

    res.json({
      success: true,
      order: data,
      keyId: key_id
    });
  } catch (err) {
    logger.error('Create Razorpay order error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify Razorpay Payment Signature
router.post('/verify-razorpay-order', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature verification parameters' });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const crypto = await import('crypto');
    const expected = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected === razorpay_signature) {
      res.json({ success: true, message: 'Payment signature verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
