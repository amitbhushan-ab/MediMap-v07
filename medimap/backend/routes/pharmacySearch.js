// backend/routes/pharmacySearch.js
// Pharmacy autocomplete search + tagging endpoint
// Frontend uses this to let users SELECT pharmacy (never name-match)
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

function getPharmacistModel() {
  return require('../models/Pharmacist');
}

// ══════════════════════════════════════════════════════════════
// GET /api/pharmacy-search?q=apollo&lat=28.4&lng=77.3&limit=10
// Autocomplete for "Select Pharmacy" dropdown in SubmitPricePage
// ══════════════════════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { q = '', lat, lng, limit = 10 } = req.query;
    const Pharmacist = getPharmacistModel();
    const maxLimit = Math.min(parseInt(limit) || 10, 50);

    let query = {
      isListed: true,
      isSuspended: false,
    };

    // Text search if query provided
    if (q.trim().length >= 1) {
      // Use regex for partial matching (faster than $text for autocomplete)
      query.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { address: { $regex: q.trim(), $options: 'i' } },
        { city: { $regex: q.trim(), $options: 'i' } },
        { chain: { $regex: q.trim(), $options: 'i' } },
      ];
    }

    let pharmacies;

    // If coordinates provided, sort by distance
    if (lat && lng) {
      pharmacies = await Pharmacist.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: 'distanceMeters',
            maxDistance: 50000, // 50km radius
            query,
            spherical: true,
          },
        },
        { $limit: maxLimit },
        {
          $project: {
            _id: 1, name: 1, address: 1, city: 1, phone: 1,
            rating: 1, isVerified: 1, isFeatured: 1, chain: 1,
            location: 1,
            distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
          },
        },
      ]);
    } else {
      pharmacies = await Pharmacist.find(query)
        .select('_id name address city phone rating isVerified isFeatured chain location')
        .limit(maxLimit)
        .lean();
    }

    res.json({
      pharmacies: pharmacies.map(p => ({
        id: p._id,
        name: p.name,
        address: p.address || '',
        city: p.city || '',
        phone: p.phone || '',
        rating: p.rating || 4.0,
        isVerified: p.isVerified || false,
        isFeatured: p.isFeatured || false,
        chain: p.chain || '',
        distanceKm: p.distanceKm || null,
        // Display label for dropdown
        label: `${p.name}${p.address ? ' — ' + p.address : ''}`,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pharmacy-search/:id — get single pharmacy details
router.get('/:id', async (req, res) => {
  try {
    const Pharmacist = getPharmacistModel();
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid pharmacy ID' });
    }
    const pharmacy = await Pharmacist.findById(req.params.id)
      .select('-password -adminNote')
      .lean();
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
    res.json(pharmacy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
