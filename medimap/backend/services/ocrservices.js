
// services/ocrService.js
// Handles OCR extraction + AI parsing of prescription images

const Tesseract = require('tesseract.js');
const fs = require('fs');

// ─── Medicine keyword database for fallback regex parsing ───────────────────
const MEDICINE_KEYWORDS = [
  'paracetamol', 'acetaminophen', 'amoxicillin', 'azithromycin', 'metformin',
  'atorvastatin', 'pantoprazole', 'cetirizine', 'aspirin', 'ibuprofen',
  'omeprazole', 'metronidazole', 'ciprofloxacin', 'doxycycline', 'losartan',
  'amlodipine', 'lisinopril', 'atenolol', 'clopidogrel', 'rosuvastatin',
  'montelukast', 'levothyroxine', 'gabapentin', 'sertraline', 'alprazolam',
  'diazepam', 'prednisolone', 'dexamethasone', 'salbutamol', 'ranitidine',
  'domperidone', 'ondansetron', 'loperamide', 'folic acid', 'vitamin',
  'calcium', 'iron', 'zinc', 'cefixime', 'cefpodoxime', 'amikacin'
];

const DOSAGE_PATTERN = /(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|iu|units?|%)/gi;
const QUANTITY_PATTERN = /(\d+)\s*(tablet|capsule|tab|cap|strip|bottle|sachet|injection|drops?|syrup)s?/gi;

// ─── Step 1: Extract raw text via Tesseract OCR ──────────────────────────────
async function extractTextFromImage(imagePath) {
  try {
    console.log('🔍 Running Tesseract OCR on:', imagePath);
    const { data: { text, confidence } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r   OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    console.log(`\n✅ OCR complete. Confidence: ${confidence.toFixed(1)}%`);
    return { text: text.trim(), confidence };
  } catch (err) {
    throw new Error(`OCR failed: ${err.message}`);
  }
}

// ─── Step 2: Parse extracted text using Gemini AI ────────────────────────────
async function parseWithGemini(rawText) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are a medical prescription parser. Extract all medicines from this prescription text.

Prescription text:
"""
${rawText}
"""

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
Each item must have: name, dosage, quantity, frequency (if found).

Example format:
[
  { "name": "Paracetamol", "dosage": "500mg", "quantity": "10 tablets", "frequency": "Twice daily" },
  { "name": "Amoxicillin", "dosage": "250mg", "quantity": "6 capsules", "frequency": "Three times daily" }
]

If a field is not found, use "Not specified".
Return empty array [] if no medicines found.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ─── Step 3: Regex fallback parser (no AI needed) ────────────────────────────
function parseWithRegex(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const medicines = [];

  lines.forEach(line => {
    const lineLower = line.toLowerCase();

    // Check if line contains a known medicine
    const foundMed = MEDICINE_KEYWORDS.find(med => lineLower.includes(med));
    if (!foundMed) return;

    // Extract dosage
    const dosageMatch = [...line.matchAll(DOSAGE_PATTERN)];
    const dosage = dosageMatch.length > 0
      ? `${dosageMatch[0][1]}${dosageMatch[0][2]}`
      : 'Not specified';

    // Extract quantity
    const quantityMatch = [...line.matchAll(QUANTITY_PATTERN)];
    const quantity = quantityMatch.length > 0
      ? `${quantityMatch[0][1]} ${quantityMatch[0][2]}s`
      : 'Not specified';

    // Extract frequency
    const freqPatterns = [
      { pattern: /once\s+daily|od|qd/i, label: 'Once daily' },
      { pattern: /twice\s+daily|bd|bid/i, label: 'Twice daily' },
      { pattern: /three\s+times|tds|tid/i, label: 'Three times daily' },
      { pattern: /four\s+times|qid/i, label: 'Four times daily' },
      { pattern: /at\s+night|hs|nocte/i, label: 'At night' },
      { pattern: /morning/i, label: 'Morning' },
    ];
    const freqMatch = freqPatterns.find(f => f.pattern.test(line));
    const frequency = freqMatch ? freqMatch.label : 'Not specified';

    // Capitalize medicine name
    const name = foundMed.charAt(0).toUpperCase() + foundMed.slice(1);

    // Avoid duplicates
    if (!medicines.find(m => m.name.toLowerCase() === name.toLowerCase())) {
      medicines.push({ name, dosage, quantity, frequency });
    }
  });

  return medicines;
}

// ─── Main export: full pipeline ───────────────────────────────────────────────
async function processPrescription(imagePath) {
  // Step 1: OCR
  const { text: rawText, confidence } = await extractTextFromImage(imagePath);

  if (!rawText || rawText.length < 10) {
    throw new Error('Could not read prescription. Please upload a clearer image.');
  }

  let medicines = [];
  let parseMethod = 'regex';

  // Step 2: Try Gemini first, fall back to regex
  if (process.env.GEMINI_API_KEY) {
    try {
      medicines = await parseWithGemini(rawText);
      parseMethod = 'gemini';
      console.log(`✅ Gemini parsed ${medicines.length} medicines`);
    } catch (err) {
      console.log('⚠️  Gemini parse failed, using regex fallback:', err.message);
      medicines = parseWithRegex(rawText);
    }
  } else {
    medicines = parseWithRegex(rawText);
    console.log(`✅ Regex parsed ${medicines.length} medicines`);
  }

  // Clean up temp file
  try { fs.unlinkSync(imagePath); } catch {}

  return {
    rawText,
    confidence: parseFloat(confidence?.toFixed(1) || 0),
    medicines,
    parseMethod,
    medicineCount: medicines.length
  };
}

module.exports = { processPrescription, extractTextFromImage, parseWithRegex };
