// backend/data/seed.js — Mock data and one-time DB seed
const mongoose = require('mongoose');

// ── Mock medicines for search and demonstration ───────────────
const mockMedicines = [
  { name:'Paracetamol 500mg', genericName:'Acetaminophen', category:'Analgesic', requiresPrescription:false, manufacturer:'Cipla', dosage:'500mg' },
  { name:'Amoxicillin 250mg', genericName:'Amoxicillin', category:'Antibiotic', requiresPrescription:true, manufacturer:'Sun Pharma', dosage:'250mg' },
  { name:'Metformin 500mg', genericName:'Metformin HCl', category:'Antidiabetic', requiresPrescription:true, manufacturer:'USV Ltd', dosage:'500mg' },
  { name:'Cetirizine 10mg', genericName:'Cetirizine HCl', category:'Antihistamine', requiresPrescription:false, manufacturer:"Dr. Reddy's", dosage:'10mg' },
  { name:'Azithromycin 500mg', genericName:'Azithromycin', category:'Antibiotic', requiresPrescription:true, manufacturer:'Cipla', dosage:'500mg' },
  { name:'Omeprazole 20mg', genericName:'Omeprazole', category:'Antacid', requiresPrescription:false, manufacturer:'Sun Pharma', dosage:'20mg' },
  { name:'Atorvastatin 10mg', genericName:'Atorvastatin', category:'Antilipemic', requiresPrescription:true, manufacturer:'Ranbaxy', dosage:'10mg' },
  { name:'Aspirin 75mg', genericName:'Acetylsalicylic acid', category:'Antiplatelet', requiresPrescription:false, manufacturer:'Bayer', dosage:'75mg' },
  { name:'Pantoprazole 40mg', genericName:'Pantoprazole', category:'Antacid', requiresPrescription:false, manufacturer:'Sun Pharma', dosage:'40mg' },
  { name:'Levothyroxine 50mcg', genericName:'Levothyroxine', category:'Thyroid', requiresPrescription:true, manufacturer:'Abbott', dosage:'50mcg' },
];

