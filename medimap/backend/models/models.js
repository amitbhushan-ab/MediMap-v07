// models/Prescription.js
const mongoose = require('mongoose');

const medicineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  dosage: { type: String, default: 'Not specified' },
  quantity: { type: String, default: 'Not specified' },
  frequency: { type: String, default: 'Not specified' }
});

const prescriptionSchema = new mongoose.Schema({
  originalFilename: { type: String },
  rawText: { type: String },
  ocrConfidence: { type: Number },
  medicines: [medicineItemSchema],
  parseMethod: { type: String, enum: ['gemini', 'regex'], default: 'regex' },
  medicineCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  errorMessage: { type: String },
  scannedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
    