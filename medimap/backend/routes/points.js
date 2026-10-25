// backend/routes/points.js — FULLY PERSISTENT MongoDB version
// Fixes: in-memory → DB, admin award works, coupons persist, validate works
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { MediWallet, Coupon } = require('../models/MediMap_DB');

const isDB = () => mongoose.connection.readyState === 1;

// ── Fallback in-memory (if DB not connected) ──────────────────
const _mem = { points: {}, coupons: [] };

async function getWallet(userId) {
  if (!userId) throw new Error('userId required');
  if (isDB()) {
    return await MediWallet.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId, points: 0, transactions: [] } },
      { upsert: true, new: true }
    );
  }
  if (!_mem.points[userId]) _mem.points[userId] = { userId, points: 0, transactions: [] };
  return _mem.points[userId];
}

function generateCouponCode(prefix, userId) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ts = Date.now().toString().slice(-4);
  const user = userId.slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  return `${prefix}-${user}${rand}${ts}`;
}

const TIERS = [
  { points: 500,  discount: 20, prefix: 'MEDI20' },
  { points: 1000, discount: 30, prefix: 'MEDI30' },
  { points: 2000, discount: 50, prefix: 'MEDI50' },
];

// ── GET /api/points/:userId ───────────────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === 'tiers') return res.json(TIERS); // avoid conflict

    const wallet = await getWallet(userId);
    let coupons;
    if (isDB()) {
      coupons = await Coupon.find({ userId, expiresAt: { $gt: new Date() } }).lean();
    } else {
      coupons = _mem.coupons.filter(c => c.userId === userId && new Date(c.expiresAt) > new Date());
    }

    res.json({
      userId,
      points: wallet.points || 0,
      transactions: (wallet.transactions || []).slice(-20).reverse(),
      coupons,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/points/tiers/all ─────────────────────────────────
router.get('/tiers/all', (req, res) => res.json(TIERS));

// ── POST /api/points/earn — user earns 20 pts on submission approved ──
router.post('/earn', async (req, res) => {
  try {
    const { userId, reason, submissionId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const pts = 20;

    if (isDB()) {
      const wallet = await MediWallet.findOneAndUpdate(
        { userId },
        {
          $inc: { points: pts },
          $push: { transactions: { type: 'earn', points: pts, reason: reason || 'Submission approved', refId: submissionId, createdAt: new Date() } },
          $setOnInsert: { userId },
        },
        { upsert: true, new: true }
      );
      return res.json({ points: wallet.points, earned: pts });
    }

    // Fallback
    if (!_mem.points[userId]) _mem.points[userId] = { userId, points: 0, transactions: [] };
    _mem.points[userId].points += pts;
    _mem.points[userId].transactions.push({ type: 'earn', points: pts, reason, refId: submissionId, createdAt: new Date() });
    res.json({ points: _mem.points[userId].points, earned: pts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/points/admin-award — admin awards/deducts points ──
// FIX #2: This now persists to MongoDB
router.post('/admin-award', async (req, res) => {
  try {
    const { userId, points, reason, adminKey } = req.body;
    if ((adminKey || req.headers['x-admin-key']) !== (process.env.ADMIN_KEY || 'admin123')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!userId || points === undefined) return res.status(400).json({ error: 'userId and points required' });

    const pts = parseInt(points);
    const type = pts >= 0 ? 'admin_award' : 'admin_deduct';

    if (isDB()) {
      // Prevent negative balance
      const wallet = await MediWallet.findOne({ userId });
      if (wallet && pts < 0 && wallet.points + pts < 0) {
        return res.status(400).json({ error: `Cannot deduct ${Math.abs(pts)}. User has only ${wallet.points} points.` });
      }

      const updated = await MediWallet.findOneAndUpdate(
        { userId },
        {
          $inc: { points: pts },
          $push: { transactions: { type, points: pts, reason: reason || 'Admin action', createdAt: new Date() } },
          $setOnInsert: { userId },
        },
        { upsert: true, new: true }
      );

      // Ensure points don't go negative
      if (updated.points < 0) {
        await MediWallet.findOneAndUpdate({ userId }, { $set: { points: 0 } });
        updated.points = 0;
      }

      console.log(`🏆 Admin awarded ${pts} pts to ${userId}. New balance: ${updated.points}`);
      return res.json({ success: true, points: updated.points, awarded: pts });
    }

    // Fallback
    if (!_mem.points[userId]) _mem.points[userId] = { userId, points: 0, transactions: [] };
    _mem.points[userId].points = Math.max(0, (_mem.points[userId].points || 0) + pts);
    res.json({ success: true, points: _mem.points[userId].points, awarded: pts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/points/redeem — user redeems points for coupon ──
router.post('/redeem', async (req, res) => {
  try {
    const { userId, tier } = req.body;
    if (!userId || !tier) return res.status(400).json({ error: 'userId and tier required' });

    const tierConfig = TIERS[parseInt(tier) - 1];
    if (!tierConfig) return res.status(400).json({ error: 'Invalid tier' });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const code = generateCouponCode(tierConfig.prefix, userId);

    if (isDB()) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const wallet = await MediWallet.findOne({ userId }).session(session);
        const currentPts = wallet?.points || 0;
        if (currentPts < tierConfig.points) {
          await session.abortTransaction();
          return res.status(400).json({ error: `Need ${tierConfig.points} pts. You have ${currentPts}.` });
        }

        await MediWallet.findOneAndUpdate(
          { userId },
          {
            $inc: { points: -tierConfig.points },
            $push: { transactions: { type: 'redeem', points: -tierConfig.points, reason: `Redeemed ${tierConfig.discount}% coupon`, refId: code, createdAt: new Date() } },
          },
          { session }
        );

        const coupon = await Coupon.create([{
          code, userId,
          discount: tierConfig.discount,
          pointsUsed: tierConfig.points,
          isUsed: false, expiresAt,
        }], { session });

        await session.commitTransaction();
        const updatedWallet = await MediWallet.findOne({ userId });
        return res.json({ coupon: coupon[0], remainingPoints: updatedWallet.points });
      } catch (err) {
        await session.abortTransaction();
        throw err;
      } finally {
        session.endSession();
      }
    }

    // Fallback
    const w = _mem.points[userId] || { points: 0 };
    if (w.points < tierConfig.points) return res.status(400).json({ error: `Need ${tierConfig.points}` });
    _mem.points[userId] = { ..._mem.points[userId], points: w.points - tierConfig.points };
    const coupon = { id: `c_${Date.now()}`, code, userId, discount: tierConfig.discount, pointsUsed: tierConfig.points, isUsed: false, expiresAt: expiresAt.toISOString() };
    _mem.coupons.push(coupon);
    res.json({ coupon, remainingPoints: _mem.points[userId].points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/points/validate-coupon — FIX #11 ───────────────
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    const upperCode = code.trim().toUpperCase();

    if (isDB()) {
      const coupon = await Coupon.findOne({ code: upperCode });
      if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
      if (coupon.isUsed) return res.status(400).json({ error: 'Coupon already used' });
      if (new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: 'Coupon expired' });
      if (!coupon.forAnyUser && !coupon.userId) return res.status(400).json({ error: 'Invalid coupon' });

      return res.json({ valid: true, code: coupon.code, discount: coupon.discount, expiresAt: coupon.expiresAt });
    }

    const coupon = _mem.coupons.find(c => c.code === upperCode);
    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
    if (coupon.isUsed) return res.status(400).json({ error: 'Coupon already used' });
    if (new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ error: 'Coupon expired' });
    res.json({ valid: true, code: coupon.code, discount: coupon.discount, expiresAt: coupon.expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/points/use-coupon — marks used after billing ───
router.post('/use-coupon', async (req, res) => {
  try {
    const { code, billId } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    const upperCode = code.trim().toUpperCase();

    if (isDB()) {
      const coupon = await Coupon.findOneAndUpdate(
        { code: upperCode, isUsed: false },
        { isUsed: true, usedAt: new Date(), usedInBillId: billId },
        { new: true }
      );
      if (!coupon) return res.status(400).json({ error: 'Coupon not found or already used' });
      return res.json({ success: true });
    }

    const idx = _mem.coupons.findIndex(c => c.code === upperCode && !c.isUsed);
    if (idx === -1) return res.status(400).json({ error: 'Not found or already used' });
    _mem.coupons[idx].isUsed = true;
    _mem.coupons[idx].usedAt = new Date().toISOString();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/points/admin-create-coupon — admin creates coupon ──
router.post('/admin-create-coupon', async (req, res) => {
  try {
    const { adminKey, discount, validDays = 30, userId, code: customCode, forAnyUser } = req.body;
    if ((adminKey || req.headers['x-admin-key']) !== (process.env.ADMIN_KEY || 'admin123')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const code = customCode?.toUpperCase() || `ADMIN${discount}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

    if (isDB()) {
      const existing = await Coupon.findOne({ code });
      if (existing) return res.status(409).json({ error: 'Coupon code already exists' });
      const coupon = await Coupon.create({ code, userId: userId || 'admin', discount, pointsUsed: 0, expiresAt, isAdminCoupon: true, forAnyUser: !!forAnyUser });
      return res.json({ success: true, coupon });
    }

    const coupon = { id: `ac_${Date.now()}`, code, userId: userId || 'admin', discount, pointsUsed: 0, isUsed: false, expiresAt: expiresAt.toISOString(), isAdminCoupon: true };
    _mem.coupons.push(coupon);
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/points/admin/all-coupons ─────────────────────────
router.get('/admin/all-coupons', async (req, res) => {
  try {
    if (req.headers['x-admin-key'] !== (process.env.ADMIN_KEY || 'admin123')) return res.status(403).json({ error: 'Unauthorized' });
    if (isDB()) {
      const coupons = await Coupon.find().sort({ createdAt: -1 }).limit(100).lean();
      return res.json(coupons);
    }
    res.json(_mem.coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export helper for other routes
module.exports = router;
module.exports.awardPoints = async (userId, reason, refId) => {
  const pts = 20;
  if (isDB()) {
    await MediWallet.findOneAndUpdate(
      { userId },
      { $inc: { points: pts }, $push: { transactions: { type: 'earn', points: pts, reason, refId, createdAt: new Date() } }, $setOnInsert: { userId } },
      { upsert: true }
    );
  } else {
    if (!_mem.points[userId]) _mem.points[userId] = { userId, points: 0, transactions: [] };
    _mem.points[userId].points += pts;
    _mem.points[userId].transactions.push({ type: 'earn', points: pts, reason, refId });
  }
  return pts;
};
