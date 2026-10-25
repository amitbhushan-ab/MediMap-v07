// backend/models/Pharmacist.js — SINGLE MASTER MODEL
// Replaces both Pharmacy + Pharmacist collections
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const pharmacistSchema = new mongoose.Schema({

  // ── Identity ────────────────────────────────────────────────
  name: { type: String, required: true, trim: true, index: true },
  ownerName: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String },
  phone: { type: String, trim: true },

  // ── Role ────────────────────────────────────────────────────
  role: {
    type: String,
    enum: ['pharmacy_owner', 'admin'],
    default: 'pharmacy_owner',
    index: true,
  },

  // ── Location ────────────────────────────────────────────────
  address: { type: String, trim: true },
  city: { type: String, trim: true, index: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [77.0378, 28.6091] }, // [lng, lat] (NSUT Dwarka, New Delhi)
  },

  // ── Licensing ───────────────────────────────────────────────
  gstin: { type: String, trim: true, uppercase: true },
  licenseNo: { type: String, trim: true },
  licenseExpiry: { type: Date },

  // ── Status ──────────────────────────────────────────────────
  isListed: { type: Boolean, default: true, index: true },
  isVerified: { type: Boolean, default: false, index: true },
  isSuspended: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  // ── Premium ─────────────────────────────────────────────────
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date },
  premiumPlan: { type: String, enum: ['monthly', 'annual', null], default: null },

  // ── Ratings (aggregated) ────────────────────────────────────
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  totalRatingSum: { type: Number, default: 0 },

  // ── Operational ─────────────────────────────────────────────
  hours: { type: String, default: 'Mon-Sat: 8AM–9PM, Sun: 9AM–6PM' },
  isOpen: { type: Boolean, default: true },
  chain: { type: String, trim: true },

  // ── Admin note ──────────────────────────────────────────────
  adminNote: { type: String },
  suspendedReason: { type: String },

  // ── Source tracking ─────────────────────────────────────────
  // How was this pharmacy added?
  source: {
    type: String,
    enum: ['self_registered', 'admin_added', 'user_submission', 'seeded'],
    default: 'self_registered',
  },

  // If added from user submission, track the original request
  createdFromRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceRequest' },

}, {
  timestamps: true, // createdAt + updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────
pharmacistSchema.index({ location: '2dsphere' });
pharmacistSchema.index({ name: 'text', address: 'text', city: 'text' });
pharmacistSchema.index({ isListed: 1, isSuspended: 1, isVerified: 1 });
pharmacistSchema.index({ isPremium: 1 });

// ── Virtual: display rating ───────────────────────────────────
pharmacistSchema.virtual('displayRating').get(function() {
  if (!this.reviewCount) return this.rating;
  return parseFloat((this.totalRatingSum / this.reviewCount).toFixed(1));
});

// ── Virtual: is premium active ────────────────────────────────
pharmacistSchema.virtual('isPremiumActive').get(function() {
  if (!this.isPremium) return false;
  if (!this.premiumExpiry) return true;
  return new Date(this.premiumExpiry) > new Date();
});

// ── Pre-save: hash password ───────────────────────────────────
pharmacistSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// ── Methods ───────────────────────────────────────────────────
pharmacistSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

pharmacistSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.adminNote;
  return obj;
};

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
