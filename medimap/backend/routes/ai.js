const express = require('express');
const router = express.Router();

// Fallback generic alternatives map (used when no Gemini key)
const genericAlternatives = {
  "paracetamol": { generic: "Acetaminophen", alternatives: ["Calpol 500mg (₹18)", "P-500 (₹12)", "Metacin (₹15)"], savings: "Up to 40% cheaper" },
  "amoxicillin": { generic: "Amoxicillin Trihydrate", alternatives: ["Novamox 250mg (₹65)", "Amoxil (₹72)", "Wymox 250 (₹60)"], savings: "Up to 35% cheaper" },
  "metformin": { generic: "Metformin Hydrochloride", alternatives: ["Glycomet 500 (₹35)", "Glucophage (₹40)", "Obimet (₹32)"], savings: "Up to 30% cheaper" },
  "atorvastatin": { generic: "Atorvastatin Calcium", alternatives: ["Atorva 10 (₹95)", "Lipitor Generic (₹88)", "Aztor (₹92)"], savings: "Up to 25% cheaper" },
  "pantoprazole": { generic: "Pantoprazole Sodium", alternatives: ["Pan 40 (₹42)", "Pantocid (₹45)", "Pantanet (₹38)"], savings: "Up to 30% cheaper" },
  "cetirizine": { generic: "Cetirizine Dihydrochloride", alternatives: ["Zyrtec Generic (₹22)", "Cetzine (₹20)", "Alerid (₹18)"], savings: "Up to 40% cheaper" },
  "aspirin": { generic: "Acetylsalicylic Acid", alternatives: ["Ecosprin 75 (₹18)", "Aspirin BP (₹15)", "Disprin (₹20)"], savings: "Up to 30% cheaper" },
  "azithromycin": { generic: "Azithromycin Dihydrate", alternatives: ["Azee 500 (₹145)", "Zithromax Generic (₹150)", "Aziwin (₹138)"], savings: "Up to 25% cheaper" }
};

// POST /api/ai/recommend
router.post('/recommend', async (req, res) => {
  try {
    const { medicineName } = req.body;
    if (!medicineName) {
      return res.status(400).json({ error: 'medicineName is required' });
    }

    // ✅ Try Gemini API if key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are a helpful medical assistant in India.
For the medicine "${medicineName}", suggest 3 cheaper generic alternatives available in India.

Reply ONLY with a valid JSON object in this exact format, no extra text, no markdown:
{
  "generic": "generic chemical name of the medicine",
  "alternatives": [
    "Brand Name 1 dosage (₹price)",
    "Brand Name 2 dosage (₹price)",
    "Brand Name 3 dosage (₹price)"
  ],
  "savings": "Up to X% cheaper",
  "note": "One sentence advice about generic medicines"
}
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Clean response — remove markdown code fences if present
        const cleaned = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);

        return res.json({ ...data, source: 'gemini' });

      } catch (geminiErr) {
        console.log('Gemini fallback:', geminiErr.message);
        // Fall through to local fallback below
      }
    }

    // 🔁 Local fallback (no API key needed)
    const key = medicineName.toLowerCase().split(' ')[0];
    const fallback = genericAlternatives[key];

    if (fallback) {
      return res.json({
        ...fallback,
        note: "Generic medicines contain the same active ingredients as brand-name drugs. Always consult your doctor before switching.",
        source: 'local'
      });
    }

    // Generic default response
    res.json({
      generic: `Generic ${medicineName}`,
      alternatives: [
        "Ask your pharmacist for generic alternatives",
        "Check Jan Aushadhi stores for low-cost generics",
        "Request generic substitution from your doctor"
      ],
      savings: "Potentially 20–60% cheaper",
      note: "Generic medicines are bioequivalent to brand-name drugs. Consult your doctor for recommendations.",
      source: 'local'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat — bonus: general medicine Q&A using Gemini
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI chat not available. Please add GEMINI_API_KEY to .env' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a helpful medical assistant for MediMap, a healthcare price transparency app in India.
Answer this question briefly and clearly in 2-3 sentences.
Only answer health/medicine related questions. If unrelated, politely redirect.

Question: ${question}
    `;

    const result = await model.generateContent(prompt);
    const answer = result.response.text().trim();

    res.json({ answer, source: 'gemini' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
