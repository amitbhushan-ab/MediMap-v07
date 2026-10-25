const mongoose = require('mongoose');

const userSubmissionSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  pharmacyName: { type: String, required: true },
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
});

module.exports = mongoose.model('UserSubmission', userSubmissionSchema);
