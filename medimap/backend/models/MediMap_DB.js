// backend/models/MediPoints.js — PERSISTENT MongoDB storage for MediPoints
const mongoose = require('mongoose');

// ── MediPoints wallet (one per user) ─────────────────────────
const walletSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  points: { type: Number, default: 0, min: 0 },
  transactions: [{
    type: { type: String, enum: ['earn', 'redeem', 'admin_award', 'admin_deduct', 'coupon_use'] },
    points: Number,
    reason: String,
    refId: String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

walletSchema.methods.earn = async function(points, reason, refId) {
  this.points += points;
  this.transactions.push({ type: 'earn', points, reason, refId });
  return this.save();
};

walletSchema.methods.deduct = async function(points, reason, refId) {
  if (this.points < points) throw new Error(`Insufficient points. Have: ${this.points}, Need: ${points}`);
  this.points -= points;
  this.transactions.push({ type: 'redeem', points: -points, reason, refId });
  return this.save();
};

walletSchema.methods.adminAward = async function(points, reason) {
  if (points > 0) {
    this.points += points;
    this.transactions.push({ type: 'admin_award', points, reason });
  } else {
    this.points = Math.max(0, this.points + points); // deduct
    this.transactions.push({ type: 'admin_deduct', points, reason });
  }
  return this.save();
};

// ── Coupon model ─────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  userId: { type: String, required: true, index: true },
  discount: { type: Number, required: true },        // percentage
  pointsUsed: { type: Number, required: true },
  isUsed: { type: Boolean, default: false, index: true },
  usedAt: Date,
  usedInBillId: String,
  expiresAt: { type: Date, required: true, index: true },
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
