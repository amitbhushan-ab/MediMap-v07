// src/lib/fixtureResults.js — local sample prices for the Dwarka pilot
//
// Used only when the live price API is unreachable. The results are shaped like
// an API reply so the page renders exactly as it normally would, and the UI
// labels them as samples. Nothing here is presented as a live counter price.
import { NSUT_COORDS, NSUT_PHARMACIES, calcDistanceKm } from './pharmacyAdapter';

const HOUR = 60 * 60 * 1000;

// Each entry maps a search to one medicine and a price per pharmacy index in
// NSUT_PHARMACIES. `stock: false` mirrors counters that are out of stock.
const CATALOGUE = [
  {
    keys: ['dolo', 'dolo 650', 'paracetamol 650', 'calpol 650', '650'],
    medicine: {
      name: 'Paracetamol 650 mg',
      genericName: 'Acetaminophen',
      category: 'Analgesic · 15 tablets',
      requiresPrescription: false,
    },
    offers: [
      { price: 22, hoursAgo: 1 },
      { price: 26, hoursAgo: 21 },
      { price: 20, stock: false, hoursAgo: 46 },
      { price: 30, hoursAgo: 69 },
      { price: 32, hoursAgo: 3 },
    ],
  },
  {
    keys: ['paracetamol', 'acetaminophen', 'crocin', 'calpol'],
    medicine: {
      name: 'Paracetamol 500 mg',
      genericName: 'Acetaminophen',
      category: 'Analgesic · 15 tablets',
      requiresPrescription: false,
    },
    offers: [
      { price: 18, hoursAgo: 0.4 },
      { price: 21, hoursAgo: 26 },
      { price: 17, stock: false, hoursAgo: 50 },
      { price: 23, hoursAgo: 74 },
      { price: 25, hoursAgo: 5 },
    ],
  },
  {
    keys: ['cetirizine', 'cetzine', 'alerid'],
    medicine: {
      name: 'Cetirizine 10 mg',
      genericName: 'Cetirizine hydrochloride',
      category: 'Antihistamine · 10 tablets',
      requiresPrescription: false,
    },
    offers: [
      { price: 9.5, hoursAgo: 9 },
      { price: 14, hoursAgo: 3 },
      { price: 12, hoursAgo: 31 },
      { price: 16, stock: false, hoursAgo: 55 },
    ],
  },
  {
    keys: ['amoxicillin', 'amoxycillin', 'mox', 'novamox'],
    medicine: {
      name: 'Amoxicillin 500 mg',
      genericName: 'Amoxicillin trihydrate',
      category: 'Antibiotic · 10 capsules',
      requiresPrescription: true,
    },
    offers: [
      { price: 68, hoursAgo: 12 },
      { price: 92, hoursAgo: 38 },
      { price: 84, stock: false, hoursAgo: 61 },
      { price: 112, hoursAgo: 20 },
    ],
  },
  {
    keys: ['metformin', 'glycomet', 'glucophage'],
    medicine: {
      name: 'Metformin 500 mg',
      genericName: 'Metformin hydrochloride',
      category: 'Anti-diabetic · 20 tablets',
      requiresPrescription: true,
    },
    offers: [
      { price: 24, hoursAgo: 18 },
      { price: 31, hoursAgo: 44 },
      { price: 27, hoursAgo: 7 },
      { price: 46, hoursAgo: 66 },
    ],
  },
  {
    keys: ['pantoprazole', 'pan', 'pantop', 'protonix'],
    medicine: {
      name: 'Pantoprazole 40 mg',
      genericName: 'Pantoprazole sodium',
      category: 'Antacid · 15 tablets',
      requiresPrescription: true,
    },
    offers: [
      { price: 58, hoursAgo: 2 },
      { price: 74, hoursAgo: 29 },
      { price: 66, stock: false, hoursAgo: 48 },
      { price: 96, hoursAgo: 15 },
    ],
  },
  {
    keys: ['salbutamol', 'asthalin', 'inhaler', 'ventolin'],
    medicine: {
      name: 'Salbutamol inhaler 100 mcg',
      genericName: 'Salbutamol sulphate',
      category: 'Bronchodilator · 200 doses',
      requiresPrescription: true,
    },
    offers: [
      { price: 142, hoursAgo: 33 },
      { price: 168, stock: false, hoursAgo: 57 },
      { price: 155, hoursAgo: 4 },
    ],
  },
  {
    keys: ['ors', 'electral', 'rehydration'],
    medicine: {
      name: 'ORS sachet 21.8 g',
      genericName: 'Oral rehydration salts',
      category: 'Rehydration · 1 sachet',
      requiresPrescription: false,
    },
    offers: [
      { price: 18, hoursAgo: 6 },
      { price: 22, hoursAgo: 23 },
      { price: 20, hoursAgo: 41 },
    ],
  },
  {
    keys: ['ibuprofen', 'brufen', 'combiflam'],
    medicine: {
      name: 'Ibuprofen 400 mg',
      genericName: 'Ibuprofen',
      category: 'NSAID · 10 tablets',
      requiresPrescription: false,
    },
    offers: [
      { price: 12, hoursAgo: 8 },
      { price: 17, hoursAgo: 27 },
      { price: 15, hoursAgo: 52 },
      { price: 19, stock: false, hoursAgo: 71 },
    ],
  },
  {
    keys: ['azithromycin', 'azee', 'azithral'],
    medicine: {
      name: 'Azithromycin 500 mg',
      genericName: 'Azithromycin dihydrate',
      category: 'Antibiotic · 3 tablets',
      requiresPrescription: true,
    },
    offers: [
      { price: 78, hoursAgo: 14 },
      { price: 96, hoursAgo: 36 },
      { price: 88, hoursAgo: 9 },
    ],
  },
  {
    keys: ['vitamin d', 'd3', 'cholecalciferol', 'uprise'],
    medicine: {
      name: 'Vitamin D3 60,000 IU',
      genericName: 'Cholecalciferol',
      category: 'Supplement · 4 sachets',
      requiresPrescription: false,
    },
    offers: [
      { price: 28, hoursAgo: 11 },
      { price: 35, hoursAgo: 34 },
      { price: 32, hoursAgo: 58 },
    ],
  },
];

