// backend/routes/bridge.js — Bridge Mode API
// Wraps the existing medicines/search with bridge-specific smart comparison logic
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return parseFloat((R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))).toFixed(1));
}

// GET /api/bridge/search?q=paracetamol&lat=28.4&lng=77.3&budget=100
// Returns results with smart choice pre-computed
router.get('/search', async (req, res) => {
  try {
    const { q, lat = 28.6092, lng = 77.0354, budget } = req.query;
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });

    const userLat = parseFloat(lat), userLng = parseFloat(lng);
    const query = q.trim();

    // Reuse the medicines search logic
    const { mockMedicines, mockPharmacies } = require('../data/seed');
    const Stock = require('../models/Stock');
    const Pharmacist = require('../models/Pharmacist');
    const isDB = () => mongoose.connection.readyState === 1;

    const BASE_PRICES = {
      'Paracetamol 500mg':18,'Amoxicillin 250mg':85,'Metformin 500mg':45,'Cetirizine 10mg':30,
      'Azithromycin 500mg':175,'Omeprazole 20mg':55,'Atorvastatin 10mg':95,'Aspirin 75mg':22,
      'Pantoprazole 40mg':60,'Levothyroxine 50mcg':110,
    };

    const lowerQ = query.toLowerCase();
    let medicine = null;
    let allResults = [];

    // 1. Try DB stock (pharmacist-registered)
    if (isDB()) {
      try {
        const stocks = await Stock.find({
          units: { $gt: 0 },
          $or: [
            { medicineName: { $regex: query, $options: 'i' } },
            { genericName: { $regex: query, $options: 'i' } },
          ],
        }).lean();

        if (stocks.length) {
          const ids = [...new Set(stocks.map(s => s.pharmacistId.toString()))];
          const pharmacists = await Pharmacist.find({ _id:{$in:ids}, isListed:true, isSuspended:{$ne:true} }).lean();

          allResults = stocks.map(s => {
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
        }
      } catch(e) { console.error('Bridge stock lookup error:', e.message); }
    }

    // 2. Mock fallback if no DB results
    if (!allResults.length) {
      const matchedMock = mockMedicines.find(m =>
        m.name.toLowerCase().includes(lowerQ) ||
        (m.genericName && m.genericName.toLowerCase().includes(lowerQ))
      );

      if (matchedMock) {
        medicine = matchedMock;
        const basePrice = BASE_PRICES[matchedMock.name] || 50;
        const variations = [-0.35, -0.05, 0.10, 0.15, -0.15, 0.08, 0.20, 0.25, -0.20, 0.05, 0.12, -0.02];
        allResults = mockPharmacies.map((ph, i) => {
          const coords = ph.location.coordinates;
          const variation = variations[i] !== undefined ? variations[i] : (Math.random()*0.3 - 0.05);
          const price = Math.max(5, Math.round(basePrice * (1 + variation)));
          return {
            _id: `mock_${ph._id}`,
            pharmacy: ph,
            medicine: matchedMock,
            price,
            inStock: ph.isOpen && i !== 4,
            distance: calcDist(userLat, userLng, coords[1], coords[0]),
            lastUpdated: new Date(Date.now() - (i % 5)*86400000 - i*3600000).toISOString(),
            fromPharmacist: false,
          };
        });
      }
    }

    if (!allResults.length) {
      return res.status(404).json({
        error: `No results found for "${query}"`,
        suggestions: mockMedicines.slice(0,5).map(m => m.name),
      });
    }

    // 3. Mark cheapest, sort by distance
    const inStock = allResults.filter(r => r.inStock);
    const minPrice = inStock.length ? Math.min(...inStock.map(r => r.price)) : null;
    const withFlags = allResults.map(r => ({ ...r, isCheapest: minPrice !== null && r.price === minPrice && r.inStock }));
    withFlags.sort((a, b) => (a.distance||99) - (b.distance||99));

    // 4. Smart choices
    const inStockSorted = withFlags.filter(r => r.inStock);
    const cheapest = [...inStockSorted].sort((a,b) => a.price - b.price)[0] || null;
    const nearest  = [...inStockSorted].sort((a,b) => (a.distance||99) - (b.distance||99))[0] || null;

    // Balanced: normalise price + distance, find minimum combined score
    let balanced = null;
    if (inStockSorted.length) {
      const maxPrice = Math.max(...inStockSorted.map(r => r.price));
      const maxDist  = Math.max(...inStockSorted.map(r => r.distance||0));
      const scored = inStockSorted.map(r => ({
        ...r,
        score: (r.price / (maxPrice||1)) * 0.5 + ((r.distance||0) / (maxDist||1)) * 0.5
      }));
      balanced = scored.sort((a,b) => a.score - b.score)[0] || null;
    }

    // 5. Budget filter info
    const withinBudget = budget ? inStockSorted.filter(r => r.price <= parseFloat(budget)) : null;

    res.json({
      medicine: medicine || (withFlags[0]?.medicine),
      results: withFlags,
      smartChoices: {
        cheapest: cheapest ? { resultId: cheapest._id, price: cheapest.price, distance: cheapest.distance, pharmacyName: cheapest.pharmacy.name, reasons: ['Lowest listed price', cheapest.fromPharmacist ? 'Pharmacist-confirmed availability' : 'Sample pricing — verify with pharmacy'] } : null,
        nearest: nearest ? { resultId: nearest._id, price: nearest.price, distance: nearest.distance, pharmacyName: nearest.pharmacy.name, reasons: ['Shortest distance', nearest.fromPharmacist ? 'Live stock update' : 'Sample pricing — verify with pharmacy'] } : null,
        balanced: balanced ? { resultId: balanced._id, price: balanced.price, distance: balanced.distance, pharmacyName: balanced.pharmacy.name, reasons: ['Best price-to-distance ratio', balanced.fromPharmacist ? 'Pharmacist-confirmed availability' : 'Sample pricing — verify with pharmacy'] } : null,
      },
      budgetInfo: budget ? {
        budget: parseFloat(budget),
        withinBudget: withinBudget?.length || 0,
        cheapestAvailable: cheapest?.price || null,
        exceedsBudget: cheapest ? cheapest.price > parseFloat(budget) : true,
      } : null,
      dataNote: withFlags.some(r => !r.fromPharmacist) ? 'Some results are sample demonstration data and do not represent verified real-time pharmacy prices.' : null,
    });
  } catch(err) {
    console.error('Bridge search error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
