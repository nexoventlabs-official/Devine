import express from 'express';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import Template from '../models/Template.js';
import DealerProfile from '../models/DealerProfile.js';
import Conversation from '../models/Conversation.js';
import Product from '../models/Product.js';
import { getClient } from '../services/metaCloud.js';
import { renderTemplate } from '../services/templates.js';
import logger from '../services/logger.js';

const router = express.Router();

// ---- Chat threads: distinct phones with last message ----
router.get('/threads', auth, async (req, res) => {
  const channel = req.query.channel || 'b2b';
  const threads = await Message.aggregate([
    { $match: { channel } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$phone',
        names: { $push: '$name' },
        lastBody: { $first: '$body' },
        lastAt: { $first: '$createdAt' },
        lastDirection: { $first: '$direction' }
      }
    },
    // Prefer the most recent non-empty name (outbound bot messages have none).
    { $addFields: { name: { $first: { $filter: { input: '$names', cond: { $ne: ['$$this', ''] } } } } } },
    { $project: { names: 0 } },
    { $sort: { lastAt: -1 } },
    { $limit: 200 }
  ]);
  res.json({ success: true, data: threads });
});

// ---- Messages for a phone (enriched with rich order/location/flow data) ----
router.get('/messages/:phone', auth, async (req, res) => {
  const channel = req.query.channel || 'b2b';
  const msgs = await Message.find({ channel, phone: req.params.phone }).sort({ createdAt: 1 }).limit(500).lean();

  // Resolve product names/images for any order messages in this thread.
  const baseIds = new Set();
  for (const m of msgs) {
    const items = m?.raw?.order?.product_items || [];
    for (const it of items) {
      const base = String(it.product_retailer_id || '').split('__v')[0];
      if (base) baseIds.add(base);
    }
  }
  let prodMap = {};
  if (baseIds.size) {
    const prods = await Product.find({ retailerId: { $in: [...baseIds] } })
      .select('name imageUrl retailerId variants unit')
      .lean();
    prodMap = Object.fromEntries(prods.map((p) => [p.retailerId, p]));
  }

  const data = msgs.map((m) => ({ ...m, rich: buildRich(m, prodMap) }));
  res.json({ success: true, data });
});

// Build a structured "rich" payload from the raw WhatsApp message so the CRM
// can render orders, locations and flow responses instead of flat labels.
function buildRich(m, prodMap = {}) {
  const raw = m.raw || {};

  // Outbound bot/agent message with an image/doc header, buttons, CTA or flow.
  if (m.direction === 'out' && raw.outbound) {
    const o = raw.outbound;
    const hasRich = o.headerImageUrl || o.headerDocName || (o.buttons && o.buttons.length) || o.cta || o.flowCta || (o.listSections && o.listSections.length);
    if (!hasRich) return null; // plain text -> normal bubble
    return {
      kind: 'bot',
      headerImageUrl: o.headerImageUrl || '',
      headerDocName: o.headerDocName || '',
      body: o.body || m.body || '',
      footer: o.footer || '',
      buttons: o.buttons || [],
      cta: o.cta || null,
      listSections: o.listSections || []
    };
  }

  if (m.direction === 'in' && m.type === 'order' && raw.order) {
    const order = raw.order;
    const items = (order.product_items || []).map((it) => {
      const rid = String(it.product_retailer_id || '');
      const base = rid.split('__v')[0];
      const p = prodMap[base];
      let name = p?.name || rid;
      let image = p?.imageUrl || '';
      let variantLabel = '';
      const vm = /__v(\d+)$/.exec(rid);
      if (p && vm) {
        const v = (p.variants || [])[Number(vm[1])];
        if (v) {
          variantLabel = v.label || (v.quantity ? `${v.quantity} ${v.unit || ''}`.trim() : '');
          if (v.imageUrl) image = v.imageUrl;
        }
      }
      const qty = Number(it.quantity || 1);
      const price = Number(it.item_price || 0);
      return { retailerId: rid, name, variantLabel, image, qty, price, currency: it.currency || 'INR', lineTotal: qty * price };
    });
    const total = items.reduce((s, i) => s + i.lineTotal, 0);
    const currency = items[0]?.currency || 'INR';
    return { kind: 'order', items, total, currency, note: order.text || '', catalogId: order.catalog_id || '' };
  }

  if (m.direction === 'in' && m.type === 'location' && raw.location) {
    const { latitude, longitude, name, address } = raw.location;
    const mapUrl = latitude != null && longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : '';
    return { kind: 'location', latitude, longitude, name: name || '', address: address || '', mapUrl };
  }

  if (m.direction === 'in' && m.type === 'flow') {
    let resp = {};
    try {
      const rj = raw?.interactive?.nfm_reply?.response_json;
      resp = typeof rj === 'string' ? JSON.parse(rj) : (rj || {});
    } catch { resp = {}; }
    const HIDE = /^(flow_token|_.*|.*token.*|.*version.*)$/i;
    const fields = Object.entries(resp)
      .filter(([k, v]) => !HIDE.test(k) && v != null && v !== '' && typeof v !== 'object')
      .map(([k, v]) => ({ label: prettyKey(k), value: String(v) }));
    return { kind: 'flow', fields };
  }

  return null;
}

