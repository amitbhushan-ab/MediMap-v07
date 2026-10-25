// backend/routes/medicines.js — BUG FIXED: correct medicine search, no Azithromycin fallback
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { mockMedicines, mockPharmacies } = require('../data/seed');

const isDB = () => mongoose.connection.readyState === 1;

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
}

const BASE_PRICES = {
  'Paracetamol 500mg':18,'Amoxicillin 250mg':85,'Metformin 500mg':45,'Cetirizine 10mg':30,
  'Azithromycin 500mg':175,'Omeprazole 20mg':55,'Atorvastatin 10mg':95,'Aspirin 75mg':22,
  'Pantoprazole 40mg':60,'Levothyroxine 50mcg':110,
};

// ── Build mock results for a SPECIFIC matched medicine only ───
function buildMockResults(medicine, userLat, userLng) {
  const basePrice = BASE_PRICES[medicine.name] || Math.floor(Math.random()*100)+20;
  const variations = [-0.35, -0.05, 0.10, 0.15, -0.15, 0.08, 0.20, 0.25, -0.20, 0.05, 0.12, -0.02];
  return mockPharmacies.map((ph, i) => {
    const coords = ph.location.coordinates;
    const variation = variations[i] !== undefined ? variations[i] : (Math.random()*0.3 - 0.05);
    const price = Math.max(5, Math.round(basePrice * (1 + variation)));
    return {
      _id: `mock_${ph._id}_${medicine.name.replace(/\s/g,'_')}`,
      pharmacy: ph,
      medicine,
      price,
      inStock: ph.isOpen && i !== 4,
      distance: calcDist(userLat, userLng, coords[1], coords[0]),
      lastUpdated: new Date(Date.now() - (i % 5)*86400000 - i*3600000).toISOString(),
      fromPharmacist: false,
    };
  });
}

// ── Pharmacist stock results ───────────────────────────────────
async function getPharmacistResults(q, userLat, userLng) {
  try {
    const Stock = require('../models/Stock');
    const Pharmacist = require('../models/Pharmacist');
    const stocks = await Stock.find({
      units: { $gt: 0 },
      $or: [
        { medicineName: { $regex: q, $options: 'i' } },
        { genericName: { $regex: q, $options: 'i' } },
      ],
    }).lean();
    if (!stocks.length) return [];

    const ids = [...new Set(stocks.map(s => s.pharmacistId.toString()))];
    const pharmacists = await Pharmacist.find({ _id:{$in:ids}, isListed:true, isSuspended:{$ne:true} }).lean();

    return stocks.map(s => {
      const ph = pharmacists.find(p => p._id.toString() === s.pharmacistId.toString());
      if (!ph) return null;
      const coords = ph.location?.coordinates || [77.0378, 28.6091];
      return {
        _id: `phstock_${s._id}`,
        pharmacy: { _id:ph._id.toString(), name:ph.name, address:ph.address||'', phone:ph.phone||'', rating:ph.rating||4.0, isOpen:true, isVerified:ph.isVerified||false, isFeatured:ph.isFeatured||false, location:{ coordinates:coords } },
        medicine: { name:s.medicineName, genericName:s.genericName||'', category:s.category||'' },
        price: s.sellingPrice,
        inStock: s.units > 0,
        distance: calcDist(userLat, userLng, coords[1], coords[0]),
        lastUpdated: s.updatedAt,
        fromPharmacist: true,
      };
    }).filter(Boolean);
  } catch(e) { console.error('pharmacistResults error:', e.message); return []; }
}

// ══════════════════════════════════════════════════════════════
// GET /api/medicines/search?q=paracetamol&lat=28.4&lng=77.3
// ══════════════════════════════════════════════════════════════
router.get('/search', async (req, res) => {
  try {
    const { q, lat = 28.6092, lng = 77.0354 } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });

    const query = q.trim();
    const userLat = parseFloat(lat), userLng = parseFloat(lng);

    let medicine = null;
    let dbPriceResults = [];

    // ── 1. Try MongoDB Price collection ─────────────────────
    if (isDB()) {
      try {
        const Medicine = require('../models/Medicine');
        const Price = require('../models/Price');

        const medicines = await Medicine.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { genericName: { $regex: query, $options: 'i' } },
          ],
        }).limit(10).lean();

        if (medicines.length) {
          // Best match: exact > startsWith > includes
          medicine = medicines.find(m => m.name.toLowerCase() === query.toLowerCase())
            || medicines.find(m => m.name.toLowerCase().startsWith(query.toLowerCase()))
            || medicines[0];

          const prices = await Price.find({ medicine: medicine._id })
            .populate('pharmacy').lean();

          dbPriceResults = prices.map(p => ({
            _id: p._id,
            pharmacy: p.pharmacy,
            medicine,
            price: p.price,
            inStock: p.inStock,
            distance: p.pharmacy?.location?.coordinates
              ? calcDist(userLat, userLng, p.pharmacy.location.coordinates[1], p.pharmacy.location.coordinates[0])
              : 99,
            lastUpdated: p.lastUpdated,
            fromPharmacist: false,
          }));
        }
      } catch(dbErr) { console.log('DB price search skipped:', dbErr.message); }
    }

    // ── 2. Mock fallback — ONLY for matched medicine ─────────
    // KEY FIX: find() returns null if no match — never fall back to a default
    let mockResults = [];
    if (!dbPriceResults.length) {
      const lowerQ = query.toLowerCase();
      const matchedMock = mockMedicines.find(m =>
        m.name.toLowerCase().includes(lowerQ) ||
        (m.genericName && m.genericName.toLowerCase().includes(lowerQ))
      );
      // KEY FIX: Only use mock results if we actually found a matching medicine
      if (matchedMock) {
        medicine = medicine || matchedMock;
        mockResults = buildMockResults(matchedMock, userLat, userLng);
      }
      // If matchedMock === undefined → mockResults stays [] → we'll check pharmacist stock
    }

    // ── 3. Pharmacist stock ───────────────────────────────────
    const pharmacistResults = isDB() ? await getPharmacistResults(query, userLat, userLng) : [];

    // ── 4. Merge all ──────────────────────────────────────────
    const allResults = [...dbPriceResults, ...mockResults, ...pharmacistResults];

    if (!allResults.length) {
      const suggestions = mockMedicines
        .filter(m => m.name.toLowerCase().startsWith(query.slice(0,3).toLowerCase()))
        .map(m => m.name).slice(0, 5);
      return res.status(404).json({
        error: `No results found for "${query}"`,
        suggestions: suggestions.length ? suggestions : mockMedicines.slice(0,5).map(m=>m.name),
      });
    }

    // ── 5. Sort by distance ───────────────────────────────────
    allResults.sort((a, b) => (a.distance||99) - (b.distance||99));

    // ── 6. Mark cheapest ──────────────────────────────────────
    const inStockPrices = allResults.filter(r => r.inStock).map(r => r.price);
    const minPrice = inStockPrices.length ? Math.min(...inStockPrices) : null;
    const final = allResults.map(r => ({ ...r, isCheapest: minPrice !== null && r.price === minPrice && r.inStock }));

    res.json({ medicine, results: final });
  } catch(err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicines
router.get('/', async (req, res) => {
  try {
    if (isDB()) {
      const Medicine = require('../models/Medicine');
      const dbMeds = await Medicine.find().lean();
      if (dbMeds.length) return res.json(dbMeds);
    }
    res.json(mockMedicines);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
