// backend/routes/pharmacist_billing.js — FIX #5 + #12: bill generation + email/whatsapp
// Add this to pharmacist.js router or include separately
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Pharmacist = require('../models/Pharmacist');
const Stock = require('../models/Stock');
const { sendEmailBill, sendWhatsAppBill, generateBillHTML, generateBillObject } = require('../services/billingService');

const JWT_SECRET = process.env.JWT_SECRET || 'medimap_secret_2024';
let billCounter = 1001;
let bills = []; // replace with MongoDB Bill model for production

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.pharmacist = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// POST /api/pharmacist/bill — FIX #12: generate proper bill
router.post('/bill', authMiddleware, async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, items, discount = 0, paymentMode = 'Cash', couponCode } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items in bill' });

    const pharmacist = await Pharmacist.findById(req.pharmacist.id).lean();
    if (!pharmacist) return res.status(404).json({ error: 'Pharmacist not found' });

    // Resolve stock items
    const resolvedItems = await Promise.all(items.map(async item => {
      let stockItem = null;
      if (item.stockId && mongoose.Types.ObjectId.isValid(item.stockId)) {
        stockItem = await Stock.findById(item.stockId).lean();
      }
      return {
        medicineName: item.medicineName || stockItem?.medicineName || 'Unknown',
        batchNo: stockItem?.batchNo || item.batchNo || '-',
        expiryDate: stockItem?.expiryDate || item.expiryDate || '-',
        hsn: stockItem?.hsn || '30049099',
        gstRate: stockItem?.gstRate || item.gstRate || 12,
        price: parseFloat(item.price) || stockItem?.sellingPrice || 0,
        quantity: parseInt(item.quantity) || 1,
        stockId: item.stockId || null,
        isManual: item.isManual || false,
      };
    }));

    const bill = generateBillObject({
      pharmacist,
      customer: { name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
      items: resolvedItems,
      discount: parseFloat(discount) || 0,
      paymentMode,
      couponCode,
      billCounter: billCounter++,
    });

    // Deduct stock
    for (const item of resolvedItems) {
      if (item.stockId && !item.isManual) {
        await Stock.findByIdAndUpdate(item.stockId, {
          $inc: { units: -item.quantity },
        });
      }
    }

    bills.push({ ...bill, pharmacistId: req.pharmacist.id });
    res.status(201).json(bill);
  } catch (err) {
    console.error('Bill generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pharmacist/bills
router.get('/bills', authMiddleware, (req, res) => {
  const myBills = bills
    .filter(b => b.pharmacistId === req.pharmacist.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ bills: myBills, total: myBills.length });
});

// POST /api/pharmacist/bill/:id/send-email — FIX #5
router.post('/bill/:id/send-email', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const bill = bills.find(b => b.id === req.params.id && b.pharmacistId === req.pharmacist.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const targetEmail = email || bill.customerEmail;
    if (!targetEmail) return res.status(400).json({ error: 'Customer email not provided. Add email to customer details.' });

    const result = await sendEmailBill(bill, targetEmail);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/pharmacist/bill/:id/send-whatsapp — FIX #5
router.post('/bill/:id/send-whatsapp', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    const bill = bills.find(b => b.id === req.params.id && b.pharmacistId === req.pharmacist.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const targetPhone = phone || bill.customerPhone;
    if (!targetPhone) return res.status(400).json({ error: 'Customer phone not provided.' });

    const result = await sendWhatsAppBill(bill, targetPhone);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pharmacist/bill/:id/html — print-ready HTML
router.get('/bill/:id/html', authMiddleware, (req, res) => {
  const bill = bills.find(b => b.id === req.params.id && b.pharmacistId === req.pharmacist.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  const html = generateBillHTML(bill);
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