function prettyKey(k) {
  return String(k)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// ---- Send a free-form message (within 24h window) ----
router.post('/send', auth, async (req, res) => {
  try {
    const { channel = 'b2b', phone, body } = req.body;
    const wa = getClient(channel);
    await wa.sendText(phone, body); // logged centrally by metaCloud outbound logger
    res.json({ success: true });
  } catch (err) {
    logger.error('CRM send error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Templates CRUD ----
router.get('/templates', auth, async (req, res) => {
  const filter = {};
  if (req.query.channel) filter.channel = { $in: [req.query.channel, 'both'] };
  const templates = await Template.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: templates });
});

router.post('/templates', auth, async (req, res) => {
  const t = await Template.create(req.body);
  res.status(201).json({ success: true, data: t });
});

router.put('/templates/:id', auth, async (req, res) => {
  const t = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: t });
});

router.delete('/templates/:id', auth, async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ---- Trigger a template to one recipient or a segment ----
router.post('/templates/:id/trigger', auth, async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });

    const channel = template.channel === 'both' ? req.body.channel || 'b2b' : template.channel;
    const wa = getClient(channel);

    // Resolve recipients: explicit phone, or a dealer segment
    let recipients = [];
    if (req.body.phone) {
      recipients = [{ phone: req.body.phone, name: req.body.name || '' }];
    } else if (req.body.segment === 'dealers') {
      const dealers = await DealerProfile.find({ status: 'Active' }).lean();
      recipients = dealers.map((d) => ({ phone: d.phone, name: d.name, ctx: d }));
    } else if (Array.isArray(req.body.recipients)) {
      recipients = req.body.recipients;
    }

    let sent = 0;
    for (const r of recipients) {
      const body = renderTemplate(template.body, { Name: r.name, City: r.ctx?.city, ...r.ctx });
      try {
        if (template.metaTemplateName) {
          await wa.sendTemplate(r.phone, template.metaTemplateName, {
            headerImageUrl: template.headerUrl || null,
            bodyParams: req.body.bodyParams || []
          });
        } else if (template.headerType === 'image' && template.headerUrl) {
          await wa.sendImageWithButtons(r.phone, template.headerUrl, body,
            (template.buttons || []).filter((b) => b.kind === 'reply').map((b) => ({ id: b.payload, text: b.text })));
        } else {
          const replyButtons = (template.buttons || []).filter((b) => b.kind === 'reply');
          if (replyButtons.length) {
            await wa.sendButtons(r.phone, body, replyButtons.map((b) => ({ id: b.payload, text: b.text })));
          } else {
            await wa.sendText(r.phone, body);
          }
        }
        sent++; // outbound logged centrally by metaCloud
      } catch (err) {
        logger.warn('Template trigger send failed', { phone: r.phone, error: err.message });
      }
    }
    res.json({ success: true, sent, total: recipients.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
