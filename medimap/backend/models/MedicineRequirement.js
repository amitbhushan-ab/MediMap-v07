// backend/models/MedicineRequirement.js — Medicine requirements/purchase list
const mongoose = require('mongoose');

const requirementItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'strips' },
  priority: { type: String, enum: ['high','medium','low'], default: 'medium' },
  notes: { type: String },
  status: { type: String, enum: ['pending','ordered','received'], default: 'pending' },
}, { _id: true });

const requirementSchema = new mongoose.Schema({
  pharmacistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacist', required: true, index: true },
  title: { type: String, default: 'Purchase List' },
  items: [requirementItemSchema],
  sentToSuppliers: [{
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: String,
    supplierEmail: String,
    sentAt: Date,
  }],
  status: { type: String, enum: ['draft','sent','completed'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('MedicineRequirement', requirementSchema);
