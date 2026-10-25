const express = require('express');
const router = express.Router();

// In-memory submissions store (fallback when no DB)
const submissions = [];

// POST /api/prices/submit
router.post('/submit', async (req, res) => {
  try {
    const { medicineName, pharmacyName, price, inStock } = req.body;
    if (!medicineName || !pharmacyName || !price) {
      return res.status(400).json({ error: 'medicineName, pharmacyName, and price are required' });
    }

    const submission = {
      id: `sub_${Date.now()}`,
      medicineName,
      pharmacyName,
      price: parseFloat(price),
      inStock: inStock !== false,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Try MongoDB
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const UserSubmission = require('../models/UserSubmission');
        const doc = await UserSubmission.create(submission);
        return res.status(201).json({ message: 'Price submitted successfully', submission: doc });
      }
    } catch {}

    submissions.push(submission);
    res.status(201).json({ message: 'Price submitted successfully! Our team will verify it shortly.', submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prices/submissions
router.get('/submissions', (req, res) => {
  res.json(submissions);
});

module.exports = router;
