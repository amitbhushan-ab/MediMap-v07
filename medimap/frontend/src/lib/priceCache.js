// src/lib/priceCache.js — last known live prices, kept per search
//
// The pilot API is hosted remotely and is regularly unreachable. When a live
// search succeeds we keep a compact copy so the results page can show real
// (if older) prices instead of the sample catalogue. Distances are recomputed
// for the current location because they depend on where the user is.
import { calcDistanceKm } from './pharmacyAdapter';

const STORAGE_KEY = 'medimap_price_cache_v1';
const MAX_ENTRIES = 12;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const normalize = (query) => String(query || '').trim().toLowerCase().replace(/\s+/g, ' ');

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function packMedicine(medicine) {
  if (!medicine) return null;
  return {
    name: medicine.name,
    genericName: medicine.genericName,
    category: medicine.category,
    requiresPrescription: Boolean(medicine.requiresPrescription),
  };
}

function packPharmacy(pharmacy) {
  if (!pharmacy) return null;
  return {
    _id: pharmacy._id,
    name: pharmacy.name,
    address: pharmacy.address,
    rating: pharmacy.rating,
    reviewCount: pharmacy.reviewCount,
    isPremium: Boolean(pharmacy.isPremium),
    hours: pharmacy.hours,
    location: pharmacy.location
      ? { lat: pharmacy.location.lat, lng: pharmacy.location.lng }
      : undefined,
  };
}

/**
 * Stores a successful live search so it can be shown while the API is down.
 * Silently does nothing when storage is full or unavailable.
 */
export function writeCachedSearch(query, { medicine, results }) {
  if (!query || !Array.isArray(results) || results.length === 0) return;

  try {
    const store = readStore();
    store[normalize(query)] = {
      savedAt: new Date().toISOString(),
      medicine: packMedicine(medicine),
      results: results.map((result) => ({
        _id: result._id,
        price: result.price,
        inStock: Boolean(result.inStock),
        isCheapest: Boolean(result.isCheapest),
        lastUpdated: result.lastUpdated,
        fromPharmacist: Boolean(result.fromPharmacist),
        medicine: packMedicine(result.medicine),
        pharmacy: packPharmacy(result.pharmacy),
      })),
    };

    const recent = Object.keys(store)
      .sort((a, b) => new Date(store[b].savedAt) - new Date(store[a].savedAt))
      .slice(0, MAX_ENTRIES);

    const trimmed = {};
    for (const key of recent) trimmed[key] = store[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* Storage can be disabled or full; the page still works without it. */
  }
}

/**
 * Returns the cached search for this query, with distances recalculated, or
 * null when nothing usable is stored or the entry has gone stale.
 */
export function readCachedSearch(query, lat, lng) {
  const entry = readStore()[normalize(query)];
  if (!entry || !Array.isArray(entry.results) || entry.results.length === 0) return null;

  const savedAt = new Date(entry.savedAt).getTime();
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > MAX_AGE_MS) return null;

  const results = entry.results.map((result) => {
    const location = result.pharmacy?.location;
    return {
      ...result,
      // Lets each row say it is a saved price rather than a live one.
      fromCache: true,
      cachedAt: entry.savedAt,
      distance:
        location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
          ? calcDistanceKm(lat, lng, location.lat, location.lng)
          : undefined,
    };
  });

  return { medicine: entry.medicine, savedAt: entry.savedAt, results };
}
