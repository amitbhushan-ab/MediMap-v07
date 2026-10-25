// backend/models/MediMap_DB.js
// Shared schemas for Loyalty Points & Wallet system
const mongoose = require('mongoose');

// ── Points Transaction Schema ─────────────────────────────────
const pointTxSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  action: {
    type: String,
    enum: ['price_submission', 'bill_upload', 'bonus', 'referral', 'redeem_coupon', 'admin_adjustment'],
    required: true,
  },
  points: { type: Number, required: true }, // positive = earned, negative = spent
  description: { type: String, required: true },
  referenceId: String,   // billId, submissionId, couponId, etc.
  createdAt: { type: Date, default: Date.now },
});

// ── User Wallet (Aggregated Balance & Tier) ────────────────────
const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  balance: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze',
  },
  multiplier: { type: Number, default: 1.0 }, // Bronze=1.0x, Silver=1.2x, Gold=1.5x, Platinum=2.0x
  streak: { type: Number, default: 0 },       // consecutive weeks with an action
  lastActivityAt: { type: Date, default: Date.now },
  transactions: [pointTxSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── Redeemable Coupons ─────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  discount: { type: Number, required: true },        // percentage
  pointsUsed: { type: Number, required: true },
  isUsed: { type: Boolean, default: false, index: true },
  usedAt: Date,
  usedInBillId: String,
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  // Admin-created coupons
  isAdminCoupon: { type: Boolean, default: false },
  forAnyUser: { type: Boolean, default: false },     // admin global coupon
});

// Auto-expire index
couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MediWallet = mongoose.model('MediWallet', walletSchema);
const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = { MediWallet, Coupon };
