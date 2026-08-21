import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../services/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'devine_user_jwt_secret_2026';

function generateToken(user) {
  return jwt.sign(
    { id: user._id, phone: user.phone, whatsappPhone: user.whatsappPhone, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// User Middleware
export async function userAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ success: false, message: 'No auth token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { name, phone, whatsappPhone, email, password, address, location } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, Mobile number, and Password are required' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '').trim();
    const cleanWhatsapp = whatsappPhone ? String(whatsappPhone).replace(/[^\d+]/g, '').trim() : cleanPhone;
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    const existing = await User.findOne({
      $or: [
        { phone: cleanPhone },
        ...(cleanEmail ? [{ email: cleanEmail }] : [])
      ]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this Phone or Email already exists. Please Log In.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const initialAddress = address
      ? [
          {
            label: 'Default Address',
            name,
            phone: cleanPhone,
            whatsappPhone: cleanWhatsapp,
            email: cleanEmail,
            address,
            location: location || null,
            isDefault: true
          }
        ]
      : [];

    const user = await User.create({
      name,
      phone: cleanPhone,
      whatsappPhone: cleanWhatsapp,
      email: cleanEmail,
      password: hashedPassword,
      addresses: initialAddress
    });

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Signup successful',
      token,
      user: userObj
    });
  } catch (err) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = phone or email
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your Mobile/Email and Password' });
    }

    const cleanId = String(identifier).trim();
    const user = await User.findOne({
      $or: [
        { phone: cleanId },
        { phone: cleanId.replace(/[^\d+]/g, '') },
        { whatsappPhone: cleanId },
        { email: cleanId.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userObj
    });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Profile / Current User Details
router.get('/profile', userAuth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// Add New Address
router.post('/address', userAuth, async (req, res) => {
  try {
    const { label, name, phone, whatsappPhone, email, address, location, isDefault } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Name, Phone, and Address are required' });
    }

    const newAddr = {
      label: label || 'Saved Address',
      name,
      phone,
      whatsappPhone: whatsappPhone || phone,
      email: email || req.user.email || '',
      address,
      location: location || null,
      isDefault: !!isDefault
    };

    if (isDefault) {
      req.user.addresses.forEach((a) => {
        a.isDefault = false;
      });
    }

    req.user.addresses.push(newAddr);
    await req.user.save();

    res.json({ success: true, message: 'Address saved successfully', user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Wishlist
router.post('/wishlist', userAuth, async (req, res) => {
  try {
    const { wishlist } = req.body;
    if (Array.isArray(wishlist)) {
      req.user.wishlist = wishlist;
      await req.user.save();
    }
    res.json({ success: true, wishlist: req.user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
