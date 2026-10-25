// backend/routes/prescriptionRoutes.js — v2 FIXED
// FIX 1: Medicine name cleanly extracted (no dosage/frequency attached)
// FIX 2: Bill OCR extracts batch, expiry, qty, manufacturer separately
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `rx_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ── Non-medicine header skip words ──────────────────────────
const SKIP_CONTAINS = [
  'pharmacy','medical store','medical hall','chemist','drug store','dispensary',
  'health care','healthcare','hospital','clinic','centre','center','medicare',
  'medicos','medico','dr.','dr ','doctor','physician','surgeon','specialist',
  'mbbs','md ','ms ','dgo','bams','bhms','bds','regd',
  'patient','patient name','p.name','address:','mob:','mobile:','phone:','tel:','contact:',
  'bill no','bill number','invoice no','gstin','gst no','pan no','license no','reg no',
  'dl no','drug license','date:','time:','counter','cashier',
  'subtotal','sub total','grand total','net amount','net total',
  'discount','cgst','sgst','igst','tax','mrp',
  'note:','notes:','instruction','follow up','next visit','advice','prescription',
  'signature','sign','stamp','seal',
];

const SKIP_EXACT = new Set([
  'rx','r.x','r/x','date','name','age','sex','weight','bp','temp',
  'diagnosis','advice','total','amount','paid','cash','upi','card',
  'balance','invoice','bill','receipt','thank','thanks',
]);

const IS_NUMERIC_LINE = /^[\s₹\d\.\,\-\+\*\/\(\)%]+$/;

// ── Frequency words to strip from medicine name ─────────────
// FIX 1: these appear on same line as medicine, causing bad search queries
const FREQUENCY_WORDS = /\b(once|twice|thrice|daily|od|bd|tid|qid|bid|tds|sos|hs|ac|pc|prn|at\s+night|morning|evening|night|after\s+meals?|before\s+meals?|with\s+food|empty\s+stomach|x\s*\d+\s*days?|\d+\s*times?\s*a?\s*day|\d+\s*days?|for\s+\d+|stat|immediately|as\s+directed|as\s+needed|when\s+required)\b/gi;

const MEDICINE_SUFFIXES = /\b\w+(?:cillin|mycin|cycline|floxacin|sartan|pril|olol|statin|oxetine|prazole|dipine|formin|gliptin|glitazone|zide|mide|pam|lam|zepam|done|pine|zine|dine|tine|mine|ine|dryl|fen|profen|gesic|spin|vir|mab|nib|tide|zole)\b/i;

const MEDICINE_STARTERS = /^(?:para|amox|azitr|metro|cetir|ator|aspir|omep|panto|levot|crocin|dolo|combi|augment|cipro|levo|norflox|rifamp|ibupr|nimesul|diclof|aceclo|tramad|folic|vitamin|b12|zinc|iron|calcium|magnesi|metfor|gluco|insulin|dexa|pred|hydro|beclom|salbu|mont|cefi|ampi|erythr|clar|doxycy|tetracy|chloro|sulpha|cotri|metro|tini|albend|meben|iverm|arte|chloro|quinine)\S*/i;

function looksLikeMedicine(line) {
  if (!/[a-zA-Z]{3,}/.test(line)) return false;
  if (/\d+\s*(?:mg|ml|mcg|gm|g\b|iu|units?)/i.test(line)) return true;
  if (/\d+\s*(?:tab|cap|strip|vial)/i.test(line)) return true;
  if (MEDICINE_SUFFIXES.test(line)) return true;
  if (MEDICINE_STARTERS.test(line.trim())) return true;
  return false;
}

// ── FIX 1: Extract clean medicine name only ─────────────────
// Returns { name, dosage, frequency, quantity, price }
function parseMedicineLine(line) {
  // Extract dosage first
  const doseMatch = line.match(/(\d+\.?\d*\s*(?:mg|ml|mcg|gm|g\b|iu|units?))/i);
  const dosage = doseMatch ? doseMatch[0].trim() : '';

  // Extract quantity
  const qtyMatch = line.match(/(\d+)\s*(?:tab(?:lets?)?|cap(?:sules?)?|strips?|nos?|pcs?)/i);
  const quantity = qtyMatch ? qtyMatch[1] : '1';

  // Extract price
  const priceMatch = line.match(/(?:₹|rs\.?)\s*(\d+(?:\.\d{1,2})?)/i);
  const price = priceMatch ? priceMatch[1] : '';

  // Extract frequency (for display only, NOT for search)
  const freqMatch = line.match(FREQUENCY_WORDS);
  const frequency = freqMatch ? freqMatch[0] : '';

  // Build clean medicine name:
  // 1. Start with just the alphabetic part before dosage
  let name = line;

  // Remove dosage and everything after
  if (doseMatch) {
    const doseIdx = line.indexOf(doseMatch[0]);
    // Keep text before dosage as name, but append dosage
    name = line.substring(0, doseIdx).trim();
    if (name.length < 3) {
      // dosage is at start, name comes after - take what's there
      name = line.replace(doseMatch[0], '').trim();
    }
  }

  // Remove frequency words from name
  name = name.replace(FREQUENCY_WORDS, ' ');

  // Remove leading list numbers (1. 2) etc)
  name = name.replace(/^\d+[\.\)\-\s]+/, '');

  // Remove trailing numbers, prices, punctuation
  name = name.replace(/\s+₹?\s*\d+(?:\.\d+)?$/, '');
  name = name.replace(/\s+\d+$/, '');
  name = name.replace(/[,;:\/\\|]+$/, '');
  name = name.replace(/\s{2,}/g, ' ').trim();

  // If name still looks bad, try extracting just the first word(s) that are alphabetic
  if (name.length < 3 || /^\d/.test(name)) {
    const words = line.split(/\s+/);
    const alphaWords = words.filter(w => /^[a-zA-Z]{3,}/.test(w) && !FREQUENCY_WORDS.test(w));
    name = alphaWords.slice(0, 3).join(' ');
  }

  // Final: medicine name for SEARCH should be just the drug name, max 3 words
  // Strip any remaining frequency words
  let searchName = name.replace(FREQUENCY_WORDS, '').trim();
  // Take max first 2 meaningful words for search
  const searchWords = searchName.split(/\s+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));
  searchName = searchWords.slice(0, 2).join(' ');

  // Display name = medicine name + dosage (e.g. "Paracetamol 500mg")
  const displayName = searchName + (dosage ? ` ${dosage}` : '');

  return {
    name: displayName.trim(),      // full display: "Paracetamol 500mg"
    searchName: searchName.trim(), // search query: "Paracetamol"
    dosage,
    frequency,
    quantity,
    price,
    rawLine: line,
  };
}

// ── Extract medicines from prescription text ─────────────────
function extractMedicinesFromText(rawText) {
  const allLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);

  // Find where medicine list starts (first line with dosage pattern)
  let startIdx = 0;
  for (let i = 0; i < Math.min(allLines.length, 12); i++) {
    if (/\d+\s*(?:mg|ml|mcg|tab|cap)/i.test(allLines[i])) { startIdx = i; break; }
    if (i === Math.min(allLines.length, 12) - 1) startIdx = Math.min(3, allLines.length);
  }

  const medicines = [];
  const seen = new Set();

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    const lower = line.toLowerCase().trim();

    if (lower.length < 3) continue;
    if (IS_NUMERIC_LINE.test(line)) continue;
    if (SKIP_EXACT.has(lower.replace(/[:\.\-\s]/g, ''))) continue;
    if (i < startIdx) continue;
    if (SKIP_CONTAINS.some(kw => lower.includes(kw))) continue;
    if (/^[A-Z0-9\-\/\s]{2,10}$/.test(line) && !/[a-z]/.test(line)) continue;
    if (/\d+.{0,5},/.test(line) && !looksLikeMedicine(line)) continue;
    if (!looksLikeMedicine(line)) continue;

    const parsed = parseMedicineLine(line);
    if (!parsed.searchName || parsed.searchName.length < 3) continue;

    const key = parsed.searchName.toLowerCase().slice(0, 12);
    if (seen.has(key)) continue;
    seen.add(key);

    medicines.push(parsed);
  }

  return medicines.slice(0, 15);
}

// ── FIX 2: Extract fields from purchase bill/invoice ────────
// Parses: medicine name, batch no, expiry, qty, MRP/price, manufacturer
function extractBillFields(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const medicines = [];

  // Patterns for bill fields
  const BATCH_PATTERN = /(?:batch\s*(?:no)?\.?\s*:?\s*|b\.?\s*no\.?\s*:?\s*|b\/n\s*:?\s*)([A-Z0-9\/\-]+)/i;
  const EXPIRY_PATTERN = /(?:exp(?:iry|\.?)?\s*(?:date)?\s*:?\s*|mfg\s+exp\s*:?\s*)(\d{1,2}[\/\-\.]\d{2,4}|\d{2,4}[\/\-\.]\d{1,2}|[A-Za-z]{3,4}[\-\/\s]?\d{2,4})/i;
  const QTY_PATTERN = /(?:qty|quantity|pcs|nos|units|strips?)\s*:?\s*(\d+)/i;
  const PRICE_PATTERN = /(?:mrp|rate|price|selling price)\s*:?\s*₹?\s*(\d+(?:\.\d{1,2})?)/i;
  const MFG_PATTERN = /(?:mfg|mfd|manufactured by|manufacturer|mfr)\s*:?\s*([A-Za-z][A-Za-z\s&.]+?)(?:\s{2,}|\n|$)/i;

  // Try table-format bill: each line has pipe/tab separated values
  // Common format: | MedicineName | Batch | Expiry | Qty | MRP |
  const TABLE_ROW = /([A-Za-z][A-Za-z0-9\s\+]+?)\s{2,}([A-Z0-9\/\-]+)\s{2,}(\d{1,2}[\/\-]\d{2,4})\s{2,}(\d+)\s{2,}₹?\s*(\d+(?:\.\d{1,2})?)/;
  const TABLE_ROW2 = /([A-Za-z][A-Za-z0-9\s\+]+?)\|([A-Z0-9\/\-]+)\|(\d{1,2}[\/\-]\d{2,4})\|(\d+)\|₹?\s*(\d+(?:\.\d{1,2})?)/;

  for (const line of lines) {
    // Try full table row match first
    const tableMatch = TABLE_ROW.exec(line) || TABLE_ROW2.exec(line);
    if (tableMatch) {
      const name = tableMatch[1].trim();
      if (looksLikeMedicine(name) || name.length > 3) {
        const parsed = parseMedicineLine(name);
        medicines.push({
          ...parsed,
          name: parsed.name || name,
          searchName: parsed.searchName || name,
          batchNo: tableMatch[2] || '',
          expiryDate: normalizeExpiry(tableMatch[3] || ''),
          quantity: tableMatch[4] || '1',
          price: tableMatch[5] || '',
        });
        continue;
      }
    }

    // Otherwise use looksLikeMedicine
    if (!looksLikeMedicine(line)) continue;
    if (SKIP_CONTAINS.some(kw => line.toLowerCase().includes(kw))) continue;

    const parsed = parseMedicineLine(line);
    if (!parsed.searchName || parsed.searchName.length < 3) continue;

    // Check nearby lines for batch/expiry
    const lineIdx = lines.indexOf(line);
    const context = lines.slice(Math.max(0, lineIdx-1), lineIdx+3).join(' ');

    const batchM = BATCH_PATTERN.exec(context);
    const expiryM = EXPIRY_PATTERN.exec(context);
    const qtyM = QTY_PATTERN.exec(context);
    const priceM = PRICE_PATTERN.exec(context);
    const mfgM = MFG_PATTERN.exec(context);

    medicines.push({
      ...parsed,
      batchNo: batchM ? batchM[1].trim() : '',
      expiryDate: expiryM ? normalizeExpiry(expiryM[1]) : '',
      quantity: qtyM ? qtyM[1] : parsed.quantity || '1',
      price: priceM ? priceM[1] : parsed.price || '',
      manufacturer: mfgM ? mfgM[1].trim() : '',
    });
  }

  return medicines;
}

// ── Normalize expiry to YYYY-MM ──────────────────────────────
function normalizeExpiry(raw) {
  if (!raw) return '';
  raw = raw.trim();

  // "03/2027" or "3/27" → YYYY-MM
  const mmyy = raw.match(/^(\d{1,2})[\/\-\.](\d{2,4})$/);
  if (mmyy) {
    const month = mmyy[1].padStart(2, '0');
    const year = mmyy[2].length === 2 ? '20' + mmyy[2] : mmyy[2];
    return `${year}-${month}`;
  }

  // "2027/03" → YYYY-MM
  const yyymm = raw.match(/^(\d{4})[\/\-\.](\d{1,2})$/);
  if (yyymm) return `${yyymm[1]}-${yyymm[2].padStart(2,'0')}`;

  // "Mar-27" or "Mar/2027"
  const monthMap = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' };
  const textMonth = raw.match(/([A-Za-z]{3,4})[\-\/\s]?(\d{2,4})/i);
  if (textMonth) {
    const m = monthMap[textMonth[1].toLowerCase().slice(0,3)];
    const y = textMonth[2].length === 2 ? '20' + textMonth[2] : textMonth[2];
    if (m) return `${y}-${m}`;
  }

  return raw; // return as-is if can't parse
}

// ── Extract pharmacy/supplier name ──────────────────────────
function extractPharmacyName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  const keywords = ['pharmacy','medical','chemist','drug','store','pharma','dispensary','health','distributor','wholesale'];
  for (const line of lines.slice(0, 8)) {
    if (keywords.some(kw => line.toLowerCase().includes(kw))) return line;
  }
  return lines[0] || '';
}

// ══════════════════════════════════════════════════════════════
// POST /api/prescription/scan — prescription (for customers)
// ══════════════════════════════════════════════════════════════
router.post('/scan', upload.single('prescription'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    filePath = req.file.path;
    let rawText = '';

    try {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
      rawText = result.data.text || '';
    } catch (e) { console.error('Tesseract error:', e.message); }

    const medicines = extractMedicinesFromText(rawText);
    const pharmacyName = extractPharmacyName(rawText);

    res.json({
      success: true,
      rawText: rawText.slice(0, 2000),
      medicines: medicines.length > 0 ? medicines : [],
      pharmacyName,
      medicineCount: medicines.length,
      parseMethod: 'tesseract',
      message: medicines.length === 0 ? 'No medicines detected. Fill manually.' : `Found ${medicines.length} medicine(s)`,
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'OCR failed: ' + err.message, medicines: [] });
  } finally {
    if (filePath) try { fs.unlinkSync(filePath); } catch {}
  }
});

// ══════════════════════════════════════════════════════════════
// POST /api/prescription/scan-bill — purchase bill (for pharmacist stock OCR)
// Returns: medicines with batch, expiry, qty, price, manufacturer
// ══════════════════════════════════════════════════════════════
router.post('/scan-bill', upload.single('prescription'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    filePath = req.file.path;
    let rawText = '';

    try {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
      rawText = result.data.text || '';
    } catch (e) { console.error('Tesseract error:', e.message); }

    const medicines = extractBillFields(rawText);
    const supplierName = extractPharmacyName(rawText);

    res.json({
      success: true,
      rawText: rawText.slice(0, 2000),
      medicines: medicines.length > 0 ? medicines : [],
      supplierName, // detected supplier/distributor name from bill
      medicineCount: medicines.length,
      message: medicines.length === 0 ? 'No medicines found in bill. Add manually.' : `Found ${medicines.length} item(s)`,
    });
  } catch (err) {
    console.error('Bill scan error:', err);
    res.status(500).json({ error: 'Scan failed: ' + err.message, medicines: [] });
  } finally {
    if (filePath) try { fs.unlinkSync(filePath); } catch {}
  }
});

module.exports = router;