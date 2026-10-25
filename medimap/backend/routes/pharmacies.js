const express = require('express');
const router = express.Router();
const { mockPharmacies } = require('../data/seed');

// GET /api/pharmacies
router.get('/', async (req, res) => {
  try {
    res.json(mockPharmacies.map((p, i) => ({ ...p, _id: p._id || `pharmacy_${i}` })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/pharmacies/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const pharmacy = mockPharmacies.find((p, i) => p._id === id || `pharmacy_${i}` === id || String(i) === id);
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
    res.json(pharmacy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
