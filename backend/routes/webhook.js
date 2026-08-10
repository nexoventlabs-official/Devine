import express from 'express';
import crypto from 'crypto';
import logger from '../services/logger.js';
import { channelForPhoneNumberId } from '../services/metaCloud.js';
import { handleMessage, logInbound, handleStatus } from '../services/chatbot.js';

const router = express.Router();

// ---------- GET: webhook verification handshake ----------
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
    return res.json({ status: 'Devine WhatsApp webhook active', timestamp: new Date().toISOString() });
  }
  logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken });
  return res.sendStatus(403);
});

// ---------- POST: incoming messages / statuses ----------
router.post('/', async (req, res) => {
  // Optional signature check (uses raw body captured in server.js)
  if (process.env.WA_APP_SECRET && req.rawBody) {
    const signature = req.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WA_APP_SECRET).update(req.rawBody).digest('hex');
    if (signature && !timingSafeEqual(signature, expected)) {
      logger.warn('Webhook signature mismatch');
      return res.sendStatus(401);
    }
  }

  // Ack Meta immediately to avoid retries/timeouts.
  res.sendStatus(200);

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
          logger.warn('Webhook for unknown phone_number_id', { phoneNumberId });
          continue;
        }

        // Delivery / read / payment statuses
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            handleStatus(channel, status).catch((e) =>
              logger.error('handleStatus error', { channel, error: e.message })
            );
          }
        }

        // Contact names
        const names = {};
        for (const c of value.contacts || []) {
          if (c.wa_id && c.profile?.name) names[c.wa_id] = c.profile.name;
        }

        for (const message of value.messages || []) {
          const msg = parseIncoming(message);
          if (!msg) continue;
          msg.name = names[message.from] || '';
          msg.channel = channel;

          // Log the inbound message to the CRM chat log (non-blocking).
          logInbound(channel, msg.phone, msg.name, msg.type, msg.text || msg.logBody || '', message, message.id).catch(
            () => {}
          );

          handleMessage(channel, msg).catch((e) =>
            logger.error('handleMessage error', { channel, error: e.message, stack: e.stack })
          );
        }
      }
    }
  } catch (err) {
    logger.error('Webhook processing error', { error: err.message, stack: err.stack });
  }
});

/**
 * Normalize an incoming Meta message into the shape the chatbot handlers expect:
 *   { phone, type, text, selectedId, flowResponse, location, order }
 * (chatbotB2B/chatbotB2C destructure `type` and `name`.)
 */
function parseIncoming(message) {
  const phone = message.from;
  const out = { phone, type: 'text', text: '', selectedId: null, logBody: '' };

  switch (message.type) {
    case 'text':
      out.text = message.text?.body || '';
      out.logBody = out.text;
      break;
    case 'interactive': {
      const it = message.interactive || {};
      if (it.type === 'button_reply') {
        out.type = 'button';
        out.selectedId = it.button_reply?.id || '';
        out.text = it.button_reply?.title || '';
        out.logBody = out.text;
      } else if (it.type === 'list_reply') {
        out.type = 'list';
        out.selectedId = it.list_reply?.id || '';
        out.text = it.list_reply?.title || '';
        out.logBody = out.text;
      } else if (it.type === 'nfm_reply') {
        out.type = 'flow';
        out.logBody = 'Flow response';
        try {
          out.flowResponse =
            typeof it.nfm_reply?.response_json === 'string'
              ? JSON.parse(it.nfm_reply.response_json)
              : it.nfm_reply?.response_json || {};
        } catch {
          out.flowResponse = {};
        }
      }
      break;
    }
    case 'location':
      out.type = 'location';
      out.location = {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude,
        name: message.location?.name || '',
        address: message.location?.address || ''
      };
      out.logBody = 'Shared location';
      break;
    case 'order':
      out.type = 'order';
      out.order = message.order || {};
      out.logBody = 'Order message';
      break;
    default:
      out.text = '';
  }

  const hasContent =
    out.text || out.selectedId || out.type === 'location' || out.type === 'order' || out.type === 'flow';
  return hasContent ? out : null;
}

function timingSafeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default router;
