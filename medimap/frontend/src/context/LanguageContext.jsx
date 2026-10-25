// src/context/LanguageContext.jsx — COMPLETE with all Hindi translations
import { createContext, useContext, useEffect, useState } from 'react';

const translations = {
  en: {
    // Navbar
    home: 'Home', scanRx: 'Scan Rx', mapView: 'Map', updatePrice: 'Submit Price', about: 'About',
    login: 'Login', signup: 'Sign Up', logout: 'Logout', myProfile: 'My Profile',
    mediPoints: 'MediPoints', submitPrice: 'Submit Price', myDashboard: 'My Dashboard',
    // Hero
    heroTag: "India's #1 Medicine Price Comparison",
    heroTitle: 'Find Medicines at the', heroTitleHighlight: 'Best Price', heroTitleEnd: 'Near You',
    heroSubtitle: 'Compare published prices and stock at pharmacies around Dwarka, Delhi.',
    searchPlaceholder: 'Search medicine name...', searchBtn: 'Search',
    scanPrescription: 'Scan Prescription', viewMap: 'View Map',
    // Stats
    statsPharmacies: 'Pharmacies', statsMedicines: 'Medicines', statsAvgSavings: 'Avg Savings', statsRating: 'Rating',
    // Results
    pharmaciesFound: 'pharmacies found', inStockOnly: 'In stock only',
    lowestPrice: 'Lowest Price', averagePrice: 'Average Price', highestPrice: 'Highest Price', potentialSavings: 'Potential Savings',
    backToHome: 'Back to Home', knowBetterPrice: 'Know a better price?',
    helpCommunity: 'Help the community — submit a price update', submitPriceUpdate: 'Submit Price Update',
    // Pharmacy card
    bestPrice: 'Best Price Nearby', inStock: 'In Stock', outOfStock: 'Out of Stock',
    openNow: 'Open Now', closed: 'Closed', awayKm: 'km away',
    viewDetails: 'View Details', getDirections: 'Directions', perStrip: 'per strip',
    updatedJustNow: 'Just now', updatedHoursAgo: 'h ago',
    // Scan
    scanTitle: 'Scan Prescription', scanSubtitle: 'Upload your prescription — AI will extract all medicines automatically',
    uploadBill: 'Upload Prescription / Bill', dropHere: 'Drop file here or click to browse',
    scanBtn: 'Scan with AI', scanning: 'Scanning...',
    // Map
    findNearby: 'Find Nearby Pharmacies', locating: 'Finding your location...',
    // Profile
    searchHistory: 'Search History', savedPharmacies: 'Saved', myReviews: 'Reviews',
    priceAlerts: 'Alerts', mySavings: 'Savings',
    // Generic
    loading: 'Loading...', error: 'Something went wrong', noResults: 'No results found',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    submit: 'Submit', approve: 'Approve', reject: 'Reject',
    // PharmacyDetail
    backToResults: 'Back to Results', priceHistory: 'Price History',
    priceHistorySubtitle: '7-month trend for this medicine at this pharmacy',
    pharmacyDetails: 'Medicine at this pharmacy',
  },
  hi: {
    // Navbar
    home: 'होम', scanRx: 'Rx स्कैन', mapView: 'मैप', updatePrice: 'कीमत जमा करें', about: 'हमारे बारे में',
    login: 'लॉगिन', signup: 'साइन अप', logout: 'लॉगआउट', myProfile: 'मेरी प्रोफ़ाइल',
    mediPoints: 'मेडीपॉइंट्स', submitPrice: 'कीमत जमा करें', myDashboard: 'मेरा डैशबोर्ड',
    // Hero
    heroTag: 'भारत का #1 दवाई कीमत तुलना प्लेटफ़ॉर्म',
    heroTitle: 'पास में सबसे', heroTitleHighlight: 'सस्ती दवाई', heroTitleEnd: 'खोजें',
    heroSubtitle: 'द्वारका, दिल्ली की फार्मेसियों में प्रकाशित कीमतें और स्टॉक देखें।',
    searchPlaceholder: 'दवाई का नाम खोजें...', searchBtn: 'खोजें',
    scanPrescription: 'पर्ची स्कैन करें', viewMap: 'मैप देखें',
    // Stats
    statsPharmacies: 'फार्मेसियां', statsMedicines: 'दवाइयां', statsAvgSavings: 'औसत बचत', statsRating: 'रेटिंग',
    // Results
    pharmaciesFound: 'फार्मेसियां मिलीं', inStockOnly: 'सिर्फ उपलब्ध',
    lowestPrice: 'सबसे कम कीमत', averagePrice: 'औसत कीमत', highestPrice: 'सबसे ज़्यादा', potentialSavings: 'संभावित बचत',
    backToHome: 'होम पर वापस', knowBetterPrice: 'बेहतर कीमत पता है?',
    helpCommunity: 'समुदाय की मदद करें — कीमत अपडेट करें', submitPriceUpdate: 'कीमत अपडेट करें',
    // Pharmacy card
    bestPrice: 'सबसे कम कीमत', inStock: 'उपलब्ध है', outOfStock: 'उपलब्ध नहीं',
    openNow: 'अभी खुला है', closed: 'बंद है', awayKm: 'किमी दूर',
    viewDetails: 'विवरण देखें', getDirections: 'रास्ता', perStrip: 'प्रति पत्ता',
    updatedJustNow: 'अभी अपडेट हुआ', updatedHoursAgo: 'घंटे पहले',
    // Scan
    scanTitle: 'पर्ची स्कैन करें', scanSubtitle: 'पर्ची अपलोड करें — AI सभी दवाइयां निकाल देगा',
    uploadBill: 'पर्ची / बिल अपलोड करें', dropHere: 'फ़ाइल यहाँ छोड़ें या क्लिक करें',
    scanBtn: 'AI से स्कैन करें', scanning: 'स्कैन हो रहा है...',
    // Map
    findNearby: 'पास की फार्मेसियां खोजें', locating: 'आपकी लोकेशन ढूंढ रहे हैं...',
    // Profile
    searchHistory: 'खोज इतिहास', savedPharmacies: 'सेव किए', myReviews: 'समीक्षाएं',
    priceAlerts: 'अलर्ट', mySavings: 'बचत',
    // Generic
    loading: 'लोड हो रहा है...', error: 'कुछ गलत हुआ', noResults: 'कोई परिणाम नहीं',
    save: 'सेव करें', cancel: 'रद्द करें', delete: 'हटाएं', edit: 'संपादित करें', add: 'जोड़ें',
    submit: 'जमा करें', approve: 'स्वीकार करें', reject: 'अस्वीकार करें',
    // PharmacyDetail
    backToResults: 'परिणामों पर वापस', priceHistory: 'कीमत का इतिहास',
    priceHistorySubtitle: 'इस फार्मेसी में इस दवा का 7 महीने का ट्रेंड',
    pharmacyDetails: 'इस फार्मेसी में दवा',
  },
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('medimap_lang') || 'en');

  // Keep the document language in sync so screen readers and browsers pick the right voice.
  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('medimap_lang', next);
  };

  // t() — get translated string
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
};
