// backend/routes/pharmacist.js — v5 COMPLETE
// All 11 points implemented
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Pharmacist = require('../models/Pharmacist');
const Stock = require('../models/Stock');
const Bill = require('../models/Bill');
const Supplier = require('../models/Supplier');
const RegularCustomer = require('../models/RegularCustomer');
const MedicineRequirement = require('../models/MedicineRequirement');

const JWT_SECRET = process.env.JWT_SECRET || 'medimap_secret_2024';

// ── Mailer / WhatsApp / refill reminders — see services/refillService.js ──
// Shared with the automated daily refill-reminder job so both paths behave
// exactly the same: email first, WhatsApp when configured, otherwise logged.
const {
  getMailer,
  deliverReminder,
  buildRefillMessage,
  describeReminderOutcome,
  runAutoRefillReminders,
  nextAutoReminderFor,
  hasDeliverableChannel,
} = require('../services/refillService');

// ── Auth ──────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.ph = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function premiumOnly(req, res, next) {
  Pharmacist.findById(req.ph.id).lean().then(ph => {
    if (!ph?.isPremium) return res.status(403).json({ error: 'Premium feature' });
    req.pharmacist = ph; next();
  }).catch(e => res.status(500).json({ error: e.message }));
}

// ── Bill number counter ───────────────────────────────────────
// billNumber carries a legacy global unique index, so each dispensary gets its
// own series prefixed with a short code from its id. `offset` lets the caller
// retry with the next number if another store already claimed this one.
async function nextBillNumber(pharmacistId, offset = 0) {
  const code = String(pharmacistId).slice(-4).toUpperCase();
  const last = await Bill.findOne({ pharmacistId }).sort({ createdAt: -1 }).select('billNumber').lean();
  const match = last?.billNumber?.match(/(\d+)$/);
  const base = match ? parseInt(match[1], 10) : 1000;
  return `BILL-${code}-${base + 1 + offset}`;
}

