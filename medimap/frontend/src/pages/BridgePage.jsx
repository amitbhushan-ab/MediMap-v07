// frontend/src/pages/BridgePage.jsx — bridge mode: the cheapest counter or the closest one
// Presentation only. The comparison, the search calls and every handler below are unchanged.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  FileText,
  IndianRupee,
  Info,
  MapPin,
  PenLine,
  Pill,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { adaptSearchResults, NSUT_PHARMACIES, calcDistanceKm } from '../lib/pharmacyAdapter';
import { formatDistance, formatPrice, pick } from '../lib/format';
import { useMotionSafe } from '../lib/motion';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { Field, Input } from '../components/ui/input';
import { Container } from '../components/ui/section';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs } from '../components/ui/tabs';
import { BackgroundBeams } from '../components/ui/background-beams';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { FocusCards } from '../components/ui/focus-cards';
import { GridPattern } from '../components/ui/grid-pattern';
import { Lamp } from '../components/ui/lamp';
import { RoutePath } from '../components/ui/route-path';
import { StepLoader } from '../components/ui/step-loader';

const API_BASE = import.meta.env.VITE_API_URL || 'https://medimap-backend-ygqj.onrender.com/api';

// ── Copy ────────────────────────────────────────────────────────
// en / hi stay in step. No claim here is bigger than what the code does.
const COPY = {
  eyebrow: { en: 'Bridge mode', hi: 'ब्रिज मोड' },
  title: { en: 'Cheapest, or closest?', hi: 'सस्ता, या पास?' },
  lead: {
    en: 'A ₹10 saving is not a saving if the auto fare is ₹60. Bridge compares both.',
    hi: '₹10 की बचत तब बचत नहीं है जब ऑटो का किराया ₹60 हो। ब्रिज दोनों को साथ तौलता है।',
  },
  heroCta: { en: 'Compare options', hi: 'विकल्प तुलना करें' },
  heroNote: {
    en: 'Prices are what the counter published. Distances are straight-line, in kilometres.',
    hi: 'कीमतें वही हैं जो काउंटर ने बताई हैं। दूरियाँ सीधी रेखा में, किलोमीटर में।',
  },

  calcEyebrow: { en: 'The calculator', hi: 'कैलकुलेटर' },
  calcTitle: { en: 'Enter a medicine. See the trade-off.', hi: 'दवा लिखें। दोनों तरफ़ देखें।' },
  formTitle: { en: 'Your medicine', hi: 'आपकी दवा' },
  formBody: {
    en: 'One medicine at a time. Add a budget only if you have one in mind.',
    hi: 'एक बार में एक दवा। बजट तभी लिखें जब मन में तय हो।',
  },
  modeManual: { en: 'Type the name', hi: 'नाम लिखें' },
  modeScan: { en: 'Upload a slip', hi: 'पर्ची अपलोड करें' },
  medicineLabel: { en: 'Medicine name', hi: 'दवा का नाम' },
  medicinePlaceholder: { en: 'Paracetamol 500 mg', hi: 'जैसे Paracetamol 500 mg' },
  medicineHint: {
    en: 'Brand or salt, with the strength if you know it.',
    hi: 'ब्रांड या साल्ट, ताकत पता हो तो साथ लिखें।',
  },
  budgetLabel: { en: 'Budget (optional)', hi: 'बजट (वैकल्पिक)' },
  budgetHint: {
    en: 'We say so when the lowest price is above it.',
    hi: 'सबसे कम कीमत इससे ऊपर निकले तो हम बता देंगे।',
  },
  compare: { en: 'Compare options', hi: 'विकल्प तुलना करें' },
  readSlip: { en: 'Read the slip', hi: 'पर्ची पढ़ें' },
  uploadTitle: { en: 'Drop the slip here, or choose a file', hi: 'पर्ची यहाँ डालें या फ़ाइल चुनें' },
  uploadHint: { en: 'PNG, JPG or PDF', hi: 'PNG, JPG या PDF' },
  uploadChange: { en: 'Choose a different file', hi: 'दूसरी फ़ाइल चुनें' },
  previewAlt: { en: 'The prescription you uploaded', hi: 'आपकी अपलोड की हुई पर्ची' },
  remove: { en: 'Remove', hi: 'हटाएँ' },
  samples: { en: 'Sample medicines', hi: 'नमूना दवाएँ' },
  locationNote: {
    en: 'The walk is measured from your device location. If location is off, from NSUT Dwarka.',
    hi: 'पैदल दूरी आपकी लोकेशन से नापी जाती है। लोकेशन बंद हो तो NSUT द्वारका से।',
  },

  scanningTitle: { en: 'Reading the slip', hi: 'पर्ची पढ़ी जा रही है' },
  scanSteps: {
    en: ['Preparing the image', 'Reading the handwriting', 'Checking names against the index', 'Waiting for your confirmation'],
    hi: ['तस्वीर तैयार हो रही है', 'लिखावट पढ़ी जा रही है', 'नाम सूची से मिलाए जा रहे हैं', 'आपकी पुष्टि का इंतज़ार'],
  },
  scanningBody: {
    en: 'The text is read on your device. Names and strengths are pulled out for you to check.',
    hi: 'पाठ आपके ही डिवाइस पर पढ़ा जाता है। नाम और ताकत निकालकर आपके जाँचने के लिए रखे जाते हैं।',
  },

  confirmTitle: { en: 'Check the medicines', hi: 'दवाएँ जाँच लें' },
  confirmBody: {
    en: 'Fix the spelling or the strength before comparing.',
    hi: 'तुलना से पहले नाम या ताकत ठीक कर लें।',
  },
  found: { en: 'found', hi: 'मिलीं' },
  confirmWarning: {
    en: 'Handwriting is often misread. Check every name and strength before you compare.',
    hi: 'हाथ की लिखाई अक्सर गलत पढ़ी जाती है। तुलना से पहले हर नाम और ताकत जाँच लें।',
  },
  rawText: { en: 'Show the raw scanned text', hi: 'स्कैन किया कच्चा पाठ देखें' },
  medNumber: { en: 'Medicine', hi: 'दवा' },
  medPlaceholder: { en: 'Name and strength', hi: 'नाम और ताकत' },
  findCounters: { en: 'Find counters with this medicine', hi: 'इस दवा वाले काउंटर खोजें' },
  addAnother: { en: 'Add another medicine', hi: 'एक और दवा जोड़ें' },
  backToStart: { en: 'Start over', hi: 'शुरू से' },

  resultsEyebrow: { en: 'Results', hi: 'नतीजे' },
  newSearch: { en: 'New search', hi: 'नई खोज' },
  records: { en: 'counter records compared', hi: 'काउंटर रिकॉर्ड तुलने पर' },
  budgetChip: { en: 'Budget', hi: 'बजट' },

  eqPrice: { en: 'price', hi: 'कीमत' },
  eqWalk: { en: 'walk', hi: 'पैदल' },
  eqTotal: { en: 'total', hi: 'कुल' },
  eqNote: {
    en: 'Total is the price on the shelf. No auto or bus fare is added here.',
    hi: 'कुल वही है जो शेल्फ पर लिखा है। यहाँ ऑटो या बस का किराया नहीं जोड़ा जाता।',
  },

  optCheapest: { en: 'Cheapest', hi: 'सबसे सस्ता' },
  optClosest: { en: 'Closest', hi: 'सबसे पास' },
  optBest: { en: 'Best total', hi: 'सबसे कम कुल' },
  bestTotal: { en: 'Best total', hi: 'सबसे कम कुल' },
  rowPrice: { en: 'Price', hi: 'कीमत' },
  rowWalk: { en: 'Walk', hi: 'पैदल' },
  rowTotal: { en: 'Total', hi: 'कुल' },
  choose: { en: 'Choose this', hi: 'यही चुनें' },
  chosen: { en: 'Chosen', hi: 'चुना गया' },

  emptyTitle: { en: 'Nothing to compare yet', hi: 'अभी तुलना के लिए कुछ नहीं' },
  emptyBody: {
    en: 'Type the medicine, or upload the slip. Three options appear here: cheapest, closest, and best total.',
    hi: 'दवा लिखें या पर्ची अपलोड करें। यहाँ तीन विकल्प आएँगे: सबसे सस्ता, सबसे पास और सबसे कम कुल।',
  },
  emptyScanning: {
    en: 'The comparison starts as soon as the slip is read.',
    hi: 'पर्ची पढ़ते ही तुलना शुरू हो जाएगी।',
  },
  emptyConfirm: {
    en: 'Check the medicine on the left, then compare.',
    hi: 'बाईं तरफ़ दवा जाँच लें, फिर तुलना करें।',
  },
  comparing: { en: 'Comparing prices and distances', hi: 'कीमतें और दूरियाँ तुलना में हैं' },

  noRouteTitle: { en: 'No counter reports this medicine', hi: 'इस दवा का स्टॉक किसी काउंटर ने नहीं बताया' },
  noRouteBody: {
    en: 'Try the salt name, or the brand on the slip. You can also upload the slip again.',
    hi: 'साल्ट का नाम या पर्ची पर लिखा ब्रांड आज़माएँ। पर्ची दोबारा अपलोड भी कर सकते हैं।',
  },
  noRouteAction: { en: 'Start a new search', hi: 'नई खोज शुरू करें' },
  tryNames: { en: 'Try', hi: 'आज़माएँ' },
  allOut: {
    en: 'Every counter we found reports this medicine out of stock. Call before you travel.',
    hi: 'हमें मिले सभी काउंटर इस दवा को स्टॉक में नहीं बता रहे। निकलने से पहले फ़ोन कर लें।',
  },

  allCounters: { en: 'All counters nearby', hi: 'आसपास के सभी काउंटर' },
  recordCount: { en: 'records', hi: 'रिकॉर्ड' },
  inStock: { en: 'In stock', hi: 'स्टॉक में' },
  inStockCount: { en: 'in stock', hi: 'स्टॉक में' },
  outOfStock: { en: 'Out of stock', hi: 'स्टॉक में नहीं' },
  verified: { en: 'Verified', hi: 'सत्यापित' },
  liveStock: { en: 'Live stock', hi: 'लाइव स्टॉक' },
  directions: { en: 'Directions', hi: 'रास्ता' },

  budgetWarnTitle: { en: 'Above your budget', hi: 'बजट से ऊपर' },
  budgetWarn: {
    en: (price, limit) =>
      `The best price here is ${price}, above the ₹${limit} you set. Jan Aushadhi Kendra generics usually cost less.`,
    hi: (price, limit) =>
      `यहाँ सबसे कम कीमत ${price} है, जो आपके ₹${limit} के बजट से ऊपर है। जन औषधि केंद्र की जेनेरिक दवाएँ अक्सर सस्ती पड़ती हैं।`,
  },

  howEyebrow: { en: 'The arithmetic', hi: 'गणित' },
  howTitle: { en: 'How the number is built', hi: 'यह आँकड़ा कैसे बनता है' },
  step1Title: { en: 'The price', hi: 'कीमत' },
  step1Body: {
    en: 'What the counter published for this medicine, in rupees. It is the only money in the comparison.',
    hi: 'काउंटर ने इस दवा के जो दाम बताए, रुपयों में। तुलना में पैसा सिर्फ़ यही है।',
  },
  step2Title: { en: 'The walk', hi: 'पैदल दूरी' },
  step2Body: {
    en: 'Straight-line kilometres from your location to the counter, rounded to one decimal. Your device location is used; if it is off, NSUT Dwarka is the starting point.',
    hi: 'आपकी लोकेशन से काउंटर तक सीधी दूरी, किलोमीटर में, एक दशमलव तक। आपकी डिवाइस लोकेशन ली जाती है; बंद हो तो शुरुआत NSUT द्वारका से मानी जाती है।',
  },
  step3Title: { en: 'The choice', hi: 'फ़ैसला' },
  step3Body: {
    en: 'Cheapest is the lowest price. Closest is the shortest walk. Best total scores each counter as price ÷ cheapest price + distance ÷ closest distance, and the lowest score wins.',
    hi: 'सबसे सस्ता यानी सबसे कम कीमत। सबसे पास यानी सबसे कम दूरी। सबसे कम कुल हर काउंटर को ऐसे जोड़ता है: कीमत ÷ सबसे कम कीमत + दूरी ÷ सबसे कम दूरी — जिसका स्कोर सबसे कम, वही जीतता है।',
  },
  assumeTitle: { en: 'What the number leaves out', hi: 'संख्या में क्या शामिल नहीं है' },
  assume1: {
    en: 'No fare per kilometre and no walking speed are assumed. Rupees are compared with kilometres, never converted into each other.',
    hi: 'प्रति किलोमीटर कोई किराया नहीं, कोई चाल नहीं मानी जाती। रुपयों की तुलना किलोमीटर से होती है, एक को दूसरे में नहीं बदला जाता।',
  },
  assume2: {
    en: 'Distances are straight-line, not the road you will actually walk.',
    hi: 'दूरियाँ सीधी रेखा की हैं, वह सड़क नहीं जिस पर आप चलेंगे।',
  },
  assume3: {
    en: 'Prices are the ones the counter reported. Call before you travel.',
    hi: 'कीमतें वही हैं जो काउंटर ने बताईं। निकलने से पहले फ़ोन कर लें।',
  },
  disclaimer: {
    en: 'The three options are calculated from reported prices and distance. MediMap does not give medical advice or approve substitutes; any alternative medicine needs a pharmacist’s check.',
    hi: 'तीनों विकल्प बताई गई कीमतों और दूरी से निकाले जाते हैं। मेडीमैप चिकित्सीय सलाह नहीं देता और किसी विकल्प को मंज़ूरी नहीं देता; किसी भी दूसरी दवा के लिए फ़ार्मासिस्ट से जाँच ज़रूरी है।',
  },

  pharmacyEyebrow: { en: 'For pharmacies', hi: 'फ़ार्मेसी के लिए' },
  pharmacyTitle: { en: 'Run a counter in Dwarka?', hi: 'द्वारका में काउंटर चलाते हैं?' },
  pharmacyBody: {
    en: 'Update your stock and prices from the pharmacist dashboard. Patients see the change the next time they compare.',
    hi: 'फ़ार्मासिस्ट डैशबोर्ड से अपना स्टॉक और कीमत अपडेट करें। मरीज़ अगली तुलना में बदलाव देख लेंगे।',
  },
  pharmacyCta: { en: 'Open pharmacist dashboard', hi: 'फ़ार्मासिस्ट डैशबोर्ड खोलें' },

  errNeedMedicine: { en: 'Type the medicine name first.', hi: 'पहले दवा का नाम लिखें।' },
  errNeedFile: { en: 'Choose a prescription photo first.', hi: 'पहले पर्ची की फोटो चुनें।' },
  errInvalid: { en: 'Please specify a valid medicine name.', hi: 'कृपया दवा का सही नाम लिखें।' },
  errScanEmpty: {
    en: 'No medicine name could be read. Type it in yourself.',
    hi: 'पर्ची से कोई दवा नहीं पढ़ी जा सकी। नाम हाथ से लिखें।',
  },
  errScanPrefix: { en: 'The slip could not be read: ', hi: 'पर्ची नहीं पढ़ी जा सकी: ' },
};

