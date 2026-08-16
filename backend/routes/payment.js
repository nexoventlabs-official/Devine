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

export default router;
