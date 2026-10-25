// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Who gets this notification
  recipientType: { type: String, enum: ['pharmacist', 'user', 'admin'], required: true },
  recipientId: { type: String, required: true }, // pharmacistId or userId

  // What kind
  type: { type: String, enum: ['price_submission', 'points_awarded', 'submission_approved', 'submission_rejected', 'stock_update'], required: true },

  title: { type: String, required: true },
  message: { type: String, required: true },

  isRead: { type: Boolean, default: false },

  // For price_submission notifications (sent to pharmacist)
  submissionId: { type: String },
  submissionData: {
    medicineName: String,
    price: Number,
    pharmacyName: String,
    userName: String,
    imageUrl: String,
    personalNote: String,
  },

  // Pharmacist's response to a price submission
  pharmacistResponse: { type: String, enum: ['approved', 'rejected', null], default: null },
  pharmacistNote: { type: String },
  respondedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipientId: 1, recipientType: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
