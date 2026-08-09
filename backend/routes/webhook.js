import express from 'express';
import crypto from 'crypto';
import { channelForPhoneNumberId, getClient } from '../services/metaCloud.js';
import { handleMessage, logInbound, triggerReview } from '../services/chatbot.js';
import Message from '../models/Message.js';
import Order from '../models/Order.js';
import { emitOrder } from '../services/eventBus.js';
import logger from '../services/logger.js';

const router = express.Router();

// ---- GET: webhook verification handshake ----
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (!verifyToken) {
    logger.error('WA_VERIFY_TOKEN not configured');
    return res.sendStatus(500);
  }
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  if (!mode && !token) {
    return res.json({ status: 'Webhook active', ts: new Date().toISOString() });
  }
  return res.sendStatus(403);
});

// Verify Meta payload signature (optional but recommended).
function verifySignature(req) {
  const secret = process.env.WA_APP_SECRET;
  if (!secret) return true; // skip if not configured
  const sig = req.get('x-hub-signature-256');
  if (!sig || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// ---- POST: receive messages/status ----
router.post('/', async (req, res) => {
  // Respond immediately so Meta doesn't retry/timeout.
  res.sendStatus(200);

  if (!verifySignature(req)) {
    logger.warn('Webhook signature verification failed');
    return;
  }

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value || {};
        const phoneNumberId = value.metadata?.phone_number_id;
        const channel = channelForPhoneNumberId(phoneNumberId);
        if (!channel) {
          logger.warn('Unknown phone_number_id on webhook', { phoneNumberId });
          continue;
        }

        // Delivery/read/payment statuses
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleStatus(channel, status);
          }
        }

        // Inbound messages
        const contacts = value.contacts || [];
        const nameMap = {};
        for (const c of contacts) if (c.wa_id) nameMap[c.wa_id] = c.profile?.name || '';

        for (const message of value.messages || []) {
          const norm = normalizeMessage(message);
          if (!norm) continue;
          norm.name = nameMap[message.from] || '';

          await logInbound(channel, norm.phone, norm.name, norm.logType, norm.logBody, message, message.id);

          handleMessage(channel, norm).catch((err) =>
            logger.error('handleMessage error', { channel, error: err.message, stack: err.stack })
          );
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, stack: err.stack });
  }
});

function normalizeMessage(message) {
  const phone = message.from;
  const base = { phone, text: '', type: 'text', selectedId: null, flowResponse: null, location: null };

  switch (message.type) {
    case 'text':
      return { ...base, text: message.text?.body || '', logType: 'text', logBody: message.text?.body || '' };

    case 'interactive': {
      const it = message.interactive || {};
      if (it.type === 'button_reply') {
        return { ...base, type: 'button', selectedId: it.button_reply?.id, text: it.button_reply?.title, logType: 'interactive', logBody: it.button_reply?.title };
      }
      if (it.type === 'list_reply') {
        return { ...base, type: 'list', selectedId: it.list_reply?.id, text: it.list_reply?.title, logType: 'interactive', logBody: it.list_reply?.title };
      }
      if (it.type === 'nfm_reply') {
        let data = {};
        try {
          data = typeof it.nfm_reply?.response_json === 'string'
            ? JSON.parse(it.nfm_reply.response_json)
            : it.nfm_reply?.response_json || {};
        } catch { data = {}; }
        return { ...base, type: 'flow', flowResponse: data, logType: 'flow', logBody: 'Flow response' };
      }
      return null;
    }

    case 'location':
      return {
        ...base,
        type: 'location',
        location: {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          address: message.location?.address || message.location?.name || ''
        },
        logType: 'location',
        logBody: 'Shared location'
      };

    default:
      return null;
  }
}

async function handleStatus(channel, status) {
  // Native WhatsApp payment status
  if (status.type === 'payment' || status.payment) {
    const info = status.payment || {};
    const txn = info.transaction || {};
    const referenceId = info.reference_id || txn.id;
    const payStatus = txn.status;
    try {
      const order = await Order.findOne({ orderId: referenceId });
      if (order) {
        if (payStatus === 'success' || payStatus === 'completed') {
          order.paymentStatus = 'paid';
          order.status = order.status === 'pending' ? 'confirmed' : order.status;
          await order.save();
          emitOrder(order);
          // Confirm to the customer + send live tracking link.
          try {
            const wa = getClient('b2c');
            const trackUrl = `${(process.env.FRONTEND_BASE_URL || '').replace(/\/$/, '')}/track?order=${order.orderId}`;
            const body =
              `✅ *Payment received! Order Confirmed, ${order.customer?.name || 'there'}!*\n\n` +
              `*Order ID:* ${order.orderId}\n*Total:* Rs.${order.totalAmount} (Paid)\n\n` +
              "We'll send tracking updates as your order moves.";
            await wa.sendCtaUrl(order.customer.phone, body, 'Track Order', trackUrl);
          } catch (e) {
            logger.warn('Post-payment confirmation send failed', { error: e.message });
          }
          return;
        } else if (payStatus === 'failed' || payStatus === 'canceled') {
          order.paymentStatus = payStatus === 'canceled' ? 'cancelled' : 'failed';
        }
        await order.save();
        emitOrder(order);
      }
    } catch (err) {
      logger.error('Payment status handling error', { error: err.message });
    }
    return;
  }

  // Message delivery/read/failed
  if (status.id && status.status) {
    const map = { delivered: 'delivered', read: 'read', failed: 'failed', sent: 'sent' };
    const st = map[status.status];
    if (st) {
      Message.findOneAndUpdate({ metaMessageId: status.id }, { $set: { status: st } }).catch(() => {});
    }
  }
}

export default router;
