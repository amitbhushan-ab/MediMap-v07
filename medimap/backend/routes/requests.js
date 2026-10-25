// backend/routes/requests.js — Price Request Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require('../controllers/priceRequestController');

// ── Multer for bill image upload ──────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `bill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only JPG, PNG, PDF, WEBP files allowed'));
  },
});

// ── Routes ────────────────────────────────────────────────────
// Create new price request (user submits)
router.post('/', upload.single('billImage'), controller.createRequest);

// List all requests (admin)
router.get('/', controller.listRequests);

// Get stats (admin)
router.get('/stats', controller.getStats);

// Approve request (admin) → price updated → request DELETED
router.patch('/:id/approve', controller.approveRequest);

// Reject request (admin) → request DELETED
router.patch('/:id/reject', controller.rejectRequest);

// Pharmacist notifications
router.get('/notifications/:pharmacistId', controller.getPharmacistNotifications);
router.patch('/notifications/:pharmacistId/:notifId/respond', controller.respondToNotification);
router.patch('/notifications/:pharmacistId/:notifId/read', controller.markNotificationRead);

// Error handler for multer
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Max 10MB.' });
  if (err.message) return res.status(400).json({ error: err.message });
  next(err);
});

module.exports = router;
