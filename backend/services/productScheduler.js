// Product availability scheduler (ESM, node-cron).
// - Every minute: enforce recurring sold-out schedules + legacy soldOutUntil,
//   flipping product.inStock and resyncing availability to the Meta catalog.
// - Nightly 2 AM: full catalog resync so latest ratings/descriptions refresh.
import cron from 'node-cron';
import Product from '../models/Product.js';
import catalogService from './catalogService.js';
import logger from './logger.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nowInIST() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  }).formatToParts(new Date());
  let hours = 0;
  let minutes = 0;
  let weekday = 'Sun';
  for (const p of parts) {
    if (p.type === 'hour') hours = parseInt(p.value, 10) % 24;
    if (p.type === 'minute') minutes = parseInt(p.value, 10);
    if (p.type === 'weekday') weekday = p.value;
  }
  return { minutesOfDay: hours * 60 + minutes, weekday };
}

function toMin(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Is the current time within [start,end)? Handles overnight windows.
function withinWindow(startHHMM, endHHMM, cur) {
  if (!startHHMM || !endHHMM) return false;
  const s = toMin(startHHMM);
  const e = toMin(endHHMM);
  if (e <= s) return cur >= s || cur < e; // overnight
  return cur >= s && cur < e;
}

function isMalformed(sch) {
  if (!sch) return true;
  if (sch.type === 'daily') return !sch.dailyStartTime || !sch.dailyEndTime;
  if (sch.type === 'custom') {
    const days = Array.isArray(sch.days) ? sch.days : [];
    return !days.some((d) => d && d.enabled && d.startTime && d.endTime);
  }
  return true;
}

function isWithinSchedule(sch, { minutesOfDay, weekday }) {
  if (sch.type === 'daily') return withinWindow(sch.dailyStartTime, sch.dailyEndTime, minutesOfDay);
  if (sch.type === 'custom') {
    const day = (sch.days || []).find((d) => d.day === weekday && d.enabled);
    if (!day) return false;
    return withinWindow(day.startTime, day.endTime, minutesOfDay);
  }
  return false;
}

async function enforceSchedules() {
  const t = nowInIST();

  // Recurring schedules
  const scheduled = await Product.find({ 'soldOutSchedule.enabled': true });
  for (const p of scheduled) {
    try {
      if (isMalformed(p.soldOutSchedule)) {
        p.soldOutSchedule.enabled = false;
        p.inStock = true;
        await p.save();
        catalogService.syncProductToMeta(p).catch(() => {});
        continue;
      }
      const shouldBeAvailable = isWithinSchedule(p.soldOutSchedule, t);
      const desiredInStock = shouldBeAvailable;
      if (p.inStock !== desiredInStock) {
        p.inStock = desiredInStock;
        await p.save();
        logger.info('[ProductScheduler] availability changed', { name: p.name, inStock: desiredInStock });
        catalogService.syncProductToMeta(p).catch(() => {});
      }
    } catch (err) {
      logger.warn('[ProductScheduler] schedule check failed', { id: String(p._id), error: err.message });
    }
  }

  // Legacy one-time soldOutUntil (auto-resume after the time passes)
  const timed = await Product.find({ soldOutUntil: { $ne: null, $exists: true } });
  for (const p of timed) {
    try {
      if (!p.soldOutUntil) continue;
      if (t.minutesOfDay >= toMin(p.soldOutUntil)) {
        p.inStock = true;
        p.soldOutUntil = null;
        await p.save();
        catalogService.syncProductToMeta(p).catch(() => {});
      }
    } catch (err) {
      logger.warn('[ProductScheduler] soldOutUntil check failed', { id: String(p._id), error: err.message });
    }
  }
}

export function startProductScheduler() {
  if (!process.env.MONGODB_URI) return;

  // Every minute — enforce availability windows.
  cron.schedule('* * * * *', () => {
    enforceSchedules().catch((err) => logger.error('[ProductScheduler] tick error', { error: err.message }));
  });

  // Nightly 2 AM IST — full catalog resync (ratings + descriptions refresh).
  cron.schedule(
    '0 2 * * *',
    async () => {
      try {
        const res = await catalogService.syncRatingsToMeta();
        logger.info('[ProductScheduler] nightly catalog resync done', res);
      } catch (err) {
        logger.error('[ProductScheduler] nightly resync error', { error: err.message });
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  logger.info('[ProductScheduler] started (per-minute availability + nightly 2AM resync)');
}

export default { startProductScheduler };