const UNKNOWN_OFFERS = [
  { price: 24, hoursAgo: 6 },
  { price: 29, hoursAgo: 19 },
  { price: 32, hoursAgo: 30 },
];

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findEntry(query) {
  const search = normalize(query);
  if (!search) return null;

  const tokens = search.split(' ').filter((token) => token.length >= 3);

  return (
    CATALOGUE.find((entry) =>
      entry.keys.some((key) => {
        // Multi-word keys ("vitamin d") match as a phrase.
        if (key.includes(' ')) return search.includes(key);
        if (key.length < 4) return tokens.includes(key);
        return tokens.some((token) => token === key || token.startsWith(key));
      }),
    ) || null
  );
}

/**
 * Builds an API-shaped search reply from the local catalogue.
 * @param {string} query search text
 * @param {number} lat user latitude
 * @param {number} lng user longitude
 */
export function buildFixtureSearch(query, lat = NSUT_COORDS.lat, lng = NSUT_COORDS.lng) {
  const entry = findEntry(query);
  const medicine = entry
    ? { ...entry.medicine }
    : {
        name: query,
        genericName: '',
        category: 'Sample price · confirm at the counter',
        requiresPrescription: false,
      };
  const offers = entry ? entry.offers : UNKNOWN_OFFERS;

  const results = offers
    .map((offer, position) => {
      const pharmacy = NSUT_PHARMACIES[position];
      if (!pharmacy) return null;
      return {
        _id: `sample_${pharmacy._id}_${normalize(medicine.name).replace(/\s+/g, '-')}`,
        pharmacy: {
          ...pharmacy,
          location: { ...pharmacy.location },
        },
        medicine: { ...medicine },
        price: offer.price,
        inStock: offer.stock !== false,
        distance: calcDistanceKm(lat, lng, pharmacy.location.lat, pharmacy.location.lng),
        lastUpdated: new Date(Date.now() - offer.hoursAgo * HOUR).toISOString(),
        fromPharmacist: false,
        isSample: true,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);

  const cheapest = results.find((result) => result.inStock);
  for (const result of results) {
    result.isCheapest = cheapest ? result._id === cheapest._id : false;
  }

  return { medicine, results, matched: Boolean(entry) };
}
