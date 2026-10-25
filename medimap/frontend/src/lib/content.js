// src/lib/content.js — shared product content.
// Marketing numbers and claims live here so no two pages can disagree.

export const SITE = {
  name: 'MediMap',
  city: 'Dwarka, Delhi',
  description: {
    en: 'Compare medicine prices and stock at verified pharmacies around Dwarka, Delhi.',
    hi: 'द्वारका, दिल्ली के सत्यापित फार्मेसियों में दवाओं की कीमत और स्टॉक की तुलना करें।',
  },
  pilot: {
    en: 'Pilot coverage: Dwarka and Delhi NCR',
    hi: 'पायलट कवरेज: द्वारका और दिल्ली एनसीआर',
  },
};

export const NAV_LINKS = [
  { to: '/', label: { en: 'Home', hi: 'होम' } },
  { to: '/bridge', label: { en: 'Bridge', hi: 'ब्रिज' } },
  { to: '/map', label: { en: 'Map', hi: 'मैप' } },
  { to: '/scan', label: { en: 'Scan Rx', hi: 'Rx स्कैन' } },
  { to: '/about', label: { en: 'About', hi: 'परिचय' } },
];

export const POPULAR_SEARCHES = [
  { en: 'Paracetamol 500mg', hi: 'पैरासिटामोल 500mg' },
  { en: 'Azithromycin 500mg', hi: 'एज़िथ्रोमाइसिन 500mg' },
  { en: 'Metformin 500mg', hi: 'मेटफ़ॉर्मिन 500mg' },
  { en: 'Cetirizine 10mg', hi: 'सिट्रीज़िन 10mg' },
];

export const HERO_PHRASES = {
  en: ['a lower price', 'a closer counter', 'the generic name', 'a shorter walk'],
  hi: ['कम कीमत', 'पास का काउंटर', 'जेनेरिक नाम', 'छोटा रास्ता'],
};

export const STATS = [
  {
    value: '2,400+',
    label: { en: 'Formulations indexed', hi: 'दवाएं सूचीबद्ध' },
    detail: { en: 'Brand and salt names', hi: 'ब्रांड और सॉल्ट नाम' },
  },
  {
    value: '15 min',
    label: { en: 'Stock refresh target', hi: 'स्टॉक रीफ़्रेश लक्ष्य' },
    detail: { en: 'During the Dwarka pilot', hi: 'द्वारका पायलट के दौरान' },
  },
  {
    value: '0%',
    label: { en: 'Commission on searches', hi: 'खोज पर कमीशन' },
    detail: { en: 'Patients never pay to compare', hi: 'तुलना के लिए शुल्क नहीं' },
  },
  {
    value: '2',
    label: { en: 'Languages, end to end', hi: 'भाषाएं, पूरी ऐप में' },
    detail: { en: 'Hindi and English', hi: 'हिंदी और अंग्रेज़ी' },
  },
];

export const CAPABILITIES = [
  {
    id: 'compare',
    to: '/results?q=Paracetamol%20500mg',
    tag: { en: 'Price comparison', hi: 'कीमत तुलना' },
    title: { en: 'One search, every counter', hi: 'एक खोज, हर दुकान' },
    body: {
      en: 'Search a brand or salt name and see the same strip priced across nearby pharmacies, with the timestamp of the last stock update.',
      hi: 'ब्रांड या सॉल्ट नाम खोजें और आसपास की फार्मेसियों में उसी पत्ती की कीमत, आखिरी स्टॉक अपडेट के समय के साथ देखें।',
    },
  },
  {
    id: 'bridge',
    to: '/bridge',
    tag: { en: 'Bridge mode', hi: 'ब्रिज मोड' },
    title: { en: 'Cheapest is not always closest', hi: 'सस्ता हमेशा पास नहीं होता' },
    body: {
      en: 'Bridge mode weighs the fare and the walk against the saving, then shows the option that costs you less overall.',
      hi: 'ब्रिज मोड किराए और पैदल दूरी को बचत से तौलता है, फिर वह विकल्प दिखाता है जो कुल मिलाकर कम खर्च कराता है।',
    },
  },
  {
    id: 'scan',
    to: '/scan',
    tag: { en: 'Prescription scan', hi: 'पर्ची स्कैन' },
    title: { en: 'Read the slip, not the handwriting', hi: 'पर्ची पढ़ें, लिखावट नहीं' },
    body: {
      en: 'Upload a photo of your prescription. The OCR pass extracts medicine names and strengths, and you confirm each line before searching.',
      hi: 'अपनी पर्ची की फ़ोटो अपलोड करें। OCR दवा के नाम और मात्रा निकालता है, और खोजने से पहले आप हर पंक्ति जांच सकते हैं।',
    },
  },
  {
    id: 'network',
    to: '/map',
    tag: { en: 'Verified network', hi: 'सत्यापित नेटवर्क' },
    title: { en: 'Pharmacies, with hours and phone numbers', hi: 'फार्मेसियां, समय और फ़ोन के साथ' },
    body: {
      en: 'Every listing carries an address, counter hours, and a direct number, so you can call before you travel.',
      hi: 'हर लिस्टिंग में पता, दुकान का समय और सीधा फ़ोन नंबर है, ताकि आप निकलने से पहले कॉल कर सकें।',
    },
  },
  {
    id: 'points',
    to: '/points',
    tag: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' },
    title: { en: 'Paid for accuracy, not clicks', hi: 'सटीकता के लिए अंक, क्लिक के लिए नहीं' },
    body: {
      en: 'Upload a pharmacy bill to confirm a price. Verified receipts earn points that convert into partner vouchers.',
      hi: 'कीमत की पुष्टि के लिए फार्मेसी का बिल अपलोड करें। सत्यापित रसीदें अंक देती हैं जो पार्टनर वाउचर में बदलते हैं।',
    },
  },
  {
    id: 'pharmacist',
    to: '/login',
    tag: { en: 'Dispensary portal', hi: 'फार्मेसी पोर्टल' },
    title: { en: 'A counter tool, not an ad slot', hi: 'काउंटर का औज़ार, विज्ञापन नहीं' },
    body: {
      en: 'Pharmacists publish stock and prices, answer patient requests, and keep the listing accurate from the same dashboard.',
      hi: 'फार्मासिस्ट स्टॉक और कीमतें प्रकाशित करते हैं, मरीज़ों के अनुरोधों का जवाब देते हैं, और उसी डैशबोर्ड से लिस्टिंग सही रखते हैं।',
    },
  },
];

