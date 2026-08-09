import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketServer } from 'socket.io';

import Enquiry from './models/Enquiry.js';
import Career from './models/Career.js';

import webhookRouter from './routes/webhook.js';
import flowEndpointRouter from './routes/flowEndpoint.js';
import productsRouter from './routes/products.js';
import catalogRouter from './routes/catalog.js';
import leadsRouter from './routes/leads.js';
import ordersRouter from './routes/orders.js';
import crmRouter from './routes/crm.js';
import { startSchedulers } from './services/scheduler.js';
import logger from './services/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Socket.IO for live order tracking
const io = new SocketServer(server, { cors: { origin: '*' } });
app.set('io', io);
io.on('connection', (socket) => {
  socket.on('joinOrder', (orderId) => socket.join(`order_${orderId}`));
});

app.use(cors());
// Capture raw body for WhatsApp signature verification.
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
// Flow endpoint needs raw text too; it uses JSON body (Meta sends JSON envelope).
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB Atlas'))
  .catch((err) => logger.error('MongoDB connection error', { error: err.message }));

// ---------------- Health ----------------
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'Devine Backend Running' }));

// ---------------- WhatsApp ----------------
app.use('/api/whatsapp/webhook', webhookRouter);
app.use('/api/whatsapp/flow-endpoint', flowEndpointRouter);

// ---------------- Content / Commerce ----------------
app.use('/api/products', productsRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/crm', crmRouter);

// ==========================================
// Existing Enquiry / Career / Admin endpoints (unchanged behaviour)
// ==========================================
const cleanPhoneNumber = (p) => (p ? p.replace(/\D/g, '') : '');

app.post('/api/enquiries', async (req, res) => {
  try {
    const { name, phone, email, productInquired, inquiryType, message } = req.body;
    if (!name || !phone || !email || !productInquired || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }
    const cleanPhone = cleanPhoneNumber(phone.trim());
    const targetProduct = productInquired.trim();
    const all = await Enquiry.find({
      productInquired: { $regex: new RegExp(`^${targetProduct.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });
    if (all.find((i) => cleanPhoneNumber(i.phone) === cleanPhone)) {
      return res.status(400).json({ success: false, duplicate: true, message: `You have already requested an enquiry for "${targetProduct}".` });
    }
    const newEnquiry = new Enquiry({
      name: name.trim(), phone: phone.trim(), email: email.trim(),
      productInquired: targetProduct, inquiryType: inquiryType?.trim() || 'Product Inquiry & Pricing',
      message: message.trim(), status: 'Pending'
    });
    await newEnquiry.save();
    res.status(201).json({ success: true, message: 'Enquiry submitted!', data: newEnquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

app.get('/api/enquiries', async (req, res) => {
  const enquiries = await Enquiry.find().sort({ createdAt: -1 });
  res.json({ success: true, data: enquiries });
});
app.patch('/api/enquiries/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['Pending', 'Contacted', 'Completed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
  const updated = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!updated) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, data: updated });
});
app.delete('/api/enquiries/:id', async (req, res) => {
  const d = await Enquiry.findByIdAndDelete(req.params.id);
  if (!d) return res.status(404).json({ success: false, message: 'Not found.' });
  res.json({ success: true, message: 'Deleted.' });
});

app.post('/api/careers', async (req, res) => {
  try {
    const { fullName, phone, email, roleApplied, experience, coverNote } = req.body;
    if (!fullName || !phone || !email || !roleApplied || !experience || !coverNote) {
      return res.status(400).json({ success: false, message: 'Please fill all fields.' });
    }
    const app2 = new Career({ fullName, phone, email, roleApplied, experience, coverNote, status: 'New' });
    await app2.save();
    res.status(201).json({ success: true, data: app2 });
  } catch {
    res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});
app.get('/api/careers', async (req, res) => {
  const careers = await Career.find().sort({ createdAt: -1 });
  res.json({ success: true, data: careers });
});
app.patch('/api/careers/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['New', 'Reviewed', 'Shortlisted', 'Rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
  const updated = await Career.findByIdAndUpdate(req.params.id, { status }, { new: true });
  res.json({ success: true, data: updated });
});
app.delete('/api/careers/:id', async (req, res) => {
  await Career.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted.' });
});

// ---------------- Admin auth ----------------
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === (process.env.ADMIN_USERNAME || 'admin') && password === (process.env.ADMIN_PASSWORD || 'admin')) {
    return res.json({
      success: true,
      token: process.env.ADMIN_TOKEN || 'devine_admin_session_token_2026',
      user: { username, role: 'Administrator' }
    });
  }
  res.status(401).json({ success: false, message: 'Invalid Admin credentials!' });
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalEnquiries, pendingEnquiries, totalCareers] = await Promise.all([
      Enquiry.countDocuments(), Enquiry.countDocuments({ status: 'Pending' }), Career.countDocuments()
    ]);
    res.json({ success: true, stats: { totalEnquiries, pendingEnquiries, totalCareers } });
  } catch {
    res.status(500).json({ success: false });
  }
});

server.listen(PORT, () => {
  logger.info(`Devine Backend listening on http://localhost:${PORT}`);
  try {
    startSchedulers();
  } catch (err) {
    logger.warn('Scheduler start failed', { error: err.message });
  }
});
