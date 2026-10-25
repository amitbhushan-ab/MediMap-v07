// backend/scripts/generateCredentials.js — FIX #3
// Run: node backend/scripts/generateCredentials.js
// Creates hashed passwords and prints plain text for testing
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medimap';

const DEFAULT_PHARMACISTS = [
  { name: 'Jan Aushadhi Kendra - NSUT Gate 1', email: 'janaushadhi@medimap.com', password: 'JanAushadhi@123', phone: '011-25099021', address: 'Commercial Complex, NSUT, Sector 3, Dwarka', gstin: '07CCCCU9603R1ZR', licenseNo: 'DL-DWK-2024-001', city: 'New Delhi' },
  { name: 'Apollo Pharmacy - Kakrola More', email: 'apollo@medimap.com', password: 'Apollo@123', phone: '011-25336622', address: 'Near Metro Pillar 788, Kakrola More, Dwarka', gstin: '07AABCU9603R1ZP', licenseNo: 'DL-DWK-2024-002', city: 'New Delhi' },
  { name: 'MedPlus Pharmacy - Sector 3 Dwarka', email: 'medplus@medimap.com', password: 'MedPlus@123', phone: '011-25081144', address: 'DDA Market, Pocket 1, Sector 3, Dwarka', gstin: '07BBBCU9603R1ZQ', licenseNo: 'DL-DWK-2024-003', city: 'New Delhi' },
];

async function generate() {
  console.log('\n🔑 Generating Pharmacist Credentials\n');
  console.log('='.repeat(60));

  await mongoose.connect(MONGO_URI);
  const Pharmacist = require('../models/Pharmacist');

  const results = [];
  for (const ph of DEFAULT_PHARMACISTS) {
    const hashed = await bcrypt.hash(ph.password, 12);
    let pharmacist = await Pharmacist.findOne({ email: ph.email });

    if (pharmacist) {
      // Update password if exists
      pharmacist.password = hashed;
      pharmacist.isSuspended = false;
      pharmacist.isListed = true;
      await pharmacist.save();
      console.log(`✅ Updated: ${ph.name}`);
    } else {
      pharmacist = await Pharmacist.create({
        name: ph.name, email: ph.email, password: hashed,
        phone: ph.phone, address: ph.address, gstin: ph.gstin,
        licenseNo: ph.licenseNo, city: ph.city,
        isListed: true, isVerified: true, isSuspended: false,
        source: 'seeded',
        location: { type: 'Point', coordinates: [77.0378, 28.6091] },
      });
      console.log(`✅ Created: ${ph.name}`);
    }

    results.push({ ...ph, id: pharmacist._id.toString() });
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 PLAIN TEXT CREDENTIALS (save these):');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`\n🏥 ${r.name}`);
    console.log(`   ID:       ${r.id}`);
    console.log(`   Email:    ${r.email}`);
    console.log(`   Password: ${r.password}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🛡️  ADMIN CREDENTIALS:');
  console.log(`   Admin Key: ${process.env.ADMIN_KEY || 'admin123'}`);
  console.log(`   URL: http://localhost:3000/admin`);
  console.log('='.repeat(60) + '\n');

  await mongoose.disconnect();
  console.log('✅ Done!\n');
}

generate().catch(err => { console.error('Error:', err.message); process.exit(1); });