export const STEPS = [
  {
    n: '01',
    title: { en: 'Search or scan', hi: 'खोजें या स्कैन करें' },
    body: {
      en: 'Type a brand or salt name, or upload the prescription you were given.',
      hi: 'ब्रांड या सॉल्ट नाम लिखें, या अपनी पर्ची अपलोड करें।',
    },
  },
  {
    n: '02',
    title: { en: 'Compare the counter', hi: 'दुकान की तुलना करें' },
    body: {
      en: 'See stock, distance, and price per strip side by side, sorted by nearest or lowest price.',
      hi: 'स्टॉक, दूरी और प्रति पत्ती कीमत साथ-साथ देखें, निकटतम या सबसे कम कीमत से क्रमबद्ध।',
    },
  },
  {
    n: '03',
    title: { en: 'Walk in with a name', hi: 'नाम लेकर पहुंचें' },
    body: {
      en: 'Call the counter, get directions, and ask for the generic name if you want the lower price.',
      hi: 'दुकान पर कॉल करें, रास्ता देखें, और कम कीमत के लिए जेनेरिक नाम पूछें।',
    },
  },
];

export const LIVE_UPDATES = [
  {
    pharmacy: 'Jan Aushadhi Kendra',
    area: 'NSUT Gate 1, Sector 3',
    note: 'Paracetamol 500 mg, 10 tablets',
    price: 12,
    tag: { en: 'Generic', hi: 'जेनेरिक' },
  },
  {
    pharmacy: 'Apollo Pharmacy',
    area: 'Sector 14 Metro',
    note: 'Azithromycin 500 mg, 3 tablets',
    price: 71,
    tag: { en: '24-hour counter', hi: '24 घंटे' },
  },
  {
    pharmacy: 'MedPlus',
    area: 'DDA Market, Sector 3',
    note: 'Metformin 500 mg SR, 15 tablets',
    price: 18,
    tag: { en: 'In stock', hi: 'उपलब्ध' },
  },
  {
    pharmacy: 'Zeelab Pharmacy',
    area: 'Kakrola More, Dwarka Mor',
    note: 'Cetirizine 10 mg, 10 tablets',
    price: 9.5,
    tag: { en: 'Generic', hi: 'जेनेरिक' },
  },
  {
    pharmacy: 'Guardian Pharmacy',
    area: 'Sector 12 City Centre',
    note: 'Salbutamol inhaler, 100 mcg',
    price: 142,
    tag: { en: 'Refill counter', hi: 'रीफ़िल काउंटर' },
  },
];

export const FOOTER_GROUPS = [
  {
    title: { en: 'Find care', hi: 'देखभाल खोजें' },
    links: [
      { to: '/results?q=Paracetamol%20500mg', label: { en: 'Compare prices', hi: 'कीमत तुलना' } },
      { to: '/map', label: { en: 'Pharmacy map', hi: 'फार्मेसी मैप' } },
      { to: '/scan', label: { en: 'Scan a prescription', hi: 'पर्ची स्कैन करें' } },
      { to: '/bridge', label: { en: 'Bridge mode', hi: 'ब्रिज मोड' } },
    ],
  },
  {
    title: { en: 'Contribute', hi: 'योगदान दें' },
    links: [
      { to: '/submit-price', label: { en: 'Submit a price', hi: 'कीमत जमा करें' } },
      { to: '/points', label: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' } },
      { to: '/profile', label: { en: 'Your account', hi: 'आपका खाता' } },
    ],
  },
  {
    title: { en: 'For pharmacies', hi: 'फार्मेसियों के लिए' },
    links: [
      { to: '/login', label: { en: 'Dispensary portal', hi: 'फार्मेसी पोर्टल' } },
      { to: '/about', label: { en: 'How the pilot works', hi: 'पायलट कैसे काम करता है' } },
    ],
  },
];
