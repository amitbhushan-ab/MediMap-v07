// backend/models/Supplier.js — v2 with cancellationReason + fromRequirementId
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  // unitCost removed — supplier sets price
  expectedDate: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['Pending','Received','Cancelled'], default: 'Pending' },
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  fromRequirementId: { type: mongoose.Schema.Types.ObjectId },
  emailSent: { type: Boolean, default: false },
  emailSentAt: { type: Date },
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true, index: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String, trim: true },
  gstNo: { type: String, trim: true, uppercase: true },
  category: { type: String, trim: true },
  creditDays: { type: Number, default: 30 },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  orders: [orderSchema],
}, { timestamps: true });

supplierSchema.index({ pharmacistId: 1, isActive: 1 });
module.exports = mongoose.model('Supplier', supplierSchema);