// ── Mock pharmacies centered around NSUT (Dwarka Sector 3, Delhi) ──
const mockPharmacies = [
  {
    _id: 'p_nsut_1',
    name: 'Jan Aushadhi Kendra - NSUT Gate 1',
    address: 'Shop 4, Commercial Complex, NSUT Gate 1, Sector 3, Dwarka, New Delhi 110078',
    phone: '011-25099021',
    contact: '011-25099021',
    hours: '8:00 AM – 10:30 PM (Mon-Sun)',
    rating: 4.8,
    reviewCount: 342,
    isOpen: true,
    isVerified: true,
    chain: 'Jan Aushadhi',
    location: { lat: 28.6105, lng: 77.0335, coordinates: [77.0335, 28.6105] },
  },
  {
    _id: 'p_nsut_2',
    name: 'MedPlus Pharmacy - Sector 3 Dwarka',
    address: 'Plot 12, DDA Local Shopping Complex, Pocket 1, Sector 3, Dwarka, New Delhi 110078',
    phone: '011-25081144',
    contact: '011-25081144',
    hours: '8:00 AM – 11:30 PM (Mon-Sun)',
    rating: 4.7,
    reviewCount: 218,
    isOpen: true,
    isVerified: true,
    chain: 'MedPlus',
    location: { lat: 28.6075, lng: 77.0390, coordinates: [77.0390, 28.6075] },
  },
  {
    _id: 'p_nsut_3',
    name: 'Apollo Pharmacy - Kakrola More',
    address: 'Shop 2, Metro Pillar 788, Near Kakrola More, Dwarka, New Delhi 110078',
    phone: '011-25336622',
    contact: '011-25336622',
    hours: '24 Hours Open',
    rating: 4.9,
    reviewCount: 480,
    isOpen: true,
    isVerified: true,
    chain: 'Apollo',
    location: { lat: 28.6140, lng: 77.0375, coordinates: [77.0375, 28.6140] },
  },
  {
    _id: 'p_nsut_4',
    name: 'City Medicos & Health - NSUT North Gate',
    address: 'Opposite NSUT North Gate, Main Road, Sector 3, Dwarka, New Delhi 110078',
    phone: '011-25091188',
    contact: '011-25091188',
    hours: '7:30 AM – 11:00 PM (Mon-Sun)',
    rating: 4.6,
    reviewCount: 145,
    isOpen: true,
    isVerified: true,
    chain: 'Independent',
    location: { lat: 28.6125, lng: 77.0348, coordinates: [77.0348, 28.6125] },
  },
  {
    _id: 'p_nsut_5',
    name: 'Apollo Pharmacy - Dwarka Mor Metro',
    address: 'Pillar 782, Main Najafgarh Road, Dwarka Mor Metro, New Delhi 110059',
    phone: '011-25334411',
    contact: '011-25334411',
    hours: '24 Hours Open',
    rating: 4.8,
    reviewCount: 420,
    isOpen: true,
    isVerified: true,
    chain: 'Apollo',
    location: { lat: 28.6185, lng: 77.0320, coordinates: [77.0320, 28.6185] },
  },
  {
    _id: 'p_nsut_6',
    name: 'Frank Ross Pharmacy - Vegas Mall',
    address: 'Lower Ground Floor, Vegas Mall, Sector 14, Dwarka, New Delhi 110078',
    phone: '011-49502200',
    contact: '011-49502200',
    hours: '10:00 AM – 10:30 PM (Mon-Sun)',
    rating: 4.7,
    reviewCount: 290,
    isOpen: true,
    isVerified: true,
    chain: 'Frank Ross',
    location: { lat: 28.6015, lng: 77.0250, coordinates: [77.0250, 28.6015] },
  },
  {
    _id: 'p_nsut_7',
    name: 'Guardian Pharmacy - Sector 12 HL Gallant Mall',
    address: 'Shop 18, HL Gallant Mall, Sector 12, Dwarka, New Delhi 110075',
    phone: '011-28032020',
    contact: '011-28032020',
    hours: '8:00 AM – 11:00 PM (Mon-Sun)',
    rating: 4.6,
    reviewCount: 185,
    isOpen: true,
    isVerified: true,
    chain: 'Guardian',
    location: { lat: 28.5925, lng: 77.0402, coordinates: [77.0402, 28.5925] },
  },
  {
    _id: 'p_nsut_8',
    name: 'Wellness Forever 24x7 - Sector 6 Central Market',
    address: 'Ground Floor, Plot 8, Sector 6 Central Market, Dwarka, New Delhi 110075',
    phone: '011-25078899',
    contact: '011-25078899',
    hours: '24 Hours Open',
    rating: 4.8,
    reviewCount: 412,
    isOpen: true,
    isVerified: true,
    chain: 'Wellness Forever',
    location: { lat: 28.5880, lng: 77.0585, coordinates: [77.0585, 28.5880] },
  },
  {
    _id: 'p_nsut_9',
    name: 'Sanjivani Chemist - Sector 4 Market',
    address: 'Shop 7, DDA Community Centre, Sector 4, Dwarka, New Delhi 110078',
    phone: '011-25083311',
    contact: '011-25083311',
    hours: '8:30 AM – 11:00 PM (Mon-Sun)',
    rating: 4.5,
    reviewCount: 160,
    isOpen: true,
    isVerified: true,
    chain: 'Sanjivani',
    location: { lat: 28.6022, lng: 77.0325, coordinates: [77.0325, 28.6022] },
  },
  {
    _id: 'p_nsut_10',
    name: 'Fortis HealthWorld - Janakpuri West',
    address: 'District Centre, Major Deepak Tyagi Marg, Janakpuri West, New Delhi 110058',
    phone: '011-45567890',
    contact: '011-45567890',
    hours: '24 Hours Open',
    rating: 4.7,
    reviewCount: 520,
    isOpen: true,
    isVerified: true,
    chain: 'Fortis',
    location: { lat: 28.6290, lng: 77.0780, coordinates: [77.0780, 28.6290] },
  },
  {
    _id: 'p_delhi_11',
    name: 'Apollo 24|7 Pharmacy - Connaught Place',
    address: 'Block B, Inner Circle, Connaught Place, Central Delhi 110001',
    phone: '011-23348822',
    contact: '011-23348822',
    hours: '24 Hours Open',
    rating: 4.8,
    reviewCount: 890,
    isOpen: true,
    isVerified: true,
    chain: 'Apollo',
    location: { lat: 28.6328, lng: 77.2195, coordinates: [77.2195, 28.6328] },
  },
  {
    _id: 'p_delhi_12',
    name: 'Batra Medical Store - AIIMS Enclave',
    address: 'Ring Road, Opp Safdarjung Hospital, Ansari Nagar, New Delhi 110029',
    phone: '011-26593300',
    contact: '011-26593300',
    hours: '24 Hours Open',
    rating: 4.6,
    reviewCount: 340,
    isOpen: true,
    isVerified: true,
    chain: 'Independent',
    location: { lat: 28.5672, lng: 77.2085, coordinates: [77.2085, 28.5672] },
  },
];

