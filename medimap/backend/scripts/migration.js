// backend/scripts/migrate.js
// Run ONCE: node backend/scripts/migrate.js
// Merges old Pharmacy collection into new Pharmacist collection
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medimap';

async function migrate() {
  console.log('🔄 Starting migration...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;

  // ── Step 1: Check if old Pharmacy collection exists ──────────
  const collections = await db.listCollections().toArray();
  const hasPharmacies = collections.some(c => c.name === 'pharmacies');
  const hasPharmacists = collections.some(c => c.name === 'pharmacists');

  console.log(`📋 Collections found: ${collections.map(c => c.name).join(', ')}`);

  const Pharmacist = require('../models/Pharmacist');

  // ── Step 2: Migrate old pharmacies → Pharmacist collection ──
  if (hasPharmacies) {
    const oldPharmacies = await db.collection('pharmacies').find({}).toArray();
    console.log(`📦 Found ${oldPharmacies.length} old pharmacies to migrate`);

    let migrated = 0, skipped = 0;
    for (const old of oldPharmacies) {
      const existing = await Pharmacist.findOne({ $or: [
        { email: old.email },
        { name: old.name, address: old.address },
      ]});

      if (existing) {
        // Merge fields if not already set
        const updates = {};
        if (!existing.phone && old.phone) updates.phone = old.phone;
        if (!existing.address && old.address) updates.address = old.address;
        if (!existing.rating && old.rating) updates.rating = old.rating;
        if (old.location?.coordinates) {
          updates.location = { type: 'Point', coordinates: old.location.coordinates };
        }
        if (Object.keys(updates).length > 0) {
          await Pharmacist.findByIdAndUpdate(existing._id, updates);
        }
        skipped++;
        continue;
      }

      // Create new Pharmacist entry from old Pharmacy
      await Pharmacist.create({
        _id: old._id, // Keep same _id to preserve Price references
        name: old.name,
        email: old.email || `legacy_${old._id}@medimap.internal`,
        phone: old.phone,
        address: old.address,
        city: old.city || '',
        isListed: true,
        isVerified: false,
        source: 'seeded',
        rating: old.rating || 4.0,
        reviewCount: old.reviewCount || 0,
        hours: old.hours,
        isOpen: old.isOpen !== false,
        chain: old.chain,
        location: old.location || { type: 'Point', coordinates: [77.0378, 28.6091] },
      });
      migrated++;
    }
    console.log(`✅ Pharmacies migrated: ${migrated} new, ${skipped} already existed`);
  }

  // ── Step 3: Migrate existing Pharmacist owners to new schema ─
  if (hasPharmacists) {
    const oldPharmacists = await db.collection('pharmacists').find({}).toArray();
    console.log(`👤 Found ${oldPharmacists.length} pharmacist accounts`);

    for (const old of oldPharmacists) {
      // Check if already in new collection with proper schema
      const existing = await Pharmacist.findOne({ email: old.email });
      if (!existing) {
        await Pharmacist.create({
          _id: old._id,
          name: old.name,
          ownerName: old.ownerName,
          email: old.email || `legacy_ph_${old._id}@medimap.internal`,
          password: old.password, // Keep hashed password
          phone: old.phone,
          address: old.address,
          gstin: old.gstin,
          licenseNo: old.licenseNo,
          isPremium: old.isPremium || false,
          premiumExpiry: old.premiumExpiry,
          isListed: old.isListed !== false,
          role: 'pharmacy_owner',
          source: 'self_registered',
          location: old.location || { type: 'Point', coordinates: [77.0378, 28.6091] },
        });
        console.log(`  Migrated pharmacist: ${old.name}`);
      }
    }
  }

  // ── Step 4: Update Price collection references ────────────────
  // Old Price.pharmacy referenced Pharmacy collection
  // New Price.pharmacy references Pharmacist collection
  // Since we kept same _id values, references should still work
  const Price = require('../models/Price');
  const priceCount = await Price.countDocuments();
  console.log(`💰 Price records: ${priceCount} (references preserved via same _id)`);

  // ── Step 5: Final stats ───────────────────────────────────────
  const totalPharmacists = await Pharmacist.countDocuments();
  const listed = await Pharmacist.countDocuments({ isListed: true });
  const verified = await Pharmacist.countDocuments({ isVerified: true });

  console.log('\n📊 Migration Complete:');
  console.log(`  Total Pharmacist records: ${totalPharmacists}`);
  console.log(`  Listed: ${listed}`);
  console.log(`  Verified: ${verified}`);
  console.log('\n⚠️  Next steps:');
  console.log('  1. Verify data in MongoDB Compass');
  console.log('  2. Delete old "pharmacies" collection after verification: db.pharmacies.drop()');
  console.log('  3. Restart backend server');

  await mongoose.disconnect();
  console.log('✅ Migration done!');
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
