// backend/models/Price.js — UPDATED (links to Pharmacist, not Pharmacy)
const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({

  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },

  // FIXED: now references Pharmacist (single master collection)
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true, index: true },

  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number },          // Maximum Retail Price
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number },

  lastUpdated: { type: Date, default: Date.now },
  submittedBy: { type: String, default: 'system' }, // 'system' | userId | 'admin'

  // History (keep last 10 price changes)
  priceHistory: [{
    price: Number,
    inStock: Boolean,
    date: { type: Date, default: Date.now },
    updatedBy: String,
  }],

  // Source of last update
  lastUpdateSource: {
    type: String,
    enum: ['pharmacist_stock', 'user_submission', 'admin', 'system'],
    default: 'system',
  },

}, {
  timestamps: true,
});

priceSchema.index({ medicine: 1, pharmacy: 1 }, { unique: true }); // one price per medicine per pharmacy
priceSchema.index({ pharmacy: 1, inStock: 1 });
priceSchema.index({ price: 1 });

module.exports = mongoose.model('Price', priceSchema);
