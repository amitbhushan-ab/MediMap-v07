const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  genericName: { type: String },
  category: { type: String },
  description: { type: String },
  manufacturer: { type: String },
  dosage: { type: String },
  sideEffects: [String],
  requiresPrescription: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

medicineSchema.index({ name: 'text', genericName: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
