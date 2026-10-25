// backend/controllers/priceRequestController.js — v2
// POINT 3: When pharmacist approves with selectedStockId, updates that stock item's price
//          AND updates the public Price/Medicine DB. No new pharmacy created.
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const PriceRequest = require('../models/PriceRequest');
const Pharmacist = require('../models/Pharmacist');
const Medicine = require('../models/Medicine');
const Price = require('../models/Price');

let pharmacistNotifications = {};

function notifyPharmacist(pharmacistId, notification) {
  const id = pharmacistId.toString();
  if (!pharmacistNotifications[id]) pharmacistNotifications[id] = [];
  pharmacistNotifications[id].unshift(notification);
  if (pharmacistNotifications[id].length > 50) pharmacistNotifications[id].length = 50;
}

function cleanupBillImage(request) {
  try {
    const fn = request.billImage?.filename;
    if (fn) {
      const fp = path.join(__dirname, '../uploads', fn);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  } catch {}
}

// POINT 3 — Approve: update stock item + public Price DB, NO new pharmacy creation
async function performApprove(request, approvedBy, selectedStockId) {
  const Stock = require('../models/Stock');

  // 1. Update pharmacist's own stock price (if they selected a stock item)
  if (selectedStockId && mongoose.Types.ObjectId.isValid(selectedStockId)) {
    try {
      await Stock.findByIdAndUpdate(selectedStockId, {
        $set: { sellingPrice: request.price, updatedAt: new Date() }
      });
      console.log(`📦 Stock ${selectedStockId} price updated to ₹${request.price}`);
    } catch (e) {
      console.error('Stock price update error:', e.message);
    }
  }

  // 2. Update public Price collection (for customer search results)
  if (request.pharmacyId) {
    try {
      let medicine = await Medicine.findOne({ name: { $regex: new RegExp(`^${request.medicineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
      if (!medicine) medicine = await Medicine.create({ name: request.medicineName });

      await Price.findOneAndUpdate(
        { medicine: medicine._id, pharmacy: request.pharmacyId },
        {
          $set: {
            price: request.price,
            inStock: request.inStock,
            lastUpdated: new Date(),
            lastUpdateSource: 'user_submission',
          },
          $push: {
            priceHistory: {
              $each: [{ price: request.price, inStock: request.inStock, date: new Date(), updatedBy: approvedBy }],
              $slice: -10,
            },
          },
        },
        { upsert: true, new: true }
      );
      console.log(`💰 Public price updated: ${request.medicineName} @ ₹${request.price}`);
    } catch (e) {
      console.error('Public price update error:', e.message);
    }
  }

  // 3. Award points to submitter
  if (request.submittedBy?.userId) {
    try {
      const { awardPoints } = require('../routes/points');
      if (typeof awardPoints === 'function') await awardPoints(request.submittedBy.userId, 'Price submission approved', request._id?.toString());
    } catch {}
  }

  // 4. Delete request + image
  cleanupBillImage(request);
  await PriceRequest.findByIdAndDelete(request._id);
}

// ── CREATE REQUEST ─────────────────────────────────────────────
exports.createRequest = async (req, res) => {
  try {
    const { medicineName, price, pharmacyId, pharmacyName, isNewPharmacy, newPharmacyData, personalNote, userName, userId, userEmail, inStock = true } = req.body;

    if (!medicineName?.trim()) return res.status(400).json({ error: 'medicineName required' });
    if (!price || parseFloat(price) <= 0) return res.status(400).json({ error: 'Valid price required' });
    if (!pharmacyName?.trim()) return res.status(400).json({ error: 'pharmacyName required' });

    let resolvedPharmacyId = null;
    let pharmacyNameSnapshot = pharmacyName.trim();
    let pharmacistDoc = null;

    if (pharmacyId && mongoose.Types.ObjectId.isValid(pharmacyId)) {
      pharmacistDoc = await Pharmacist.findById(pharmacyId).select('_id name isListed isSuspended').lean();
      if (!pharmacistDoc) return res.status(400).json({ error: 'Pharmacy not found' });
      if (pharmacistDoc.isSuspended) return res.status(400).json({ error: 'Pharmacy is suspended' });
      resolvedPharmacyId = pharmacistDoc._id;
      pharmacyNameSnapshot = pharmacistDoc.name;
    }

    // Build the URL from the request so it stays correct on any host or port
    // (localhost:5000 in development, a deployed domain in production).
    const origin = `${req.protocol}://${req.get('host')}`;

    let billImage = null;
    if (req.file) {
      billImage = { url: `${origin}/uploads/${req.file.filename}`, filename: req.file.filename, mimetype: req.file.mimetype };
    } else if (req.body.billImageUrl) {
      billImage = { url: req.body.billImageUrl, filename: null, mimetype: null };
    }

    const request = await PriceRequest.create({
      medicineName: medicineName.trim(),
      price: parseFloat(price),
      inStock: inStock === true || inStock === 'true',
      pharmacyId: resolvedPharmacyId,
      pharmacyNameSnapshot,
      isNewPharmacy: false, // POINT 3: Never create new pharmacy from user submission
      submittedBy: { userId, userName, userEmail },
      billImage,
      personalNote: personalNote?.trim()?.slice(0, 500),
      pharmacistResponse: { status: resolvedPharmacyId ? 'pending' : 'not_applicable' },
      status: 'pending',
    });

    // Notify pharmacist
    if (resolvedPharmacyId && pharmacistDoc) {
      notifyPharmacist(resolvedPharmacyId.toString(), {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        type: 'price_submission',
        title: 'Price Update Request',
        message: `${userName || 'A user'} submitted ₹${price} for ${medicineName}`,
        submissionId: request._id.toString(),
        submissionData: { medicineName, price, pharmacyName: pharmacyNameSnapshot, userName, imageUrl: billImage?.url, personalNote },
        isRead: false,
        pharmacistResponse: null,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json({ request: request.toObject(), pharmacistNotified: !!resolvedPharmacyId });
  } catch (err) {
    console.error('createRequest error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ── APPROVE ────────────────────────────────────────────────────
exports.approveRequest = async (req, res) => {
  try {
    const { adminKey, pharmacistId, note, selectedStockId } = req.body;
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
    const isAdmin = adminKey === ADMIN_KEY;
    const isPharmacist = !!pharmacistId;
    if (!isAdmin && !isPharmacist) return res.status(403).json({ error: 'Unauthorized' });

    const request = await PriceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found or already processed' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    const approvedBy = isAdmin ? 'admin' : `pharmacist:${pharmacistId}`;
    await performApprove(request, approvedBy, selectedStockId);

    res.json({ success: true, message: 'Approved, price updated, request deleted', approvedBy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── REJECT ─────────────────────────────────────────────────────
exports.rejectRequest = async (req, res) => {
  try {
    const { adminKey, pharmacistId } = req.body;
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';
    if (adminKey !== ADMIN_KEY && !pharmacistId) return res.status(403).json({ error: 'Unauthorized' });

    const request = await PriceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    cleanupBillImage(request);
    await PriceRequest.findByIdAndDelete(request._id);

    res.json({ success: true, message: 'Rejected and deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── LIST (admin) ────────────────────────────────────────────────
exports.listRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const filter = status !== 'all' ? { status } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      PriceRequest.find(filter).populate('pharmacyId', 'name address phone isVerified isListed isSuspended').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      PriceRequest.countDocuments(filter),
    ]);
    const enriched = requests.map(r => ({
      ...r, id: r._id.toString(),
      displayPharmacy: r.pharmacyId
        ? { ...r.pharmacyId, isListed: r.pharmacyId.isListed === true }
        : { name: r.pharmacyNameSnapshot, isListed: false },
    }));
    res.json({ requests: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const pending = await PriceRequest.countDocuments({ status: 'pending' });
    res.json({ pending, total: pending });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── PHARMACIST NOTIFICATIONS ────────────────────────────────────
exports.getPharmacistNotifications = (req, res) => {
  const { pharmacistId } = req.params;
  const notifs = pharmacistNotifications[pharmacistId] || [];
  res.json({ notifications: notifs, unread: notifs.filter(n => !n.isRead).length });
};

// POINT 3 — Respond with selectedStockId
exports.respondToNotification = async (req, res) => {
  try {
    const { pharmacistId, response, note, selectedStockId } = req.body;
    const { notifId } = req.params;

    const notifs = pharmacistNotifications[pharmacistId] || [];
    const notif = notifs.find(n => n.id === notifId);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.pharmacistResponse) return res.status(400).json({ error: 'Already responded' });

    const request = await PriceRequest.findById(notif.submissionId);
    if (!request) {
      notif.pharmacistResponse = 'already_processed';
      notif.isRead = true;
      return res.json({ success: true, message: 'Already processed' });
    }

    if (response === 'approved') {
      await performApprove(request, `pharmacist:${pharmacistId}`, selectedStockId);
    } else {
      cleanupBillImage(request);
      await PriceRequest.findByIdAndDelete(request._id);
    }

    notif.pharmacistResponse = response;
    notif.pharmacistNote = note || null;
    notif.isRead = true;
    notif.respondedAt = new Date().toISOString();

    res.json({ success: true, response, message: response === 'approved' ? 'Approved — price updated in stock + customer portal' : 'Rejected and deleted' });
  } catch (err) {
    console.error('respondToNotification error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = (req, res) => {
  const { pharmacistId, notifId } = req.params;
  const notif = (pharmacistNotifications[pharmacistId] || []).find(n => n.id === notifId);
  if (notif) notif.isRead = true;
  res.json({ success: true });
};

exports.getNotifications = () => pharmacistNotifications;
