import express from 'express';
import auth from '../middleware/auth.js';
import Lead from '../models/Lead.js';
import bus from '../services/eventBus.js';

const router = express.Router();

// SSE stream: pushes new leads to the admin panel in real time (with sound).
// Token passed as query param since EventSource can't set headers.
router.get('/stream', (req, res) => {
  const token = req.query.token;
  if (token !== (process.env.ADMIN_TOKEN || 'devine_admin_session_token_2026')) {
    return res.status(401).end();
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders?.();
  res.write('event: ping\ndata: connected\n\n');

  const onLead = (lead) => {
    res.write(`event: lead\ndata: ${JSON.stringify(lead)}\n\n`);
  };
  const onOrder = (order) => {
    res.write(`event: order\ndata: ${JSON.stringify({ orderId: order.orderId, total: order.totalAmount, phone: order.customer?.phone })}\n\n`);
  };
  bus.on('lead', onLead);
  bus.on('order', onOrder);

  const keepAlive = setInterval(() => res.write('event: ping\ndata: keepalive\n\n'), 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    bus.off('lead', onLead);
    bus.off('order', onOrder);
  });
});

router.get('/', auth, async (req, res) => {
  const filter = {};
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json({ success: true, data: leads });
});

router.patch('/:id', auth, async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: lead });
});

router.delete('/:id', auth, async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;
