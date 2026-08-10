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

// Handle delivery / read / payment status callbacks from the webhook.
export async function handleStatus(channel, status) {
  try {
    // Native WhatsApp Pay result arrives as a status with a `payment` object.
    const payment = status?.payment;
    if (payment) {
      const referenceId = payment.reference_id || payment.receipt || status.id;
      const state = (payment.status || payment.transaction?.status || '').toLowerCase();
      logger.info('Payment status', { channel, referenceId, state });
      if (['captured', 'success', 'completed', 'paid'].includes(state)) {
        await b2c.confirmPaidOrder(referenceId, payment);
      } else if (['failed', 'cancelled', 'canceled', 'declined'].includes(state)) {
        await b2c.failPaidOrder(referenceId);
      }
      return;
    }
    // Plain message delivery/read receipts — update CRM status best-effort.
    if (status?.id && status?.status) {
      await Message.updateOne({ metaMessageId: status.id }, { $set: { deliveryStatus: status.status } }).catch(() => {});
    }
  } catch (err) {
    logger.warn('handleStatus failed', { channel, error: err.message });
  }
}

export default { logInbound, handleMessage, triggerReview, handleStatus };