function getMockResults(query, userLat = 28.6092, userLng = 77.0354) {
  const lowerQ = query.toLowerCase();
  const medicine = mockMedicines.find(m =>
    m.name.toLowerCase().includes(lowerQ) ||
    (m.genericName && m.genericName.toLowerCase().includes(lowerQ))
  );
  if (!medicine) return null;

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
  };

  const basePrices = {
    'Paracetamol 500mg': 18,
    'Amoxicillin 250mg': 85,
    'Metformin 500mg': 45,
    'Cetirizine 10mg': 30,
    'Azithromycin 500mg': 175,
    'Omeprazole 20mg': 55,
    'Atorvastatin 10mg': 95,
    'Aspirin 75mg': 22,
    'Pantoprazole 40mg': 60,
    'Levothyroxine 50mcg': 110,
  };
  const basePrice = basePrices[medicine.name] || 50;
  const variations = [-0.35, -0.05, 0.10, 0.15, -0.15, 0.08, 0.20, 0.25, -0.20, 0.05, 0.12, -0.02];

  const results = mockPharmacies.map((ph, i) => {
    const variation = variations[i] !== undefined ? variations[i] : (Math.random() * 0.3 - 0.05);
    const price = Math.max(5, Math.round(basePrice * (1 + variation)));
    return {
      _id: `mock_${ph._id}_${medicine.name}`,
      pharmacy: ph,
      medicine,
      price,
      inStock: ph.isOpen && i !== 4,
      distance: calcDist(userLat, userLng, ph.location.lat, ph.location.lng),
      lastUpdated: new Date(Date.now() - (i % 5) * 86400000 - i * 3600000).toISOString(),
      priceHistory: [],
    };
  });

  const minPrice = Math.min(...results.filter(r => r.inStock).map(r => r.price));
  return results.map(r => ({ ...r, isCheapest: r.price === minPrice && r.inStock }));
}

// ── ONE-TIME DB seed (only if collections are empty) ──────────
let seeded = false;
async function seedIfEmpty() {
  if (seeded) return; // Never seed twice in same process
  try {
    if (mongoose.connection.readyState !== 1) return;
    const Medicine = require('../models/Medicine');
    const Pharmacy = require('../models/Pharmacy');
    const count = await Medicine.countDocuments();
    if (count > 0) { seeded = true; return; } // Already has data
    console.log('🌱 Seeding database (first time only)...');
    await Medicine.insertMany(mockMedicines.map(({ name, genericName, category, requiresPrescription, manufacturer, dosage }) => ({
      name, genericName, category, requiresPrescription, manufacturer, dosage,
    })));
    await Pharmacy.insertMany(mockPharmacies.map(({ name, address, phone, hours, rating, isOpen, chain, location }) => ({
      name, address, phone, hours, rating, isOpen, chain,
      location: { type: 'Point', coordinates: location.coordinates },
    })));
    seeded = true;
    console.log('✅ Database seeded successfully (one-time)');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = { mockMedicines, mockPharmacies, getMockResults, seedIfEmpty };
