import cron from 'node-cron';
import Template from '../models/Template.js';
import DealerProfile from '../models/DealerProfile.js';
import { getClient } from './metaCloud.js';
import { renderTemplate } from './templates.js';
import Message from '../models/Message.js';
import logger from './logger.js';

// Send a stored template (by key) to one dealer.
async function sendTemplateTo(key, dealer, extraCtx = {}) {
  const template = await Template.findOne({ key });
  if (!template) return;
  const wa = getClient('b2b');
  const body = renderTemplate(template.body, {
    Name: dealer.name,
    'City/District': dealer.city || dealer.district,
    City: dealer.city,
    Manager: dealer.areaManagerName,
    Number: dealer.areaManagerPhone,
    ...extraCtx
  });
  const replyButtons = (template.buttons || []).filter((b) => b.kind === 'reply');
  try {
    if (replyButtons.length) {
      await wa.sendButtons(dealer.phone, body, replyButtons.map((b) => ({ id: b.payload, text: b.text })));
    } else {
      await wa.sendText(dealer.phone, body);
    }
    await Message.create({ channel: 'b2b', phone: dealer.phone, name: dealer.name, direction: 'out', type: 'template', body });
  } catch (err) {
    logger.warn('Scheduled template send failed', { key, phone: dealer.phone, error: err.message });
  }
}

// Kick off the dealer welcome sequence: msg2 at +10min, msg3 at +1hr.
export function scheduleDealerWelcome(dealer) {
  setTimeout(() => sendTemplateTo('dealer_welcome_2', dealer).catch(() => {}), 10 * 60 * 1000);
  setTimeout(() => sendTemplateTo('dealer_welcome_3', dealer).catch(() => {}), 60 * 60 * 1000);
}

// Register recurring broadcasts.
export function startSchedulers() {
  // Weekly broadcast — every Monday 10:00 AM IST
  cron.schedule(
    '0 10 * * 1',
    async () => {
      const dealers = await DealerProfile.find({ status: 'Active' }).lean();
      const date = new Date().toLocaleDateString('en-IN');
      for (const d of dealers) await sendTemplateTo('weekly_broadcast', d, { Date: date });
      logger.info('Weekly broadcast dispatched', { count: dealers.length });
    },
    { timezone: 'Asia/Kolkata' }
  );

  // Restock alert — daily 11 AM, dealers with no order in 30 days
  cron.schedule(
    '0 11 * * *',
    async () => {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const dealers = await DealerProfile.find({
        status: 'Active',
        $or: [{ lastOrderAt: { $lt: cutoff } }, { lastOrderAt: { $exists: false } }]
      }).lean();
      for (const d of dealers) await sendTemplateTo('restock_alert', d);
      logger.info('Restock alerts dispatched', { count: dealers.length });
    },
    { timezone: 'Asia/Kolkata' }
  );

  logger.info('CRM schedulers started');
}

export default { startSchedulers, scheduleDealerWelcome };