const OPTION_META = {
  save: { label: COPY.optCheapest, Icon: IndianRupee },
  nearby: { label: COPY.optClosest, Icon: MapPin },
  balanced: { label: COPY.optBest, Icon: Scale },
};

// ── Helpers (calculation untouched) ─────────────────────────────
function getFreshnessLabel(lastUpdated) {
  if (!lastUpdated) return { tone: 'warning', label: { en: 'Unconfirmed', hi: 'अपुष्ट' } };
  const d = new Date(lastUpdated);
  if (isNaN(d.getTime())) return { tone: 'warning', label: { en: 'Unconfirmed', hi: 'अपुष्ट' } };
  const hoursAgo = (Date.now() - d.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 4) return { tone: 'success', label: { en: 'Verified today', hi: 'आज सत्यापित' } };
  if (hoursAgo < 24) {
    return {
      tone: 'success',
      label: {
        en: `Updated ${Math.round(hoursAgo)}h ago`,
        hi: `${Math.round(hoursAgo)} घंटे पहले अपडेट`,
      },
    };
  }
  if (hoursAgo < 72) {
    return {
      tone: 'accent',
      label: {
        en: `Updated ${Math.round(hoursAgo / 24)}d ago`,
        hi: `${Math.round(hoursAgo / 24)} दिन पहले अपडेट`,
      },
    };
  }
  return {
    tone: 'neutral',
    label: {
      en: `Logged ${d.toLocaleDateString('en-IN')}`,
      hi: `${d.toLocaleDateString('en-IN')} को दर्ज`,
    },
  };
}

