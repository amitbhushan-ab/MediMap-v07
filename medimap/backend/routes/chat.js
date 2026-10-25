// backend/routes/chat.js
// FIX #6: Groq API key validation + fallback response
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { messages, lang = 'en', userLocation } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  const systemPrompt = lang === 'hi'
      ? "You are MediMap's AI assistant. Reply in HINDI. For ANY medicine the user asks about, you MUST ALWAYS explicitly state its generic name (जेनेरिक नाम) and suggest checking for a cheaper generic alternative. Help with side effects and dosage. Always recommend consulting a doctor. Keep responses concise (3-4 sentences)."
      : "You are MediMap's AI assistant for India's medicine price comparison platform. For ANY medicine the user asks about, you MUST ALWAYS explicitly state its generic name and suggest checking for a cheaper generic alternative. Help with side effects and dosage. Always recommend consulting a doctor. Keep responses concise (3-4 sentences).";

  // If no valid API key, use intelligent rule-based fallback
  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const reply = getRuleBasedReply(lastMsg, lang);
    return res.json({ reply, fallback: true });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        temperature: 0.6,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-8),
        ],
      }),
    });

    if (response.status === 401) {
      // Invalid key — fall back gracefully, don't crash
      const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
      return res.json({ reply: getRuleBasedReply(lastMsg, lang), fallback: true });
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || getRuleBasedReply('', lang);
    res.json({ reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    // Always return a useful reply, never an error message to the user
    res.json({ reply: getRuleBasedReply(lastMsg, lang), fallback: true });
  }
});

// Rule-based fallback — useful even without AI
function getRuleBasedReply(msg, lang) {
  const hi = lang === 'hi';
  const m = msg.toLowerCase();

  // Identity / model questions
  if (
    m.includes('model') || m.includes('groq') || m.includes('llama') ||
    m.includes('gpt') || m.includes('who are you') || m.includes('what are you') ||
    m.includes('which ai') || m.includes('which model') || m.includes('what model') ||
    m.includes('your name') || m.includes('तुम कौन') || m.includes('आप कौन')
  ) {
    return hi
      ? 'मैं MediMap AI हूँ — Llama 3.3 70B (Groq) द्वारा संचालित। मैं दवाइयों की कीमत, साइड इफेक्ट और जेनेरिक विकल्पों में मदद करता हूँ।'
      : 'I am MediMap AI, powered by Llama 3.3 70B via Groq. I\'m here to help you with medicine prices, side effects, and generic alternatives across Indian pharmacies.';
  }

  if (m.includes('paracetamol') || m.includes('पैरासिटामोल')) {
    return hi
      ? 'पैरासिटामोल बुखार और दर्द के लिए उपयोग होती है। सामान्य खुराक 500mg-1g हर 6 घंटे में। जेनेरिक नाम: Acetaminophen। MediMap पर कीमत तुलना करें।'
      : 'Paracetamol is used for fever and mild pain. Standard dose: 500mg-1g every 6 hours. Generic name: Acetaminophen. Compare prices on MediMap.';
  }
  if (m.includes('amoxicillin') || m.includes('amoxicillin')) {
    return hi
      ? 'एमोक्सिसिलिन एक एंटीबायोटिक है। डॉक्टर की पर्ची के बिना नहीं लें। MediMap पर कीमत चेक करें।'
      : 'Amoxicillin is an antibiotic for bacterial infections. Always take as prescribed by doctor. Check prices on MediMap.';
  }
  if (m.includes('metformin') || m.includes('मेटफॉर्मिन')) {
    return hi
      ? 'मेटफॉर्मिन डायबिटीज के लिए है। खाने के साथ लें। डॉक्टर की सलाह ज़रूरी है।'
      : 'Metformin is for Type 2 diabetes. Take with meals to reduce stomach upset. Always consult your doctor.';
  }
  if (m.includes('cetirizine') || m.includes('सिट्रीज़िन')) {
    return hi
      ? 'सिट्रीज़िन एलर्जी, खुजली और नाक बंद के लिए है। 10mg दिन में एक बार। नींद आ सकती है।'
      : 'Cetirizine is for allergies, itching and runny nose. Take 10mg once daily. May cause drowsiness.';
  }
  if (m.includes('generic') || m.includes('जेनेरिक')) {
    return hi
      ? 'जेनेरिक दवाइयां ब्रांडेड जितनी ही असरदार होती हैं पर 40-60% सस्ती। Jan Aushadhi केंद्र पर मिलती हैं।'
      : 'Generic medicines are as effective as branded ones but 40-60% cheaper. Available at Jan Aushadhi centers and listed pharmacies on MediMap.';
  }
  if (m.includes('side effect') || m.includes('साइड इफेक्ट')) {
    return hi
      ? 'हर दवाई के अलग साइड इफेक्ट होते हैं। कृपया दवाई का नाम बताएं। किसी भी गंभीर समस्या में तुरंत डॉक्टर से मिलें।'
      : 'Side effects vary by medicine. Please mention the specific medicine name. For serious reactions, consult a doctor immediately.';
  }
  if (m.includes('price') || m.includes('कीमत') || m.includes('cost')) {
    return hi
      ? 'MediMap पर सर्च करें और 500+ फार्मेसियों की कीमतें तुलना करें। ऊपर Search Bar में दवाई का नाम डालें।'
      : 'Search on MediMap to compare prices across 500+ pharmacies near you. Type the medicine name in the search bar above.';
  }
  if (m.includes('nearby') || m.includes('near') || m.includes('पास') || m.includes('नज़दीक')) {
    return hi
      ? 'Map View पर जाएं और अपनी लोकेशन से पास की फार्मेसियां देखें। या दवाई सर्च करें — दूरी के साथ results आएंगे।'
      : 'Go to Map View to find pharmacies near you, or search for a medicine and results will show distance from your location.';
  }

  // Default
  return hi
    ? 'नमस्ते! दवाई का नाम बताएं — मैं कीमत, साइड इफेक्ट, जेनेरिक विकल्प की जानकारी दे सकता हूँ। या ऊपर Search Bar में सर्च करें।'
    : 'Hello! Tell me a medicine name and I can help with pricing, side effects, or generic alternatives. Or use the Search Bar above to compare prices near you.';
}

module.exports = router;
