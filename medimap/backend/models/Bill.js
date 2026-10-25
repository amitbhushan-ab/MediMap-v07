// backend/models/Bill.js — Persistent MongoDB Bill storage
const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  batchNo: { type: String, default: 'N/A' },
  expiryDate: { type: String, default: 'N/A' },
  hsn: { type: String, default: '30049099' },
  gstRate: { type: Number, default: 12 },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  basePrice: { type: Number },
  gstAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  stockId: { type: String },
  isManual: { type: Boolean, default: false },
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true, index: true },
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true, index: true },
  pharmacyName: String,
  pharmacyAddress: String,
  pharmacyPhone: String,
  gstin: String,
  licenseNo: String,
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  customerEmail: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'RegularCustomer' }, // link to regular customer
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  totalGST: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash','Card','UPI','Credit'], default: 'Cash' },
  couponCode: { type: String },
  status: { type: String, enum: ['paid','pending','cancelled'], default: 'paid' },
}, { timestamps: true });

billSchema.index({ pharmacistId: 1, createdAt: -1 });
billSchema.index({ pharmacistId: 1, 'items.medicineName': 1 });
billSchema.index({ pharmacistId: 1, customerPhone: 1 });

module.exports = mongoose.model('Bill', billSchema);