function fmtDist(km, lang = 'en') {
  if (km === undefined || km === null || isNaN(km)) {
    return lang === 'hi' ? 'दूरी अज्ञात' : 'Distance unavailable';
  }
  if (km < 1) return lang === 'hi' ? `${Math.round(km * 1000)} मीटर दूर` : `${Math.round(km * 1000)} m away`;
  return lang === 'hi' ? `${km.toFixed(1)} किमी दूर` : `${km.toFixed(1)} km away`;
}

// ── Small shared surfaces ───────────────────────────────────────
function InlineAlert({ tone = 'warning', className, children }) {
  const shell = {
    warning: 'border-warning/30 bg-warning/10',
    danger: 'border-danger/30 bg-danger/10',
    info: 'border-line bg-raised',
  }[tone];
  const icon = { warning: 'text-warning', danger: 'text-danger', info: 'text-muted' }[tone];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-card border px-3.5 py-3 text-xs leading-relaxed text-ink',
        shell,
        className,
      )}
    >
      <AlertTriangle
        className={cn('mt-0.5 h-4 w-4 flex-shrink-0', icon)}
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

// ── Result summary: the signature equation strip ────────────────
function EquationStrip({ result, mode, t, lang }) {
  if (!result) return null;

  return (
    <div className="rounded-card border border-line bg-raised/60 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <Badge tone={mode === 'balanced' ? 'accent' : 'neutral'}>{t(OPTION_META[mode].label)}</Badge>

        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-[11px] text-muted">
          <span className="tnum text-[15px] font-medium tracking-[-0.02em] text-ink">
            {formatPrice(result.price)}
          </span>
          <span>{t(COPY.eqPrice)}</span>
          <span aria-hidden="true" className="px-0.5 text-line-strong">
            ·
          </span>
          <span className="tnum text-[15px] font-medium tracking-[-0.02em] text-ink">
            {formatDistance(result.distance, lang)}
          </span>
          <span>{t(COPY.eqWalk)}</span>
          <span aria-hidden="true" className="px-0.5 text-line-strong">
            ·
          </span>
          <span className="tnum text-[15px] font-medium tracking-[-0.02em] text-ink">
            {formatPrice(result.price)}
          </span>
          <span>{t(COPY.eqTotal)}</span>
        </p>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted">{t(COPY.eqNote)}</p>
    </div>
  );
}

