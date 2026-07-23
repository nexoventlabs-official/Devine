import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Enquiry from './models/Enquiry.js';
import Career from './models/Career.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://perivihari8_db_user:SHZIoKxGisEONmkc@cluster0.7gu0joy.mongodb.net/?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('⚡ Connected to MongoDB Atlas Successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
  });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Devine Backend Server Running' });
});

// Helper function to clean phone numbers for duplicate comparison
const cleanPhoneNumber = (phoneStr) => {
  if (!phoneStr) return '';
  return phoneStr.replace(/\D/g, ''); // removes spaces, dashes, + signs
};

// ==========================================
// 1. ENQUIRY API ENDPOINTS
// ==========================================

// Submit Enquiry (With Duplicate Phone + Product Validation)
app.post('/api/enquiries', async (req, res) => {
  try {
    const { name, phone, email, productInquired, inquiryType, message } = req.body;

    if (!name || !phone || !email || !productInquired || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (Name, Phone, Email, Product, Message).'
      });
    }

    const rawPhone = phone.trim();
    const cleanPhone = cleanPhoneNumber(rawPhone);
    const targetProduct = productInquired.trim();

    // Check for existing enquiry with same phone number and same product
    const allEnquiries = await Enquiry.find({
      productInquired: { $regex: new RegExp(`^${targetProduct.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    const existingEnquiry = allEnquiries.find(item => cleanPhoneNumber(item.phone) === cleanPhone);

    if (existingEnquiry) {
      return res.status(400).json({
        success: false,
        duplicate: true,
        message: `You have already requested an enquiry for "${targetProduct}". Please use another mobile number or contact support.`
      });
    }

    // Create new Enquiry record
    const newEnquiry = new Enquiry({
      name: name.trim(),
      phone: rawPhone,
      email: email.trim(),
      productInquired: targetProduct,
      inquiryType: inquiryType ? inquiryType.trim() : 'Product Inquiry & Pricing',
      message: message.trim(),
      status: 'Pending'
    });

    await newEnquiry.save();

    return res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully!',
      data: newEnquiry
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.'
    });
  }
});

// Get all Enquiries (Admin)
app.get('/api/enquiries', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: enquiries });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch enquiries.' });
  }
});

// Update Enquiry Status (Admin)
app.patch('/api/enquiries/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Contacted', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found.' });
    }

    return res.json({ success: true, message: 'Status updated successfully.', data: updated });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// Delete Enquiry (Admin)
app.delete('/api/enquiries/:id', async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found.' });
    }
    return res.json({ success: true, message: 'Enquiry deleted successfully.' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete enquiry.' });
  }
});

// ==========================================
// 2. CAREER APPLICATION API ENDPOINTS
// ==========================================

// Submit Career Application
app.post('/api/careers', async (req, res) => {
  try {
    const { fullName, phone, email, roleApplied, experience, coverNote } = req.body;

    if (!fullName || !phone || !email || !roleApplied || !experience || !coverNote) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required application fields.'
      });
    }

    const newApplication = new Career({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      roleApplied: roleApplied.trim(),
      experience: experience.trim(),
      coverNote: coverNote.trim(),
      status: 'New'
    });

    await newApplication.save();

    return res.status(201).json({
      success: true,
      message: 'Career application submitted successfully!',
      data: newApplication
    });
  } catch (error) {
    console.error('Error submitting career application:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error.' });
  }
});

// Get all Career Applications (Admin)
app.get('/api/careers', async (req, res) => {
  try {
    const careers = await Career.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: careers });
  } catch (error) {
    console.error('Error fetching careers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch careers.' });
  }
});

// Update Career Application Status (Admin)
app.patch('/api/careers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'Reviewed', 'Shortlisted', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await Career.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.json({ success: true, message: 'Application status updated.', data: updated });
  } catch (error) {
    console.error('Error updating career status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// Delete Career Application (Admin)
app.delete('/api/careers/:id', async (req, res) => {
  try {
    const deleted = await Career.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    return res.json({ success: true, message: 'Application deleted.' });
  } catch (error) {
    console.error('Error deleting career application:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete application.' });
  }
});

// ==========================================
// 3. ADMIN AUTHENTICATION & DASHBOARD STATS
// ==========================================

// Admin Login (admin / admin)
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin';

  if (username === validUsername && password === validPassword) {
    return res.json({
      success: true,
      token: 'devine_admin_session_token_2026',
      user: { username: validUsername, role: 'Administrator' }
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Invalid Admin credentials! Use username: admin, password: admin'
  });
});

// Admin Dashboard Stats Overview
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalEnquiries = await Enquiry.countDocuments();
    const pendingEnquiries = await Enquiry.countDocuments({ status: 'Pending' });
    const contactedEnquiries = await Enquiry.countDocuments({ status: 'Contacted' });
    const completedEnquiries = await Enquiry.countDocuments({ status: 'Completed' });

    const totalCareers = await Career.countDocuments();
    const newCareers = await Career.countDocuments({ status: 'New' });

    const recentEnquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(5);
    const recentCareers = await Career.find().sort({ createdAt: -1 }).limit(5);

    // Product Demand Breakdown
    const productAggregation = await Enquiry.aggregate([
      { $group: { _id: '$productInquired', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      success: true,
      stats: {
        totalEnquiries,
        pendingEnquiries,
        contactedEnquiries,
        completedEnquiries,
        totalCareers,
        newCareers,
        productBreakdown: productAggregation,
        recentEnquiries,
        recentCareers
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Devine Backend Server listening on http://localhost:${PORT}`);
});
