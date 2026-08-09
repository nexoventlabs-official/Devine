// Channel dispatcher: logs to CRM and routes to the right handler.
import * as b2b from './chatbotB2B.js';
import * as b2c from './chatbotB2C.js';
import Message from '../models/Message.js';
import { emitMessage } from './eventBus.js';
import logger from './logger.js';

// Persist an inbound message to the CRM chat log.
export async function logInbound(channel, phone, name, type, body, raw, metaMessageId) {
  try {
    const doc = await Message.create({
      channel,
      phone,
      name: name || '',
      direction: 'in',
      type,
      body: typeof body === 'string' ? body : JSON.stringify(body || ''),
      raw,
      metaMessageId
    });
    emitMessage(doc);
    return doc;
  } catch (err) {
    logger.warn('logInbound failed', { error: err.message });
  }
}

// Route a normalized message to the channel handler.
export async function handleMessage(channel, msg) {
  const handler = channel === 'b2b' ? b2b : b2c;
  return handler.handle(msg);
}

// Trigger review flow (called after delivery).
export async function triggerReview(phone, orderId) {
  return b2c.startReview(phone, orderId);
}

export default { logInbound, handleMessage, triggerReview };
