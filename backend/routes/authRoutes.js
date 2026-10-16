const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// @route   POST /api/auth/setup
// @desc    One-time setup to create the initial admin
router.post('/setup', async (req, res) => {
  try {
    const adminExists = await Admin.findOne();
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = new Admin({
      email: 'admin@mits.edu',
      password: hashedPassword
    });

    await admin.save();
    res.status(201).json({ message: 'Admin created successfully. Email: admin@mits.edu, Pass: admin123' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate admin & get token
router.post('/login', async (req, res) => {
  let { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password' });
  }

  email = String(email).trim().toLowerCase();
  password = String(password).trim();

  try {
    // Case-insensitive lookup
    let admin = await Admin.findOne({ email: new RegExp('^' + email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });

    // Auto-create initial admin if none exists
    if (!admin && email === 'admin@mits.edu') {
      const anyAdmin = await Admin.findOne();
      if (!anyAdmin) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        admin = new Admin({ email: 'admin@mits.edu', password: hashedPassword });
        await admin.save();
      }
    }

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials. Email not found.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const payload = {
      admin: {
        id: admin.id
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'mits_secret_key_2026';

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '7d' }, // 7 days token
      (err, token) => {
        if (err) throw err;
        res.json({ token, message: 'Login successful' });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
