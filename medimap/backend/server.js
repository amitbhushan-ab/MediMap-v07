// backend/server.js — v4 FINAL with all new models registered & Render deployment ready
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { MongoMemoryServer } = require('mongodb-memory-server');

// ── MongoDB ───────────────────────────────────────────────────
async function connectDB() {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/medimap';
  
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    try {
      console.log('🔄 Attempting local MongoDB connection...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Local MongoDB connected');
    } catch (err) {
      console.log('⚠️ Local MongoDB not found, attempting memory server...');
      try {
        const mongoServer = await MongoMemoryServer.create();
        uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('✅ In-Memory MongoDB connected');
      } catch (memErr) {
        console.log('⚠️ In-Memory MongoDB not available:', memErr.message);
        console.log('👉 Tip: Set MONGODB_URI on Render to connect to your MongoDB Atlas cluster.');
      }
    }
  } else {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Cloud MongoDB connected');
    } catch (err) {
      console.error('❌ Cloud MongoDB connection failed:', err.message);
      console.log('👉 Tip: Ensure your MongoDB Atlas Network Access has 0.0.0.0/0 (Allow access from anywhere) enabled.');
    }
  }

  // Register all models
  try {
    require('./models/Bill');
    require('./models/Supplier');
    require('./models/RegularCustomer');
    require('./models/MedicineRequirement');
    require('./models/Pharmacist');
    require('./models/Medicine');
    require('./models/Price');
    require('./models/Stock');
    require('./models/PriceRequest');
    require('./models/Notification');
    require('./models/User');

    // One-time seed only if connected
    if (mongoose.connection.readyState === 1) {
      const { seedIfEmpty } = require('./data/seed');
      await seedIfEmpty();
    } else {
      console.log('ℹ️ Skipping initial seed: MongoDB is not connected yet.');
    }
  } catch (err) {
    console.warn('⚠️ Model registration / seed note:', err.message);
  }
}

connectDB()
  .then(() => {
    // Automated refill reminders: runs daily at AUTO_REMINDERS_HOUR (default 09:00)
    try {
      require('./services/refillService').startAutoRefillScheduler();
    } catch (err) {
      console.warn('⚠️ Auto-refill scheduler:', err.message);
    }
  })
  .catch(err => console.log('⚠️ MongoDB connect error:', err.message));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/users',           require('./routes/users'));
app.use('/api/medicines',       require('./routes/medicines'));
app.use('/api/pharmacies',      require('./routes/pharmacies'));
app.use('/api/prices',          require('./routes/prices'));
app.use('/api/ai',              require('./routes/ai'));
app.use('/api/chat',            require('./routes/chat'));
app.use('/api/pharmacist',      require('./routes/pharmacist'));
app.use('/api/pharmacy-search', require('./routes/pharmacySearch'));
app.use('/api/requests',        require('./routes/requests'));
app.use('/api/admin',           require('./routes/admin'));
app.use('/api/points',          require('./routes/points'));
app.use('/api/prescription',    require('./routes/prescriptionRoutes'));
app.use('/api/bridge',          require('./routes/bridge'));

// ── Health Check (Render Deployment Health Route) ──────────────
// Must always return 200 immediately without blocking on pending DB connections
app.get('/api/health', async (req, res) => {
  let info = {};
  if (mongoose.connection.readyState === 1) {
    try {
      const Pharmacist = require('./models/Pharmacist');
      const PriceRequest = require('./models/PriceRequest');
      const Bill = require('./models/Bill');
      const Supplier = require('./models/Supplier');
      const RegularCustomer = require('./models/RegularCustomer');
      info = {
        pharmacists: await Pharmacist.countDocuments(),
        pendingRequests: await PriceRequest.countDocuments({ status:'pending' }),
        bills: await Bill.countDocuments(),
        suppliers: await Supplier.countDocuments(),
        customers: await RegularCustomer.countDocuments(),
      };
    } catch {}
  }

  res.status(200).json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ...info,
    time: new Date().toISOString(),
    version: '4.0.0'
  });
});

// ── Static Frontend Serving (for Unified Single-Service Deployment) ──
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log('📦 Serving production frontend build from:', frontendDist);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Error Handling ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 MediMap API v4.0 — running on port ${PORT}`);
  console.log(`📡 Health endpoint: /api/health`);
  console.log('📊 Persistent: Bills, Suppliers, Customers, Requirements — MongoDB ready\n');
});