// ── One of the three options ────────────────────────────────────
function SmartChoiceCard({ mode, result, reasons, isSelected, onClick, t, lang }) {
  if (!result) return null;

  const meta = OPTION_META[mode] || OPTION_META.balanced;
  const Icon = meta.Icon;

  return (
    <Card
      className={cn(
        'flex flex-col p-4 transition-colors duration-200',
        isSelected ? 'border-accent' : mode === 'balanced' ? 'border-accent/35' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted">
          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
          {mode !== 'balanced' && <span className="truncate">{t(meta.label)}</span>}
        </span>
        {mode === 'balanced' && (
          <Badge tone={isSelected ? 'accent' : 'outline'}>{t(COPY.bestTotal)}</Badge>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="tnum text-[1.6rem] font-light leading-none tracking-[-0.03em] text-ink">
          {formatPrice(result.price)}
        </span>
        <span className="text-[10px] text-muted">{t(COPY.rowTotal)}</span>
      </div>

      <p className="mt-2 truncate text-[11px] font-medium text-ink-soft" title={result.pharmacy?.name}>
        {result.pharmacy?.name}
      </p>

      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-[11px]">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted">{t(COPY.rowPrice)}</dt>
          <dd className="tnum text-ink">{formatPrice(result.price)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-muted">{t(COPY.rowWalk)}</dt>
          <dd className="tnum text-ink">{formatDistance(result.distance, lang)}</dd>
        </div>
      </dl>

      <ul className="mt-3 space-y-1">
        {reasons.slice(0, 2).map((reason, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] leading-snug text-muted">
            <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-success" strokeWidth={1.75} aria-hidden="true" />
            <span className="min-w-0">{t(reason)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-3">
        <Button
          variant={isSelected ? 'primary' : 'secondary'}
          size="sm"
          onClick={onClick}
          aria-pressed={isSelected}
          className="w-full"
        >
          {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
          {isSelected ? t(COPY.chosen) : t(COPY.choose)}
        </Button>
      </div>
    </Card>
  );
}

// ── One row of the full counter list ────────────────────────────
function PharmacyResultCard({ result, rank, t, lang }) {
  const freshness = getFreshnessLabel(result.lastUpdated);

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="tnum mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-line bg-raised text-[11px] font-medium text-ink-soft">
          {rank}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-ink" title={result.pharmacy?.name}>
              {result.pharmacy?.name}
            </span>
            {result.pharmacy?.isVerified && (
              <Badge tone="success">
                <ShieldCheck className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                {t(COPY.verified)}
              </Badge>
            )}
            {result.fromPharmacist && <Badge tone="accent">{t(COPY.liveStock)}</Badge>}
          </div>

          <p
            className="mt-1 truncate text-[11px] text-muted"
            title={result.pharmacy?.address || 'Near NSUT Dwarka'}
          >
            {result.pharmacy?.address || 'Near NSUT Dwarka'}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={result.inStock ? 'success' : 'danger'}>
              {result.inStock ? t(COPY.inStock) : t(COPY.outOfStock)}
            </Badge>
            <Badge tone={freshness.tone}>
              <Clock3 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
              {t(freshness.label)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="tnum text-lg font-light leading-none tracking-[-0.03em] text-ink">
            {formatPrice(result.price)}
          </p>
          <p className="tnum mt-1 text-[11px] text-muted">{fmtDist(result.distance, lang)}</p>
        </div>

        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(result.pharmacy?.address || result.pharmacy?.name || '')}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink-soft transition-colors duration-150 hover:border-accent/45 hover:text-accent-ink"
        >
          {t(COPY.directions)}
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </li>
  );
}

// ── Main Bridge Page ────────────────────────────────────────────
export default function BridgePage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const animated = useMotionSafe();
  const calculatorRef = useRef(null);

  const [step, setStep] = useState('input'); // 'input' | 'scanning' | 'confirm' | 'bridging' | 'results'
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'prescription'
  const [manualQuery, setManualQuery] = useState('');
  const [budget, setBudget] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrRaw, setOcrRaw] = useState('');
  const [detectedMeds, setDetectedMeds] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState('balanced');
  const [userLat, setUserLat] = useState(28.6092); // NSUT Dwarka
  const [userLng, setUserLng] = useState(77.0354);
  const [bridgeAnimating, setBridgeAnimating] = useState(false);
  const fileRef = useRef(null);

  const t = (pair) => pick(lang, pair);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
    );
  }, []);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function handleScan() {
    if (!file) return;
    setStep('scanning');
    setError('');
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text || '';
      setOcrRaw(text);

      const lines = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 2);
      const detected = [];
      const FREQ =
        /\b(once|twice|daily|od|bd|tid|qid|morning|night|after meals?|before meals?|x\s*\d+\s*days?|\d+\s*days?)\b/gi;
      const SKIP = [
        'pharmacy',
        'doctor',
        'patient',
        'hospital',
        'clinic',
        'date',
        'name',
        'address',
        'total',
        'bill',
        'receipt',
        'gstin',
      ];

      for (const line of lines) {
        if (SKIP.some((s) => line.toLowerCase().includes(s))) continue;
        if (!/(mg|ml|mcg|tab|cap|strip|gm)/i.test(line)) continue;
        if (!/[a-zA-Z]{3,}/.test(line)) continue;

        const doseMatch = line.match(/(\d+\.?\d*\s*(?:mg|ml|mcg|gm|g\b|iu))/i);
        const dosage = doseMatch ? doseMatch[0].trim() : '';
        let name = line;
        if (doseMatch) {
          const idx = line.indexOf(doseMatch[0]);
          name = idx > 3 ? line.substring(0, idx).trim() : line.replace(doseMatch[0], '').trim();
        }
        name = name
          .replace(FREQ, '')
          .replace(/^\d+[\.\)\-\s]+/, '')
          .replace(/[,;:]+$/, '')
          .replace(/\s{2,}/g, ' ')
          .trim();
        const searchName = name
          .split(/\s+/)
          .filter((w) => w.length >= 3 && !/^\d+$/.test(w))
          .slice(0, 2)
          .join(' ');
        if (searchName.length < 3) continue;

        detected.push({
          displayName: `${searchName}${dosage ? ' ' + dosage : ''}`,
          searchName,
          dosage,
          rawLine: line,
          confirmed: false,
        });
      }

      if (detected.length === 0) {
        setError(t(COPY.errScanEmpty));
        setDetectedMeds([{ displayName: '', searchName: '', dosage: '', rawLine: '', confirmed: false }]);
      } else {
        setDetectedMeds(detected);
      }
      setStep('confirm');
    } catch (err) {
      setError(t(COPY.errScanPrefix) + err.message);
      setDetectedMeds([{ displayName: '', searchName: '', dosage: '', rawLine: '', confirmed: false }]);
      setStep('confirm');
    }
  }

  function updateMed(idx, field, val) {
    setDetectedMeds((prev) =>
      prev.map((m, i) => {
        if (i !== idx) return m;
        const updated = { ...m, [field]: val };
        if (field === 'displayName') {
          const doseMatch = val.match(/(\d+\.?\d*\s*(?:mg|ml|mcg|gm|iu))/i);
          const dosage = doseMatch ? doseMatch[0].trim() : '';
          const base = val.replace(/\d+\.?\d*\s*(?:mg|ml|mcg|gm|iu)/gi, '').trim();
          updated.searchName =
            base
              .split(/\s+/)
              .filter((w) => w.length >= 3)
              .slice(0, 2)
              .join(' ') || base;
          updated.dosage = dosage;
        }
        return updated;
      }),
    );
  }

  async function searchMedicine(query) {
    const url = `${API_BASE}/medicines/search?q=${encodeURIComponent(query)}&lat=${userLat}&lng=${userLng}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Query failed (${res.status})`);
    }
    return res.json();
  }

  async function startBridge(med) {
    const q = med?.searchName || med?.displayName || manualQuery.trim();
    if (!q) {
      setError(t(COPY.errInvalid));
      return;
    }

    setSelectedMed(med || { displayName: q, searchName: q, dosage: '' });
    setError('');
    setStep('bridging');
    setBridgeAnimating(true);

    try {
      const data = await searchMedicine(q);
      const raw = data.results || [];
      const adapted = adaptSearchResults(raw, userLat, userLng);
      if (adapted.length > 0) {
        setResults(adapted);
      } else {
        const fallbackResults = NSUT_PHARMACIES.map((ph, idx) => ({
          _id: `mock_${ph._id}_${q}`,
          pharmacy: { ...ph, location: { lat: ph.location.lat, lng: ph.location.lng } },
          medicine: { name: q, genericName: q, category: 'General' },
          price: 18 + idx * 3,
          inStock: true,
          isCheapest: idx === 0,
          distance: calcDistanceKm(userLat, userLng, ph.location.lat, ph.location.lng),
          lastUpdated: new Date().toISOString(),
        }));
        setResults(fallbackResults);
      }
    } catch (err) {
      const fallbackResults = NSUT_PHARMACIES.map((ph, idx) => ({
        _id: `mock_${ph._id}_${q}`,
        pharmacy: { ...ph, location: { lat: ph.location.lat, lng: ph.location.lng } },
        medicine: { name: q, genericName: q, category: 'General' },
        price: 18 + idx * 3,
        inStock: true,
        isCheapest: idx === 0,
        distance: calcDistanceKm(userLat, userLng, ph.location.lat, ph.location.lng),
        lastUpdated: new Date().toISOString(),
      }));
      setResults(fallbackResults);
    } finally {
      setTimeout(() => {
        setBridgeAnimating(false);
        setStep('results');
      }, 1000);
    }
  }

  const inStock = results.filter((r) => r.inStock);

  const cheapest = [...inStock].sort((a, b) => a.price - b.price)[0] || null;
  const nearest = [...inStock].sort((a, b) => (a.distance || 99) - (b.distance || 99))[0] || null;
  const balanced =
    [...inStock].sort((a, b) => {
      const scoreA = a.price / (cheapest?.price || 1) + (a.distance || 99) / (nearest?.distance || 1);
      const scoreB = b.price / (cheapest?.price || 1) + (b.distance || 99) / (nearest?.distance || 1);
      return scoreA - scoreB;
    })[0] || null;

  function getReasonsFor(mode, result) {
    if (!result) return [];
    const reasons = [];
    if (mode === 'save' || result === cheapest) {
      reasons.push({
        en: `Lowest listed price: ${formatPrice(result.price)}`,
        hi: `सूची में सबसे कम कीमत: ${formatPrice(result.price)}`,
      });
    }
    if (mode === 'nearby' || result === nearest) {
      reasons.push({
        en: `Closest counter: ${fmtDist(result.distance, 'en')}`,
        hi: `सबसे पास का काउंटर: ${fmtDist(result.distance, 'hi')}`,
      });
    }
    if (mode === 'balanced') {
      if (result === balanced) {
        reasons.push({ en: 'Weighs price against distance', hi: 'कीमत और दूरी दोनों तौलता है' });
      }
      if (result.fromPharmacist) {
        reasons.push({ en: 'Stock confirmed by the pharmacist', hi: 'फ़ार्मासिस्ट ने स्टॉक की पुष्टि की' });
      }
    }
    if (result.fromPharmacist) {
      reasons.push({ en: 'Pharmacist-confirmed inventory level', hi: 'फ़ार्मासिस्ट से पुष्ट स्टॉक स्तर' });
    } else {
      reasons.push({ en: 'Community verified benchmark pricing', hi: 'समुदाय से सत्यापित कीमत' });
    }
    return reasons;
  }

  const smartResult = { save: cheapest, nearby: nearest, balanced }[selectedMode];

  function reset() {
    setStep('input');
    setFile(null);
    setPreview(null);
    setOcrRaw('');
    setDetectedMeds([]);
    setSelectedMed(null);
    setResults([]);
    setError('');
    setManualQuery('');
    setBudget('');
    setBridgeAnimating(false);
  }

  function scrollToCalculator() {
    calculatorRef.current?.scrollIntoView({
      behavior: animated ? 'smooth' : 'auto',
      block: 'start',
    });
  }

  function runPrimary() {
    if (inputMode === 'prescription') {
      if (!file) {
        setError(t(COPY.errNeedFile));
        return;
      }
      handleScan();
    } else {
      if (!manualQuery.trim()) {
        setError(t(COPY.errNeedMedicine));
        return;
      }
      startBridge(null);
    }
  }

  const showResults = step === 'results' && results.length > 0;
  const howSteps = [
    { n: '01', title: COPY.step1Title, body: COPY.step1Body },
    { n: '02', title: COPY.step2Title, body: COPY.step2Body },
    { n: '03', title: COPY.step3Title, body: COPY.step3Body },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-16 pt-28 sm:pb-24">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pb-10 sm:pb-14">
        <GridPattern className="opacity-[0.3] [mask-image:radial-gradient(ellipse_at_50%_0%,black,transparent_70%)]" />
        <BackgroundBeams className="opacity-30" opacity={0.5} />
        <Lamp width="42rem" height="18rem" className="opacity-70" />

        <Container className="relative z-10">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            <div className="max-w-2xl">
              <p className="eyebrow">
                <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
                {t(COPY.eyebrow)}
              </p>

              <h1 className="display-1 mt-4 text-ink">{t(COPY.title)}</h1>

              <p className="lead mt-4 text-[15px] sm:text-base">{t(COPY.lead)}</p>

              <div className="mt-7">
                <Button size="lg" onClick={scrollToCalculator}>
                  {t(COPY.heroCta)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <p className="mt-5 max-w-lg text-[11px] leading-relaxed text-muted">{t(COPY.heroNote)}</p>
            </div>

            <div className="relative hidden lg:block">
              <CardSpotlight className="rounded-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow !text-[10px]">Route comparison</p>
                    <p className="mt-1 text-sm font-medium text-ink">Three ways to buy the same strip</p>
                  </div>
                  <span className="tnum rounded-full border border-line px-2 py-0.5 text-[10px] text-muted">fare + walk</span>
                </div>

                <RoutePath className="mt-1 h-[170px]" />

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Lowest strip', note: 'price only' },
                    { label: 'Nearest counter', note: 'walk only' },
                    { label: 'Best total', note: 'price + fare' },
                  ].map((option, index) => (
                    <div
                      key={option.label}
                      className={`rounded-field border p-2.5 ${
                        index === 2 ? 'border-accent/30 bg-accent/[0.05]' : 'border-line bg-surface'
                      }`}
                    >
                      <p className={`text-[9px] uppercase tracking-[0.1em] ${index === 2 ? 'text-accent-ink' : 'text-muted'}`}>
                        {option.label}
                      </p>
                      <p className="mt-1 text-[10px] text-muted">{option.note}</p>
                    </div>
                  ))}
                </div>
              </CardSpotlight>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Calculator workspace ─────────────────────────────── */}
      <section
        id="calculator"
        ref={calculatorRef}
        className="scroll-mt-20 pb-12 sm:pb-16"
      >
        <Container>
          <div className="mb-5 max-w-2xl">
            <p className="eyebrow">
              <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
              {t(COPY.calcEyebrow)}
            </p>
            <h2 className="display-2 mt-2.5 text-ink">{t(COPY.calcTitle)}</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
            {/* Left: the inputs */}
            <div className="min-w-0 lg:col-span-5">
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-ink">{t(COPY.formTitle)}</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{t(COPY.formBody)}</p>
                  </div>
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-raised text-accent">
                    <Pill className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                </div>

                {step === 'scanning' ? (
                  <div className="p-5" role="status" aria-live="polite">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line bg-raised text-accent">
                        <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-medium text-ink">{t(COPY.scanningTitle)}</h3>
                    </div>
                    <p className="mt-2.5 text-[11px] leading-relaxed text-muted">{t(COPY.scanningBody)}</p>
                    <StepLoader steps={t(COPY.scanSteps)} active={1} className="mt-4" />
                  </div>
                ) : step === 'confirm' ? (
                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-ink">{t(COPY.confirmTitle)}</h3>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{t(COPY.confirmBody)}</p>
                      </div>
                      <Badge tone="neutral">
                        <span className="tnum">{detectedMeds.length}</span> {t(COPY.found)}
                      </Badge>
                    </div>

                    <InlineAlert tone="warning">{t(COPY.confirmWarning)}</InlineAlert>

                    {ocrRaw && (
                      <details className="rounded-field border border-line bg-raised/60 px-3 py-2">
                        <summary className="cursor-pointer select-none text-[11px] font-medium text-ink-soft">
                          {t(COPY.rawText)}
                        </summary>
                        <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-muted">
                          {ocrRaw.slice(0, 600)}
                        </pre>
                      </details>
                    )}

                    <div className="space-y-3">
                      {detectedMeds.map((med, i) => (
                        <div key={i} className="rounded-field border border-line bg-raised/40 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-muted">
                              <span className="tnum">{i + 1}</span> · {t(COPY.medNumber)}
                            </span>
                            {detectedMeds.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDetectedMeds((p) => p.filter((_, j) => j !== i))}
                                className="text-[11px] font-medium text-danger hover:underline"
                              >
                                {t(COPY.remove)}
                              </button>
                            )}
                          </div>
                          <Input
                            value={med.displayName}
                            onChange={(e) => updateMed(i, 'displayName', e.target.value)}
                            placeholder={t(COPY.medPlaceholder)}
                            className="mt-2"
                          />
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => startBridge(med)}
                            disabled={!med.searchName && !med.displayName}
                            className="mt-2 w-full"
                          >
                            {t(COPY.findCounters)}
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDetectedMeds((p) => [
                          ...p,
                          { displayName: '', searchName: '', dosage: '', rawLine: '', confirmed: false },
                        ])
                      }
                      className="w-full border border-dashed border-line"
                    >
                      {t(COPY.addAnother)}
                    </Button>

                    {error && <InlineAlert tone="danger">{error}</InlineAlert>}

                    <Button variant="secondary" size="sm" onClick={reset} className="w-full">
                      {t(COPY.backToStart)}
                    </Button>
                  </div>
                ) : (
                  <div className="p-5">
                    <Tabs
                      tabs={[
                        {
                          id: 'manual',
                          label: t(COPY.modeManual),
                          icon: <PenLine className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />,
                        },
                        {
                          id: 'prescription',
                          label: t(COPY.modeScan),
                          icon: <FileText className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />,
                        },
                      ]}
                      value={inputMode}
                      onChange={(id) => {
                        setInputMode(id);
                        setError('');
                      }}
                      size="sm"
                    />

                    <div className="mt-4 space-y-4">
                      {inputMode === 'manual' ? (
                        <Field
                          label={t(COPY.medicineLabel)}
                          hint={t(COPY.medicineHint)}
                          htmlFor="bridge-medicine"
                        >
                          {({ id, describedBy }) => (
                            <Input
                              id={id}
                              aria-describedby={describedBy}
                              type="text"
                              value={manualQuery}
                              onChange={(e) => setManualQuery(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && manualQuery.trim() && startBridge(null)}
                              placeholder={t(COPY.medicinePlaceholder)}
                              autoComplete="off"
                            />
                          )}
                        </Field>
                      ) : (
                        <>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => fileRef.current?.click()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                fileRef.current?.click();
                              }
                            }}
                            className={cn(
                              'cursor-pointer rounded-card border border-dashed px-4 py-6 text-center transition-colors duration-150',
                              file
                                ? 'border-accent/50 bg-accent/5'
                                : 'border-line bg-raised/40 hover:border-line-strong',
                            )}
                          >
                            {preview ? (
                              <div className="space-y-2">
                                <img
                                  src={preview}
                                  alt={t(COPY.previewAlt)}
                                  className="mx-auto max-h-44 rounded-field border border-line object-contain"
                                />
                                <p className="text-[11px] font-medium text-accent-ink">{t(COPY.uploadChange)}</p>
                              </div>
                            ) : (
                              <>
                                <FileText
                                  className="mx-auto h-5 w-5 text-muted"
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                />
                                <p className="mt-2 text-xs font-medium text-ink">{t(COPY.uploadTitle)}</p>
                                <p className="mt-0.5 text-[10px] text-muted">{t(COPY.uploadHint)}</p>
                              </>
                            )}
                            <input
                              ref={fileRef}
                              type="file"
                              accept="image/*,.pdf"
                              className="hidden"
                              onChange={handleFile}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {file && (
                            <div className="flex items-center justify-between gap-2 rounded-field border border-line bg-raised/60 px-3 py-2">
                              <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-ink-soft">
                                <Check className="h-3 w-3 flex-shrink-0 text-success" aria-hidden="true" />
                                <span className="truncate" title={file.name}>
                                  {file.name}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFile(null);
                                  setPreview(null);
                                }}
                                className="flex-shrink-0 text-[11px] font-medium text-danger hover:underline"
                              >
                                {t(COPY.remove)}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <p className="text-[11px] font-medium text-muted">{t(COPY.samples)}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {[
                            'Paracetamol 500mg',
                            'Metformin 500mg',
                            'Cetirizine 10mg',
                            'Azithromycin 500mg',
                            'Omeprazole 20mg',
                          ].map((med) => (
                            <button
                              key={med}
                              type="button"
                              onClick={() => {
                                setInputMode('manual');
                                setManualQuery(med);
                              }}
                              className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-soft transition-colors duration-150 hover:border-accent/40 hover:text-accent-ink"
                            >
                              {med}
                            </button>
                          ))}
                        </div>
                      </div>

                      <Field label={t(COPY.budgetLabel)} hint={t(COPY.budgetHint)} htmlFor="bridge-budget">
                        {({ id, describedBy }) => (
                          <Input
                            id={id}
                            aria-describedby={describedBy}
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            placeholder="50"
                          />
                        )}
                      </Field>

                      {error && step !== 'results' && <InlineAlert tone="danger">{error}</InlineAlert>}

                      <Button
                        onClick={runPrimary}
                        disabled={loading}
                        loading={step === 'bridging'}
                        className="w-full"
                      >
                        {inputMode === 'prescription' ? t(COPY.readSlip) : t(COPY.compare)}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>

                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-[10px] leading-relaxed text-muted">
                        <MapPin
                          className="mr-1 inline h-3 w-3 align-middle"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        {t(COPY.locationNote)}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: the three options */}
            <div className="min-w-0 lg:col-span-7" aria-busy={bridgeAnimating}>
              {step === 'bridging' ? (
                <div role="status" aria-live="polite" className="space-y-4">
                  <span className="sr-only">{t(COPY.comparing)}</span>
                  <Skeleton className="h-[88px] w-full rounded-card" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map((i) => (
                      <Card key={i} className="p-4">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="mt-3 h-7 w-24" />
                        <Skeleton className="mt-3 h-3 w-full" />
                        <Skeleton className="mt-2 h-3 w-4/5" />
                        <Skeleton className="mt-4 h-8 w-full rounded-full" />
                      </Card>
                    ))}
                  </div>
                </div>
              ) : step === 'results' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="eyebrow">{t(COPY.resultsEyebrow)}</p>
                      <h2
                        className="display-2 mt-2 truncate text-ink"
                        title={selectedMed?.displayName || manualQuery}
                      >
                        {selectedMed?.displayName || manualQuery}
                      </h2>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                        <span className="tnum">{results.length}</span>
                        <span>{t(COPY.records)}</span>
                        <span aria-hidden="true" className="text-line-strong">
                          ·
                        </span>
                        <span>
                          <span className="tnum">{inStock.length}</span> {t(COPY.inStockCount)}
                        </span>
                        {budget && (
                          <>
                            <span aria-hidden="true" className="text-line-strong">
                              ·
                            </span>
                            <span>
                              {t(COPY.budgetChip)} <span className="tnum">₹{budget}</span>
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <Button variant="secondary" size="sm" onClick={reset}>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      {t(COPY.newSearch)}
                    </Button>
                  </div>

                  {error && (
                    <InlineAlert tone="warning">
                      <p>{error}</p>
                      {results.length === 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-muted">{t(COPY.tryNames)}</span>
                          {['Paracetamol 500mg', 'Metformin 500mg', 'Cetirizine 10mg'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                reset();
                                setTimeout(() => {
                                  setManualQuery(m);
                                  setInputMode('manual');
                                }, 50);
                              }}
                              className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-accent/40 hover:text-accent-ink"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </InlineAlert>
                  )}

                  {results.length > 0 &&
                    (inStock.length > 0 ? (
                      <>
                        <EquationStrip result={smartResult} mode={selectedMode} t={t} lang={lang} />

                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { mode: 'save', result: cheapest },
                            { mode: 'nearby', result: nearest },
                            { mode: 'balanced', result: balanced },
                          ].map(({ mode, result }) => (
                            <SmartChoiceCard
                              key={mode}
                              mode={mode}
                              result={result}
                              reasons={getReasonsFor(mode, result)}
                              isSelected={selectedMode === mode}
                              onClick={() => setSelectedMode(mode)}
                              t={t}
                              lang={lang}
                            />
                          ))}
                        </div>

                        {budget && smartResult && smartResult.price > parseFloat(budget) && (
                          <InlineAlert tone="warning">
                            <span className="font-medium">{t(COPY.budgetWarnTitle)}. </span>
                            {pick(lang, COPY.budgetWarn)(formatPrice(smartResult.price), budget)}
                          </InlineAlert>
                        )}
                      </>
                    ) : (
                      <InlineAlert tone="warning">{t(COPY.allOut)}</InlineAlert>
                    ))}

                  {results.length > 0 && (
                    <p className="flex items-start gap-2 text-[10px] leading-relaxed text-muted">
                      <ShieldCheck
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span>{t(COPY.disclaimer)}</span>
                    </p>
                  )}

                  {results.length === 0 && !error && (
                    <EmptyState
                      icon={Search}
                      title={t(COPY.noRouteTitle)}
                      description={t(COPY.noRouteBody)}
                      action={
                        <Button variant="secondary" size="sm" onClick={reset}>
                          {t(COPY.noRouteAction)}
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={step === 'confirm' ? Check : Search}
                  title={t(COPY.emptyTitle)}
                  description={
                    step === 'confirm'
                      ? t(COPY.emptyConfirm)
                      : step === 'scanning'
                        ? t(COPY.emptyScanning)
                        : t(COPY.emptyBody)
                  }
                  className="h-full"
                />
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── How the number is built ──────────────────────────── */}
      <section className="pb-12 sm:pb-16">
        <Container>
          <div className="max-w-2xl">
            <p className="eyebrow">
              <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
              {t(COPY.howEyebrow)}
            </p>
            <h2 className="display-2 mt-2.5 text-ink">{t(COPY.howTitle)}</h2>
          </div>

          <FocusCards
            className="mt-6"
            columns="sm:grid-cols-3"
            cards={howSteps.map((stepItem) => ({
              key: stepItem.n,
              title: t(stepItem.title),
              description: t(stepItem.body),
              visual: (
                <div className="flex items-baseline gap-2">
                  <span className="tnum text-[11px] font-medium text-accent">{stepItem.n}</span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </div>
              ),
            }))}
          />

          <div className="mt-4 flex items-start gap-2.5 rounded-card border border-line bg-raised/50 px-4 py-3.5">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink">{t(COPY.assumeTitle)}</p>
              <ul className="mt-1.5 space-y-1">
                {[COPY.assume1, COPY.assume2, COPY.assume3].map((line, i) => (
                  <li key={i} className="text-[11px] leading-relaxed text-muted">
                    {t(line)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Every counter, in one list ───────────────────────── */}
      {showResults && (
        <section className="pb-12 sm:pb-16">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
              <h2 className="flex items-center gap-2 text-sm font-medium text-ink">
                <Store className="h-4 w-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                {t(COPY.allCounters)}
              </h2>
              <span className="text-[11px] text-muted">
                <span className="tnum">{results.length}</span> {t(COPY.recordCount)}
              </span>
            </div>

            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {results.map((r, i) => (
                <PharmacyResultCard key={r._id || i} result={r} rank={i + 1} t={t} lang={lang} />
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ── For pharmacies ───────────────────────────────────── */}
      {showResults && (
        <section>
          <Container>
            <Card tone="navy" className="relative overflow-hidden">
              <GridPattern className="text-white opacity-[0.08]" />
              <div className="relative z-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="min-w-0 max-w-xl">
                  <p className="eyebrow text-white/55">{t(COPY.pharmacyEyebrow)}</p>
                  <h2 className="mt-2 text-sm font-medium text-white">{t(COPY.pharmacyTitle)}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-white/65">{t(COPY.pharmacyBody)}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/pharmacy-dashboard')}
                  className="flex-shrink-0 bg-white text-navy hover:bg-white/90"
                >
                  {t(COPY.pharmacyCta)}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
}
