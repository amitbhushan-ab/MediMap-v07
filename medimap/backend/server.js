// backend/server.js — v4 FINAL with all new models registered
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json({ limit:'15mb' }));
app.use(express.urlencoded({ extended:true, limit:'15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const { MongoMemoryServer } = require('mongodb-memory-server');

// ── MongoDB ───────────────────────────────────────────────────
async function connectDB() {
  let uri = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/medimap';
  
  if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
    try {
      console.log('🔄 Attempting local MongoDB connection...');
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Local MongoDB connected');
    } catch (err) {
      console.log('⚠️ Local MongoDB not found, starting memory server...');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('✅ In-Memory MongoDB connected');
    }
  } else {
    await mongoose.connect(uri);
    console.log('✅ Cloud MongoDB connected');
  }

  // Register all models
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

  // One-time seed
  const { seedIfEmpty } = require('./data/seed');
  await seedIfEmpty();
}

connectDB()
  .then(() => {
    // Automated refill reminders: runs daily at AUTO_REMINDERS_HOUR (default
    // 09:00) plus a catch-up run shortly after boot. AUTO_REMINDERS_ENABLED=false turns it off.
    require('./services/refillService').startAutoRefillScheduler();
  })
  .catch(err => console.log('⚠️ MongoDB not connected:', err.message));

// ── Routes ────────────────────────────────────────────────────
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

app.get('/api/health', async (req, res) => {
  let info = {};
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
  res.json({ status:'ok', db:mongoose.connection.readyState===1?'connected':'disconnected', ...info, time:new Date().toISOString(), version:'4.0.0' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 MediMap API v4.0 — http://localhost:${PORT}/api/health`);
  console.log('📊 Persistent: Bills, Suppliers, Customers, Requirements — all in MongoDB\n');
});
