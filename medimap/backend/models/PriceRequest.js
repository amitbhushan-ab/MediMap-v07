// backend/models/PriceRequest.js — LIFECYCLE-AWARE REQUEST MODEL
// Pending → kept in DB | Approved → price updated then DELETED | Rejected → DELETED
const mongoose = require('mongoose');

const priceRequestSchema = new mongoose.Schema({

  // ── Medicine ─────────────────────────────────────────────────
  medicineName: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  inStock: { type: Boolean, default: true },

  // ── Pharmacy Tagging — THE KEY FIX ───────────────────────────
  // ALWAYS use pharmacyId when pharmacy is listed.
  // NEVER do name-based matching.
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacist',
    index: true,
    // Optional — null means new unlisted pharmacy
  },
  // Snapshot of pharmacy name at time of submission (for display even after pharmacy edits name)
  pharmacyNameSnapshot: { type: String, required: true, trim: true },

  // ── New Pharmacy Request ──────────────────────────────────────
  // When user submits for a pharmacy NOT in our system
  isNewPharmacy: { type: Boolean, default: false, index: true },
  newPharmacyData: {
    name: String,
    address: String,
    phone: String,
    city: String,
    pincode: String,
    gstin: String,
    licenseNo: String,
  },

  // ── Submitter ────────────────────────────────────────────────
  submittedBy: {
    userId: { type: String }, // email or user ID
    userName: { type: String },
    userEmail: { type: String },
  },

  // ── Bill Evidence ────────────────────────────────────────────
  billImage: {
    url: String,       // served from /uploads/...
    filename: String,  // original filename
    mimetype: String,
  },

  // ── User note ────────────────────────────────────────────────
  personalNote: { type: String, maxlength: 500 },

  // ── Pharmacist Response ───────────────────────────────────────
  pharmacistResponse: {
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'not_applicable'], default: 'not_applicable' },
    note: String,
    respondedAt: Date,
  },

  // ── Admin Review ─────────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
  adminNote: { type: String },

  // ── Lifecycle flags ───────────────────────────────────────────
  // Track what happened after admin decision
  lifecycleAction: {
    type: String,
    enum: ['price_updated', 'new_pharmacy_created', 'discarded', null],
    default: null,
  },
  // ID of price record updated (if approved)
  updatedPriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Price' },
  // ID of new pharmacy created (if new pharmacy approved)
  createdPharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist' },

  // ── Notification tracking ─────────────────────────────────────
  pharmacistNotified: { type: Boolean, default: false },
  pharmacistNotifiedAt: { type: Date },

}, {
  timestamps: true,
});

// ── TTL Index — auto-delete approved/rejected after 30 days ──
// We also manually delete on approve/reject, but this is a safety net
priceRequestSchema.index(
  { reviewedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { status: { $in: ['approved', 'rejected'] } },
  }
);

priceRequestSchema.index({ 'submittedBy.userId': 1 });
priceRequestSchema.index({ createdAt: -1 });
priceRequestSchema.index({ status: 1, isNewPharmacy: 1 });

module.exports = mongoose.model('PriceRequest', priceRequestSchema);
