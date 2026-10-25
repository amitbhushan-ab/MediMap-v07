// backend/models/Stock.js — v2 with supplier tagging
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true },
  medicineName: { type: String, required: true },
  genericName: { type: String },
  manufacturer: { type: String },
  batchNo: { type: String },
  expiryDate: { type: String },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, required: true },
  units: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 10 },
  category: { type: String },
  hsn: { type: String, default: '30049099' },
  gstRate: { type: Number, default: 12 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String }, // cached name for quick display
  updatedAt: { type: Date, default: Date.now }
});

stockSchema.index({ medicineName: 'text', genericName: 'text' });
stockSchema.index({ pharmacistId: 1 });
stockSchema.index({ pharmacistId: 1, supplierId: 1 });
module.exports = mongoose.model('Stock', stockSchema);