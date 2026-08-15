import cron from 'node-cron';
import Template from '../models/Template.js';
import DealerProfile from '../models/DealerProfile.js';
import { getClient } from './metaCloud.js';
import { renderTemplate } from './templates.js';
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
    // Outbound logged centrally by metaCloud outbound logger.
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

  // Festival alert — daily 9 AM check; fires exactly 21 days before a festival.
  cron.schedule(
    '0 9 * * *',
    async () => {
      const festival = festivalExactly21DaysAway();
      if (!festival) return;
      const dealers = await DealerProfile.find({ status: 'Active' }).lean();
      for (const d of dealers) await sendTemplateTo('festival_alert', d, { Festival: festival, X: '30' });
      logger.info('Festival alerts dispatched', { festival, count: dealers.length });
    },
    { timezone: 'Asia/Kolkata' }
  );

  logger.info('CRM schedulers started');
}

// Major Indian festival dates. Update yearly (or move to a Setting in admin).
const FESTIVALS = [
  { name: 'Pongal', date: '2027-01-14' },
  { name: 'Tamil New Year', date: '2026-04-14' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Navratri', date: '2026-10-11' },
  { name: 'Christmas', date: '2026-12-25' },
  { name: 'Onam', date: '2026-08-26' }
];

function festivalExactly21DaysAway() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const f of FESTIVALS) {
    const d = new Date(f.date);
    d.setHours(0, 0, 0, 0);
    const days = Math.round((d - today) / 86400000);
    if (days === 21) return f.name;
  }
  return null;
}

export default { startSchedulers, scheduleDealerWelcome };
