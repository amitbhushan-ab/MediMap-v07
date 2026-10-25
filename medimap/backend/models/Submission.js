// backend/models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  price: { type: Number, required: true },
  pharmacyName: { type: String, required: true },
  userName: { type: String, default: 'Anonymous' },
  userId: { type: String, default: 'anonymous' },

  imageUrl: { type: String },
  imageOriginalName: { type: String },
  personalNote: { type: String },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  isPharmacyListed: { type: Boolean, default: false },
  listedPharmacyId: { type: String },

  pharmacistApproval: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_applicable'],
    default: 'not_applicable'
  },
  pharmacistNote: { type: String },

  reviewedAt: { type: Date },
  reviewedBy: { type: String },

  submittedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ status: 1 });
submissionSchema.index({ userId: 1 });
submissionSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);
