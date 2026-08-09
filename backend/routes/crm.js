import express from 'express';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import Template from '../models/Template.js';
import DealerProfile from '../models/DealerProfile.js';
import Conversation from '../models/Conversation.js';
import { getClient } from '../services/metaCloud.js';
import { emitMessage } from '../services/eventBus.js';
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
        name: { $first: '$name' },
        lastBody: { $first: '$body' },
        lastAt: { $first: '$createdAt' },
        lastDirection: { $first: '$direction' }
      }
    },
    { $sort: { lastAt: -1 } },
    { $limit: 200 }
  ]);
  res.json({ success: true, data: threads });
});

// ---- Messages for a phone ----
router.get('/messages/:phone', auth, async (req, res) => {
  const channel = req.query.channel || 'b2b';
  const msgs = await Message.find({ channel, phone: req.params.phone }).sort({ createdAt: 1 }).limit(500);
  res.json({ success: true, data: msgs });
});

// ---- Send a free-form message (within 24h window) ----
router.post('/send', auth, async (req, res) => {
  try {
    const { channel = 'b2b', phone, body } = req.body;
    const wa = getClient(channel);
    const result = await wa.sendText(phone, body);
    const doc = await Message.create({
      channel, phone, direction: 'out', type: 'text', body,
      metaMessageId: result?.messages?.[0]?.id
    });
    emitMessage(doc);
    res.json({ success: true, data: doc });
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
        await Message.create({ channel, phone: r.phone, name: r.name, direction: 'out', type: 'template', body });
        sent++;
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