// ════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════
router.post('/register', async (req, res) => {
  try {
    const { name, ownerName, email, password, phone, address, city, gstin, licenseNo, lat, lng } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, password required' });
    if (await Pharmacist.findOne({ email: email.toLowerCase() }))
      return res.status(409).json({ error: 'Email already registered' });
    const ph = await Pharmacist.create({
      name, ownerName, email: email.toLowerCase(), password,
      phone, address, city, gstin, licenseNo,
      source: 'self_registered', isListed: true, isSuspended: false,
      location: { type: 'Point', coordinates: [parseFloat(lng)||77.0378, parseFloat(lat)||28.6091] },
    });
    const token = jwt.sign({ id: ph._id, email: ph.email, name: ph.name }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, pharmacist: ph.toPublic() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const ph = await Pharmacist.findOne({ email: email.toLowerCase() });
    if (!ph) return res.status(401).json({ error: 'Invalid email or password' });
    if (ph.isSuspended === true) return res.status(403).json({ error: 'Account suspended. Contact admin.' });
    if (!await ph.comparePassword(password)) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: ph._id, email: ph.email, name: ph.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, pharmacist: ph.toPublic() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const ph = await Pharmacist.findById(req.ph.id);
    if (!ph) return res.status(404).json({ error: 'Not found' });
    res.json(ph.toPublic());
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 11 — Edit profile (name, ownerName, phone, address only)
router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, ownerName, phone, address } = req.body;
    const update = {};
    if (name?.trim())      update.name      = name.trim();
    if (ownerName !== undefined) update.ownerName = ownerName?.trim() || '';
    if (phone !== undefined)     update.phone     = phone?.trim() || '';
    if (address !== undefined)   update.address   = address?.trim() || '';

    if (!Object.keys(update).length)
      return res.status(400).json({ error: 'No fields to update' });

    const ph = await Pharmacist.findByIdAndUpdate(req.ph.id, { $set: update }, { new: true });
    if (!ph) return res.status(404).json({ error: 'Not found' });
    // Update cached info
    res.json({ success: true, pharmacist: ph.toPublic() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/public/list', async (req, res) => {
  try {
    const { lat, lng, radius = 50000 } = req.query;
    const query = { isListed: true, isSuspended: { $ne: true } };
    const pharmacies = lat && lng
      ? await Pharmacist.find({ ...query, location:{ $near:{ $geometry:{ type:'Point', coordinates:[parseFloat(lng),parseFloat(lat)] }, $maxDistance:parseInt(radius) } } }).select('-password').limit(100).lean()
      : await Pharmacist.find(query).select('-password').limit(200).lean();
    res.json(pharmacies);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// STOCK
// ════════════════════════════════════════════════════════════
router.get('/stock', auth, async (req, res) => {
  try {
    const stock = await Stock.find({ pharmacistId: req.ph.id }).lean();
    res.json({
      stock,
      lowStock: stock.filter(s => s.units <= (s.minStock||10) && s.units > 0),
      outOfStock: stock.filter(s => s.units === 0),
      totalItems: stock.length,
      totalValue: stock.reduce((s,i) => s + (i.purchasePrice||0)*i.units, 0),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 4 — supplierId + supplierName tagging on stock
router.post('/stock', auth, async (req, res) => {
  try {
    const { medicineName, genericName, manufacturer, batchNo, expiryDate,
            purchasePrice, sellingPrice, units, minStock, category, hsn, gstRate,
            supplierId, supplierName } = req.body;
    if (!medicineName || sellingPrice === undefined || units === undefined)
      return res.status(400).json({ error: 'medicineName, sellingPrice, units required' });

    const item = await Stock.create({
      pharmacistId: req.ph.id,
      medicineName, genericName, manufacturer, batchNo, expiryDate,
      purchasePrice: parseFloat(purchasePrice)||0,
      sellingPrice: parseFloat(sellingPrice),
      units: parseInt(units),
      minStock: parseInt(minStock)||10,
      category, hsn: hsn||'30049099',
      gstRate: parseFloat(gstRate)||12,
      supplierId: supplierId && mongoose.Types.ObjectId.isValid(supplierId) ? supplierId : undefined,
      supplierName: supplierName || undefined,
      updatedAt: new Date(),
    });
    res.status(201).json(item);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/stock/:id', auth, async (req, res) => {
  try {
    const item = await Stock.findOneAndUpdate(
      { _id: req.params.id, pharmacistId: req.ph.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/stock/:id', auth, async (req, res) => {
  try {
    if (!await Stock.findOneAndDelete({ _id: req.params.id, pharmacistId: req.ph.id }))
      return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/stock/public/:pharmacyId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.pharmacyId))
      return res.status(400).json({ error: 'Invalid ID' });
    const s = await Stock.find({ pharmacistId: req.params.pharmacyId, units: { $gt: 0 } }).lean();
    res.json(s.map(i => ({ medicineName:i.medicineName, genericName:i.genericName, sellingPrice:i.sellingPrice, inStock:i.units>0, units:i.units, category:i.category })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// BILLING — PERSISTENT
// ════════════════════════════════════════════════════════════
router.post('/bill', auth, async (req, res) => {
  try {
    const { customerName, customerPhone, customerEmail, customerAddress, items, discount=0, paymentMode='Cash', couponCode, customerId } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'No items' });
    const ph = await Pharmacist.findById(req.ph.id).lean();
    if (!ph) return res.status(404).json({ error: 'Not found' });

    const resolvedItems = await Promise.all(items.map(async item => {
      let si = null;
      try { if (item.stockId && mongoose.Types.ObjectId.isValid(item.stockId)) si = await Stock.findById(item.stockId).lean(); } catch {}
      const gstRate = parseFloat(si?.gstRate || item.gstRate || 12);
      const unitPrice = parseFloat(item.price) || si?.sellingPrice || 0;
      const qty = parseInt(item.quantity) || 1;
      const base = unitPrice / (1 + gstRate/100);
      return {
        medicineName: item.medicineName || si?.medicineName || 'Unknown',
        batchNo: si?.batchNo || item.batchNo || 'N/A',
        expiryDate: si?.expiryDate || 'N/A',
        hsn: si?.hsn || '30049099',
        gstRate, quantity: qty, unitPrice,
        basePrice: parseFloat(base.toFixed(2)),
        gstAmount: parseFloat(((unitPrice - base) * qty).toFixed(2)),
        total: parseFloat((unitPrice * qty).toFixed(2)),
        stockId: item.stockId || null,
        isManual: item.isManual || !item.stockId,
      };
    }));

    const subtotal = resolvedItems.reduce((s,i) => s+i.total, 0);
    const totalGST = resolvedItems.reduce((s,i) => s+i.gstAmount, 0);
    const discAmt = (subtotal * parseFloat(discount)) / 100;
    const grandTotal = subtotal - discAmt;

    let bill = null;
    for (let attempt = 0; attempt < 5 && !bill; attempt++) {
      try {
        bill = await Bill.create({
          billNumber: await nextBillNumber(req.ph.id, attempt), pharmacistId: req.ph.id,
          pharmacyName: ph.name, pharmacyAddress: ph.address||'', pharmacyPhone: ph.phone||'', gstin: ph.gstin||'', licenseNo: ph.licenseNo||'',
          customerName: customerName||'Walk-in', customerPhone: customerPhone||'', customerEmail: customerEmail||'', customerAddress: customerAddress||'',
          customerId: customerId && mongoose.Types.ObjectId.isValid(customerId) ? customerId : undefined,
          items: resolvedItems, subtotal: +subtotal.toFixed(2), totalGST: +totalGST.toFixed(2),
          discount: parseFloat(discount), discountAmount: +discAmt.toFixed(2), grandTotal: +grandTotal.toFixed(2),
          paymentMode, couponCode: couponCode||null,
        });
      } catch (err) {
        if (err.code !== 11000 || attempt === 4) throw err;
      }
    }

    for (const item of resolvedItems) {
      if (item.stockId && !item.isManual) {
        try { await Stock.findByIdAndUpdate(item.stockId, { $inc: { units: -item.quantity } }); } catch {}
      }
    }
    if (customerId) {
      try {
        await RegularCustomer.findByIdAndUpdate(customerId, {
          $inc: { totalVisits:1, totalSpend:grandTotal },
          $set: { lastVisit: new Date() },
          $push: { billIds: { $each:[bill._id], $slice:-50 } },
        });
      } catch {}
    }

    res.status(201).json({ ...bill.toObject(), id: bill.billNumber });
  } catch(e) { console.error('Bill error:', e); res.status(500).json({ error: e.message }); }
});

router.get('/bills', auth, async (req, res) => {
  try {
    const { page=1, limit=50 } = req.query;
    const skip = (parseInt(page)-1) * parseInt(limit);
    const [bills, total] = await Promise.all([
      Bill.find({ pharmacistId: req.ph.id }).sort({ createdAt:-1 }).skip(skip).limit(parseInt(limit)).lean(),
      Bill.countDocuments({ pharmacistId: req.ph.id }),
    ]);
    res.json({ bills: bills.map(b => ({...b, id:b.billNumber})), total });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 2 — Delete bill completely from DB
router.delete('/bill/:billNumber', auth, async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ billNumber: req.params.billNumber, pharmacistId: req.ph.id });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json({ success: true, deleted: bill.billNumber });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/bill/:id/send-email', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.id, pharmacistId: req.ph.id }).lean();
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const email = req.body.email || bill.customerEmail;
    if (!email) return res.status(400).json({ error: 'Customer email not provided' });
    const { sendEmailBill } = require('../services/billingService');
    const result = await sendEmailBill({...bill, id:bill.billNumber}, email);
    res.json({ success:true, ...result });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/bill/:id/send-whatsapp', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.id, pharmacistId: req.ph.id }).lean();
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const phone = req.body.phone || bill.customerPhone;
    if (!phone) return res.status(400).json({ error: 'Phone not provided' });
    const { sendWhatsAppBill } = require('../services/billingService');
    const result = await sendWhatsAppBill({...bill, id:bill.billNumber}, phone);
    res.json({ success:true, ...result });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/bill/:id/html', auth, async (req, res) => {
  try {
    const bill = await Bill.findOne({ billNumber: req.params.id, pharmacistId: req.ph.id }).lean();
    if (!bill) return res.status(404).json({ error: 'Not found' });
    const { generateBillHTML } = require('../services/billingService');
    res.setHeader('Content-Type', 'text/html');
    res.send(generateBillHTML({...bill, id:bill.billNumber}));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════
router.get('/analytics', auth, async (req, res) => {
  try {
    const ph = await Pharmacist.findById(req.ph.id).lean();
    if (!ph?.isPremium) return res.status(403).json({ error: 'Premium feature' });
    const [stock, bills] = await Promise.all([
      Stock.find({ pharmacistId: req.ph.id }).lean(),
      Bill.find({ pharmacistId: req.ph.id }).lean(),
    ]);
    const now = new Date();
    const monthlyData = Array.from({ length:12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth()-11+i, 1);
      const mb = bills.filter(b => { const bd=new Date(b.createdAt); return bd.getMonth()===d.getMonth()&&bd.getFullYear()===d.getFullYear(); });
      const revenue = mb.reduce((s,b)=>s+b.grandTotal, 0);
      const cost = mb.reduce((s,b)=>s+b.items.reduce((ss,it)=>{ const si=stock.find(st=>st.medicineName===it.medicineName); return ss+(si?.purchasePrice||0)*it.quantity; },0),0);
      return { month:d.toLocaleString('en-IN',{month:'short',year:'2-digit'}), revenue:+revenue.toFixed(2), cost:+cost.toFixed(2), profit:+(revenue-cost).toFixed(2), bills:mb.length, margin:revenue>0?+((revenue-cost)/revenue*100).toFixed(1):0 };
    });
    const medMap = {};
    bills.forEach(b=>b.items.forEach(it=>{if(!medMap[it.medicineName])medMap[it.medicineName]={name:it.medicineName,qty:0,revenue:0};medMap[it.medicineName].qty+=it.quantity;medMap[it.medicineName].revenue+=it.total;}));
    const topMedicines = Object.values(medMap).sort((a,b)=>b.revenue-a.revenue).slice(0,10);
    const today = new Date();
    const expiryAlerts = stock.filter(s=>{if(!s.expiryDate)return false;const e=new Date(s.expiryDate);const d=Math.ceil((e-today)/86400000);return d<=90&&d>0;}).map(s=>{const d=Math.ceil((new Date(s.expiryDate)-today)/86400000);return{...s,daysLeft:d,urgency:d<=7?'critical':d<=30?'warning':'info'};}).sort((a,b)=>a.daysLeft-b.daysLeft);
    const thirtyAgo = new Date(Date.now()-30*86400000);
    const slowMoving = stock.filter(s=>new Date(s.updatedAt)<thirtyAgo&&(medMap[s.medicineName]?.qty||0)<3&&s.units>0);
    const marginAnalysis = stock.map(s=>{const sold=medMap[s.medicineName]?.qty||0;const revenue=medMap[s.medicineName]?.revenue||0;const margin=s.purchasePrice>0?((s.sellingPrice-s.purchasePrice)/s.purchasePrice*100):0;return{medicineName:s.medicineName,purchasePrice:s.purchasePrice,sellingPrice:s.sellingPrice,margin:+margin.toFixed(1),unitsSold:sold,revenue:+revenue.toFixed(2),profit:+(sold*(s.sellingPrice-(s.purchasePrice||0))).toFixed(2),unitsInStock:s.units};}).sort((a,b)=>b.revenue-a.revenue);
    const totalRevenue = bills.reduce((s,b)=>s+b.grandTotal,0);
    const totalCost = bills.reduce((s,b)=>s+b.items.reduce((ss,it)=>{const si=stock.find(st=>st.medicineName===it.medicineName);return ss+(si?.purchasePrice||0)*it.quantity;},0),0);
    res.json({ summary:{totalRevenue:+totalRevenue.toFixed(2),totalCost:+totalCost.toFixed(2),totalProfit:+(totalRevenue-totalCost).toFixed(2),totalBills:bills.length,avgBillValue:bills.length?+(totalRevenue/bills.length).toFixed(2):0,totalStockValue:+stock.reduce((s,i)=>s+(i.purchasePrice||0)*i.units,0).toFixed(2),totalItems:stock.length,lowStockItems:stock.filter(s=>s.units<=(s.minStock||10)).length,expiringItems:expiryAlerts.length,slowMovingItems:slowMoving.length,overallMargin:totalRevenue>0?+((totalRevenue-totalCost)/totalRevenue*100).toFixed(1):0}, monthlyData, topMedicines, marginAnalysis:marginAnalysis.slice(0,20), expiryAlerts, slowMoving });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// SUPPLIERS — PREMIUM
// ════════════════════════════════════════════════════════════
router.get('/suppliers', auth, premiumOnly, async (req, res) => {
  try {
    const suppliers = await Supplier.find({ pharmacistId: req.ph.id, isActive: true }).sort({ createdAt:-1 }).lean();
    res.json(suppliers);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/suppliers', auth, premiumOnly, async (req, res) => {
  try {
    const { name, phone, email, address, gstNo, category, creditDays, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const supplier = await Supplier.create({ pharmacistId:req.ph.id, name, phone, email, address, gstNo, category, creditDays:parseInt(creditDays)||30, notes });
    res.status(201).json(supplier);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/suppliers/:id', auth, premiumOnly, async (req, res) => {
  try {
    const s = await Supplier.findOneAndUpdate({ _id:req.params.id, pharmacistId:req.ph.id }, req.body, { new:true });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/suppliers/:id', auth, premiumOnly, async (req, res) => {
  try {
    await Supplier.findOneAndUpdate({ _id:req.params.id, pharmacistId:req.ph.id }, { isActive:false });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 5 — Remove unit cost from order; supplier sets it
// POINT 6 — Real email sending
router.post('/suppliers/:id/order', auth, premiumOnly, async (req, res) => {
  try {
    const { medicineName, quantity, expectedDate, notes } = req.body;
    if (!medicineName || !quantity) return res.status(400).json({ error: 'Medicine and quantity required' });

    const supplier = await Supplier.findOne({ _id:req.params.id, pharmacistId:req.ph.id });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    const order = { medicineName, quantity:parseInt(quantity), expectedDate, notes, status:'Pending', emailSent:false };
    supplier.orders.push(order);
    supplier.totalOrders += 1;
    await supplier.save();

    const savedOrder = supplier.orders[supplier.orders.length - 1];
    let emailSent = false;
    let emailError = '';

    if (supplier.email) {
      try {
        const ph = await Pharmacist.findById(req.ph.id).lean();
        const mailer = getMailer();
        const result = await mailer.sendMail({
          from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@medimap.in',
          to: supplier.email,
          subject: `Purchase Order from ${ph.name}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#059669;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">📦 New Purchase Order</h2>
            </div>
            <div style="border:1px solid #d1fae5;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <p>Dear <b>${supplier.name}</b>,</p>
              <p>We would like to place the following order:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#f0fdf4"><th style="text-align:left;padding:10px;border:1px solid #d1fae5">Medicine</th><td style="padding:10px;border:1px solid #d1fae5"><b>${medicineName}</b></td></tr>
                <tr><th style="text-align:left;padding:10px;border:1px solid #d1fae5">Quantity</th><td style="padding:10px;border:1px solid #d1fae5">${quantity}</td></tr>
                <tr style="background:#f0fdf4"><th style="text-align:left;padding:10px;border:1px solid #d1fae5">Expected By</th><td style="padding:10px;border:1px solid #d1fae5">${expectedDate||'As soon as possible'}</td></tr>
                ${notes?`<tr><th style="text-align:left;padding:10px;border:1px solid #d1fae5">Notes</th><td style="padding:10px;border:1px solid #d1fae5">${notes}</td></tr>`:''}
              </table>
              <p><b>Please reply with your unit price and confirm availability.</b></p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
              <p style="font-size:13px;color:#6b7280">From: ${ph.name}<br/>Phone: ${ph.phone||'-'}<br/>Address: ${ph.address||'-'}<br/>GSTIN: ${ph.gstin||'-'}</p>
              <p style="font-size:12px;color:#9ca3af;margin-top:16px">Sent via MediMap Pharmacy Platform</p>
            </div>
          </div>`,
        });
        savedOrder.emailSent = true;
        savedOrder.emailSentAt = new Date();
        await supplier.save();
        emailSent = true;
      } catch(mailErr) {
        emailError = mailErr.message;
        console.error('Email send error:', mailErr.message);
      }
    }

    res.json({
      success: true, order: savedOrder, emailSent,
      message: emailSent ? `Order placed & email sent to ${supplier.email}` : supplier.email ? `Order placed (email failed: ${emailError})` : 'Order placed (supplier has no email)',
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 7 — Cancel order with reason + email to supplier
router.patch('/suppliers/:id/orders/:orderId/cancel', auth, premiumOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'Cancellation reason required' });

    const supplier = await Supplier.findOne({ _id:req.params.id, pharmacistId:req.ph.id });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    const order = supplier.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'Cancelled';
    order.cancellationReason = reason.trim();
    order.cancelledAt = new Date();
    await supplier.save();

    let emailSent = false;
    if (supplier.email) {
      try {
        const ph = await Pharmacist.findById(req.ph.id).lean();
        const mailer = getMailer();
        await mailer.sendMail({
          from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@medimap.in',
          to: supplier.email,
          subject: `Order Cancellation — ${order.medicineName} | ${ph.name}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="background:#dc2626;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0">❌ Order Cancellation Notice</h2>
            </div>
            <div style="border:1px solid #fee2e2;border-top:none;padding:24px;border-radius:0 0 8px 8px">
              <p>Dear <b>${supplier.name}</b>,</p>
              <p>We regret to inform you that we are cancelling the following order:</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#fef2f2"><th style="text-align:left;padding:10px;border:1px solid #fee2e2">Medicine</th><td style="padding:10px;border:1px solid #fee2e2"><b>${order.medicineName}</b></td></tr>
                <tr><th style="text-align:left;padding:10px;border:1px solid #fee2e2">Quantity</th><td style="padding:10px;border:1px solid #fee2e2">${order.quantity}</td></tr>
                <tr style="background:#fef2f2"><th style="text-align:left;padding:10px;border:1px solid #fee2e2">Cancellation Reason</th><td style="padding:10px;border:1px solid #fee2e2"><b style="color:#dc2626">${reason}</b></td></tr>
              </table>
              <p>We apologize for any inconvenience caused. Please do not proceed with this order.</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
              <p style="font-size:13px;color:#6b7280">From: ${ph.name}<br/>Phone: ${ph.phone||'-'}</p>
            </div>
          </div>`,
        });
        emailSent = true;
      } catch(mailErr) { console.error('Cancel email error:', mailErr.message); }
    }

    res.json({ success:true, order, emailSent, message: emailSent ? `Cancellation email sent to ${supplier.email}` : 'Order cancelled (no email sent)' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/suppliers/:id/orders/:orderId', auth, premiumOnly, async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id:req.params.id, pharmacistId:req.ph.id });
    if (!supplier) return res.status(404).json({ error: 'Not found' });
    const order = supplier.orders.id(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    Object.assign(order, req.body);
    await supplier.save();
    res.json(order);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// REQUIREMENTS — PREMIUM
// ════════════════════════════════════════════════════════════
router.get('/requirements', auth, premiumOnly, async (req, res) => {
  try {
    const reqs = await MedicineRequirement.find({ pharmacistId:req.ph.id }).sort({ createdAt:-1 }).lean();
    res.json(reqs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/requirements', auth, premiumOnly, async (req, res) => {
  try {
    const { title, items } = req.body;
    const r = await MedicineRequirement.create({ pharmacistId:req.ph.id, title:title||'Purchase List', items:items||[] });
    res.status(201).json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/requirements/:id', auth, premiumOnly, async (req, res) => {
  try {
    const r = await MedicineRequirement.findOneAndUpdate({ _id:req.params.id, pharmacistId:req.ph.id }, req.body, { new:true });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json(r);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 8 — Delete requirement list
router.delete('/requirements/:id', auth, premiumOnly, async (req, res) => {
  try {
    const r = await MedicineRequirement.findOneAndDelete({ _id:req.params.id, pharmacistId:req.ph.id });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ success:true, deleted: r.title });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 9 — Send requirement: creates supplier order + marks requirement sent
router.post('/requirements/:id/send', auth, premiumOnly, async (req, res) => {
  try {
    const { supplierId } = req.body;
    const [reqDoc, supplier, ph] = await Promise.all([
      MedicineRequirement.findOne({ _id:req.params.id, pharmacistId:req.ph.id }),
      Supplier.findOne({ _id:supplierId, pharmacistId:req.ph.id }),
      Pharmacist.findById(req.ph.id).lean(),
    ]);
    if (!reqDoc) return res.status(404).json({ error: 'Requirement not found' });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    if (!supplier.email) return res.status(400).json({ error: `Supplier ${supplier.name} has no email address` });

    const itemList = reqDoc.items.map((it,i) => `${i+1}. ${it.medicineName} — Qty: ${it.quantity} ${it.unit||'strips'} [${it.priority}]${it.notes?` (${it.notes})`:''}`).join('\n');

    const mailer = getMailer();
    await mailer.sendMail({
      from: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@medimap.in',
      to: supplier.email,
      subject: `Medicine Requirements from ${ph.name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1B6EF3;color:white;padding:16px 24px;border-radius:8px 8px 0 0">
          <h2 style="margin:0">📋 Medicine Requirements</h2>
        </div>
        <div style="border:1px solid #dbeafe;border-top:none;padding:24px;border-radius:0 0 8px 8px">
          <p>Dear <b>${supplier.name}</b>,</p>
          <p>Please find our medicine requirements:</p>
          <pre style="background:#f8faff;border:1px solid #dbeafe;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;line-height:1.6">${itemList}</pre>
          <p><b>Please send us your best prices and availability.</b></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="font-size:13px;color:#6b7280">From: ${ph.name}<br/>Phone: ${ph.phone||'-'}</p>
        </div>
      </div>`,
    });

    // POINT 9 — Create corresponding supplier orders for each item
    for (const item of reqDoc.items) {
      supplier.orders.push({
        medicineName: item.medicineName,
        quantity: parseInt(item.quantity) || 1,
        notes: `From requirement list: ${reqDoc.title}. Priority: ${item.priority}${item.notes?`. ${item.notes}`:''}`,
        status: 'Pending',
        emailSent: true,
        emailSentAt: new Date(),
        fromRequirementId: reqDoc._id,
      });
      supplier.totalOrders += 1;
    }
    await supplier.save();

    // Mark requirement as sent
    reqDoc.sentToSuppliers.push({ supplierId: supplier._id, supplierName: supplier.name, supplierEmail: supplier.email, sentAt: new Date() });
    reqDoc.status = 'sent';
    await reqDoc.save();

    res.json({ success:true, message:`List sent to ${supplier.name} at ${supplier.email}` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// CUSTOMERS — PREMIUM
// ════════════════════════════════════════════════════════════
router.get('/customers', auth, premiumOnly, async (req, res) => {
  try {
    const customers = await RegularCustomer.find({ pharmacistId:req.ph.id, isActive:true }).sort({ lastVisit:-1 }).lean();
    // Tell the dashboard when the daily job will next contact each patient.
    // A patient the job would skip (no deliverable channel) gets no date at all
    // rather than a promise the job will not keep.
    res.json(customers.map(c => ({
      ...c,
      nextAutoReminderAt: hasDeliverableChannel(c) ? nextAutoReminderFor(c)?.at || null : null,
    })));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/customers', auth, premiumOnly, async (req, res) => {
  try {
    const { name, phone, email, address, age, notes, medicines } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const c = await RegularCustomer.create({ pharmacistId:req.ph.id, name, phone, email, address, age, notes, medicines:medicines||[] });
    res.status(201).json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/customers/:id', auth, premiumOnly, async (req, res) => {
  try {
    const c = await RegularCustomer.findOneAndUpdate({ _id:req.params.id, pharmacistId:req.ph.id }, req.body, { new:true });
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/customers/:id', auth, premiumOnly, async (req, res) => {
  try {
    await RegularCustomer.findOneAndUpdate({ _id:req.params.id, pharmacistId:req.ph.id }, { isActive:false });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POINT 10 — Delete individual medicine from customer
router.delete('/customers/:customerId/medicines/:medIndex', auth, premiumOnly, async (req, res) => {
  try {
    const customer = await RegularCustomer.findOne({ _id:req.params.customerId, pharmacistId:req.ph.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    const idx = parseInt(req.params.medIndex);
    if (isNaN(idx) || idx < 0 || idx >= customer.medicines.length)
      return res.status(400).json({ error: 'Invalid medicine index' });
    customer.medicines.splice(idx, 1);
    await customer.save();
    res.json({ success:true, customer });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Send + log a refill reminder. Email is the delivery channel when the customer
// has one; WhatsApp is used when its API keys are set; otherwise the reminder
// is recorded on the customer timeline without pretending it was delivered.
router.post('/customers/:id/remind', auth, premiumOnly, async (req, res) => {
  try {
    const customer = await RegularCustomer.findOne({ _id: req.params.id, pharmacistId: req.ph.id });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    const ph = await Pharmacist.findById(req.ph.id).lean();
    const medicine = (req.body.medicineName
      ? customer.medicines.find(m => m.medicineName === req.body.medicineName)
      : customer.medicines[0]) || null;
    const medicineName = medicine?.medicineName || req.body.medicineName || null;
    const text = (req.body.message || '').trim() || buildRefillMessage(ph, customer, medicineName);

    const { channel, status, error } = await deliverReminder({
      customer, pharmacy: ph, medicineName, message: text, source: 'manual',
    });

    const saved = customer.reminders[customer.reminders.length - 1];
    res.json({
      success: status !== 'failed',
      reminder: saved,
      customer: { _id: customer._id, lastReminderAt: customer.lastReminderAt },
      message: describeReminderOutcome({ channel, status, error, customer }),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Run the automated refill-reminder scan for the signed-in pharmacy right now.
// The background job does this daily; this endpoint lets a pharmacy send its
// due reminders early and makes the schedule easy to test.
router.post('/refills/scan', auth, premiumOnly, async (req, res) => {
  try {
    const s = await runAutoRefillReminders({ pharmacistId: req.ph.id });
    let message;
    if (s.due === 0) message = 'No refills are due today.';
    else if (s.sent + s.failed === 0) message = `${s.due} refill(s) are due, but all were already reminded this cycle.`;
    else message = `Sent ${s.sent} refill reminder(s); ${s.due} were due today.`;
    res.json({ success: true, summary: s, message });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/customers/alerts', auth, premiumOnly, async (req, res) => {
  try {
    const { days = 3 } = req.query;
    const customers = await RegularCustomer.find({ pharmacistId:req.ph.id, isActive:true }).lean();
    const today = new Date();
    const todayDate = today.getDate();
    const alerts = [];
    customers.forEach(c => {
      (c.medicines||[]).forEach(med => {
        if (!med.alertEnabled || !med.typicalDate) return;
        const diff = med.typicalDate - todayDate;
        const adj = diff < 0 ? diff + 30 : diff;
        if (adj >= 0 && adj <= parseInt(days)) {
          alerts.push({ customerId:c._id, customerName:c.name, customerPhone:c.phone, medicineName:med.medicineName, dosage:med.dosage, quantity:med.quantity, typicalDate:med.typicalDate, daysFromNow:adj, lastPurchased:med.lastPurchased, urgency:adj===0?'today':adj===1?'tomorrow':`${adj} days` });
        }
      });
    });
    alerts.sort((a,b) => a.daysFromNow - b.daysFromNow);
    res.json({ alerts, total:alerts.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════════════════════
// PREMIUM
// ════════════════════════════════════════════════════════════
router.post('/premium/create-order', auth, async (req, res) => {
  const { plan } = req.body;
  const amount = plan === 'annual' ? 299900 : 29900;
  try {
    const Razorpay = require('razorpay');
    const rz = new Razorpay({ key_id:process.env.RAZORPAY_KEY_ID, key_secret:process.env.RAZORPAY_KEY_SECRET });
    const order = await rz.orders.create({ amount, currency:'INR', receipt:`ph_${req.ph.id}_${Date.now()}` });
    res.json({ orderId:order.id, amount, currency:'INR', keyId:process.env.RAZORPAY_KEY_ID });
  } catch {
    res.json({ orderId:`demo_${Date.now()}`, amount, currency:'INR', demo:true });
  }
});

router.post('/premium/verify', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    const expiry = plan==='annual' ? new Date(Date.now()+365*86400000) : new Date(Date.now()+30*86400000);
    const ph = await Pharmacist.findByIdAndUpdate(req.ph.id, { isPremium:true, premiumExpiry:expiry, premiumPlan:plan }, { new:true });
    res.json({ success:true, premiumExpiry:ph.premiumExpiry });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;