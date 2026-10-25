// frontend/src/pages/SubmitPricePage.jsx — contribute one verified price
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  MapPin,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { formatDistance, formatPrice, pick } from '../lib/format';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '../components/ui/card';
import { Field, Input } from '../components/ui/input';
import { Container, PageHeader } from '../components/ui/section';
import { GridPattern } from '../components/ui/grid-pattern';
import { Switch } from '../components/ui/switch';
import { API_BASE } from '../lib/api';

/** Matches the audit earn rate published on the MediPoints page. */
const EARN_POINTS = 20;

const COPY = {
  eyebrow: { en: 'Contribute a price', hi: 'कीमत बताएँ' },
  title: { en: 'What did you pay?', hi: 'आपने कितने में खरीदा?' },
  lead: {
    en: 'A photo of the bill and the price you paid keeps the index honest.',
    hi: 'बिल की तस्वीर और आपकी चुकाई कीमत — इसी से सूची सही रहती है।',
  },
  formTitle: { en: 'Price entry', hi: 'कीमत की प्रविष्टि' },
  formNote: { en: '* marks a required field.', hi: '* वाले फ़ील्ड भरना ज़रूरी है।' },

  medicineTitle: { en: 'Medicine', hi: 'दवा' },
  medicineLabel: { en: 'Name and strength', hi: 'नाम और ताकत' },
  medicineHint: {
    en: 'Copy it from the strip, for example Paracetamol 500 mg.',
    hi: 'पत्ती पर जो लिखा है वही भरें, जैसे Paracetamol 500 mg।',
  },
  medicinePlaceholder: { en: 'e.g. Paracetamol 500 mg', hi: 'जैसे Paracetamol 500 mg' },

  priceLabel: { en: 'Price paid', hi: 'चुकाई कीमत' },
  priceHint: {
    en: 'What the counter charged for one strip or pack.',
    hi: 'काउंटर ने एक पत्ती या पैक के कितने पैसे लिए।',
  },

  pharmacyTitle: { en: 'Pharmacy', hi: 'फार्मेसी' },
  pharmacyLabel: { en: 'Search the directory', hi: 'निर्देशिका में खोजें' },
  pharmacyHint: {
    en: 'Two letters are enough. Results come from listed pharmacies only.',
    hi: 'दो अक्षर काफ़ी हैं। नतीजे सिर्फ़ सूचीबद्ध फार्मेसियों से आते हैं।',
  },
  pharmacyPlaceholder: {
    en: 'Pharmacy name in Dwarka or Delhi',
    hi: 'द्वारका या दिल्ली में फार्मेसी का नाम',
  },
  pharmacySearching: { en: 'Searching…', hi: 'खोज रहे हैं…' },
  pharmacyEmpty: {
    en: 'No listed pharmacy matches that name.',
    hi: 'इस नाम से कोई सूचीबद्ध फार्मेसी नहीं मिली।',
  },
  verified: { en: 'Verified', hi: 'सत्यापित' },
  clearPharmacy: { en: 'Clear the selected pharmacy', hi: 'चुनी हुई फार्मेसी हटाएँ' },
  notListed: { en: 'This pharmacy is not on MediMap', hi: 'यह फार्मेसी MediMap पर नहीं है' },
  newTitle: { en: 'New pharmacy details', hi: 'नई फार्मेसी का विवरण' },
  newNameLabel: { en: 'Pharmacy name', hi: 'फार्मेसी का नाम' },
  newNamePlaceholder: { en: 'e.g. Gupta Medical Store', hi: 'जैसे गुप्ता मेडिकल स्टोर' },
  newAddressLabel: { en: 'Address', hi: 'पता' },
  newAddressPlaceholder: { en: 'e.g. Dwarka Sector 3', hi: 'जैसे द्वारका सेक्टर 3' },

  stockTitle: { en: 'Stock', hi: 'स्टॉक' },
  stockOn: { en: 'In stock', hi: 'स्टॉक में उपलब्ध' },
  stockOff: { en: 'Out of stock', hi: 'स्टॉक में नहीं' },
  stockHint: {
    en: 'Whether the pharmacy had it on the day you bought it.',
    hi: 'जिस दिन आपने खरीदा, तब दवा फार्मेसी में थी या नहीं।',
  },

  billTitle: { en: 'Bill photo', hi: 'बिल की तस्वीर' },
  optional: { en: 'Optional', hi: 'वैकल्पिक' },
  billChoose: { en: 'Choose a photo or PDF of the bill', hi: 'बिल की तस्वीर या PDF चुनें' },
  billReplace: { en: 'Choose a different file', hi: 'दूसरी फ़ाइल चुनें' },
  billHint: { en: 'JPG, PNG or PDF, up to 10 MB.', hi: 'JPG, PNG या PDF, 10 MB तक।' },
  billPreviewAlt: { en: 'Preview of the uploaded bill', hi: 'अपलोड किए गए बिल की झलक' },
  billRemove: { en: 'Remove', hi: 'हटाएँ' },
  billScan: { en: 'Read the bill with OCR', hi: 'OCR से बिल पढ़ें' },
  billScanning: { en: 'Reading the bill…', hi: 'बिल पढ़ा जा रहा है…' },
  billExtracted: {
    en: 'Bill details extracted. Check the fields below.',
    hi: 'बिल से जानकारी निकल आई। नीचे के फ़ील्ड जाँच लें।',
  },
  billSkip: { en: 'Skip the bill and type the details', hi: 'बिल छोड़ें और जानकारी खुद भरें' },

  submit: { en: 'Submit price', hi: 'कीमत जमा करें' },
  submitting: { en: 'Sending for verification…', hi: 'सत्यापन के लिए भेजा जा रहा है…' },
  submitNote: {
    en: 'An entry is published only after the bill matches the pharmacy record.',
    hi: 'बिल फार्मेसी के रिकॉर्ड से मिलने के बाद ही प्रविष्टि प्रकाशित होती है।',
  },

  railTitle: { en: 'What counts as a valid entry', hi: 'कौन-सी प्रविष्टि मान्य है' },
  railRules: {
    en: [
      'The bill shows the medicine name, the pack size and the amount charged.',
      'The pharmacy is the counter where you paid, not one nearby.',
      'One entry per bill. Duplicate entries for the same bill are not counted.',
    ],
    hi: [
      'बिल पर दवा का नाम, पैक का आकार और लिया गया दाम होना चाहिए।',
      'फार्मेसी वही काउंटर हो जहाँ आपने भुगतान किया, पास की दूसरी दुकान नहीं।',
      'एक बिल पर एक ही प्रविष्टि। उसी बिल की दोहरी प्रविष्टियाँ नहीं गिनी जाती हैं।',
    ],
  },
  railPrivacyTitle: { en: 'Bill image', hi: 'बिल की तस्वीर' },
  railPrivacy: {
    en: 'Kept for verification only. It is not shown on the medicine page, and your name is not attached to the price.',
    hi: 'सिर्फ़ सत्यापन के लिए रखी जाती है। दवा के पेज पर नहीं दिखती, और कीमत के साथ आपका नाम नहीं जुड़ता।',
  },
  railPointsTitle: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' },
  railPointsNote: { en: 'per audited receipt', hi: 'हर सत्यापित रसीद पर' },
  railPointsLink: { en: 'How points work', hi: 'पॉइंट्स कैसे मिलते हैं' },

  successEyebrow: { en: 'Contribute a price', hi: 'कीमत बताएँ' },
  successTitle: { en: 'Entry sent for verification', hi: 'प्रविष्टि सत्यापन के लिए भेज दी गई' },
  successAgain: { en: 'Submit another entry', hi: 'एक और प्रविष्टि जमा करें' },
  successPoints: { en: 'View MediPoints', hi: 'मेडीपॉइंट्स देखें' },
  successHome: { en: 'Back to home', hi: 'होम पर वापस' },
};

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SubmitPricePage() {
  const { lang } = useLang();
  const fileRef = useRef(null);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('medimap_user') || 'null');

  // Form state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  // Pharmacy search state
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [pharmacyResults, setPharmacyResults] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [pharmacyDropdownOpen, setPharmacyDropdownOpen] = useState(false);
  const [pharmacySearching, setPharmacySearching] = useState(false);
  const [isNewPharmacy, setIsNewPharmacy] = useState(false);
  const [newPharmacyData, setNewPharmacyData] = useState({ name: '', address: '', phone: '', city: '' });

  const debouncedPharmacySearch = useDebounce(pharmacySearch, 300);

  // Form fields
  const [form, setForm] = useState({ medicineName: '', price: '', inStock: true, personalNote: '' });

  // Geolocation
  const [userCoords, setUserCoords] = useState(null);
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Pharmacy search API
  useEffect(() => {
    if (!debouncedPharmacySearch.trim() || debouncedPharmacySearch.length < 2) {
      setPharmacyResults([]); return;
    }
    setPharmacySearching(true);
    const params = new URLSearchParams({ q: debouncedPharmacySearch, limit: 8 });
    if (userCoords) { params.set('lat', userCoords.lat); params.set('lng', userCoords.lng); }

    fetch(`${API_BASE}/pharmacy-search?${params}`)
      .then(r => r.json())
      .then(data => setPharmacyResults(data.pharmacies || []))
      .catch(() => setPharmacyResults([]))
      .finally(() => setPharmacySearching(false));
  }, [debouncedPharmacySearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setPharmacyDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const t = (pair) => pick(lang, pair);

  function selectPharmacy(pharmacy) {
    setSelectedPharmacy(pharmacy);
    setPharmacySearch(pharmacy.name);
    setPharmacyDropdownOpen(false);
    setIsNewPharmacy(false);
  }

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setScanned(false);
    setError('');
    if (f.type.startsWith('image/')) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setScanned(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleScan() {
    if (!file) return;
    setScanning(true); setError('');
    try {
      const fd = new FormData(); fd.append('prescription', file);
      const res = await fetch(`${API_BASE}/prescription/scan`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const meds = data.medicines || [];
      if (meds.length > 0) {
        setForm(prev => ({
          ...prev,
          medicineName: meds[0].name || prev.medicineName,
          price: meds[0].price || prev.price,
        }));
        if (meds.length > 1) {
          setError(
            lang === 'hi'
              ? `${meds.length} फ़ॉर्मूलेशन मिले: ${meds.map(m => m.name).join(', ')}। पहला भर दिया गया है।`
              : `${meds.length} formulations found: ${meds.map(m => m.name).join(', ')}. The first one is filled in.`
          );
        }
      }
      setScanned(true);
      setStep(2);
    } catch (err) {
      setError(
        lang === 'hi'
          ? `OCR इस बिल को पढ़ नहीं सका: ${err.message}। दवा की जानकारी खुद भरें।`
          : `OCR could not read this bill: ${err.message}. Enter the formulation yourself.`
      );
      setScanned(true);
      setStep(2);
    }
    setScanning(false);
  }

  async function handleSubmit() {
    if (!form.medicineName.trim()) return setError(lang === 'hi' ? 'दवा का नाम लिखें।' : 'Enter the medicine name.');
    if (!form.price || parseFloat(form.price) <= 0) return setError(lang === 'hi' ? 'शून्य से अधिक कीमत लिखें।' : 'Enter a price above zero.');
    if (!selectedPharmacy && !isNewPharmacy) return setError(lang === 'hi' ? 'सूची से फार्मेसी चुनें या नई जोड़ें।' : 'Choose a listed pharmacy or add a new one.');
    if (isNewPharmacy && !newPharmacyData.name.trim()) return setError(lang === 'hi' ? 'नई फार्मेसी का नाम लिखें।' : 'Enter the new pharmacy name.');

    setSubmitting(true); setError('');
    try {
      const fd = new FormData();
      fd.append('medicineName', form.medicineName.trim());
      fd.append('price', form.price);
      fd.append('inStock', form.inStock);
      fd.append('personalNote', form.personalNote);
      fd.append('userName', user?.name || 'Anonymous');
      fd.append('userId', user?.email || 'anonymous');
      fd.append('userEmail', user?.email || '');

      if (selectedPharmacy) {
        fd.append('pharmacyId', selectedPharmacy.id);
        fd.append('pharmacyName', selectedPharmacy.name);
      } else {
        fd.append('isNewPharmacy', 'true');
        fd.append('pharmacyName', newPharmacyData.name);
        fd.append('newPharmacyData', JSON.stringify(newPharmacyData));
      }

      if (file) fd.append('billImage', file);

      const res = await fetch(`${API_BASE}/requests`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubmitted(true);
    } catch (err) {
      setError(lang === 'hi' ? `जमा नहीं हो सका: ${err.message}` : `Could not submit: ${err.message}`);
    }
    setSubmitting(false);
  }

  function resetForm() {
    setSubmitted(false); setFile(null); setPreview(null); setScanned(false);
    setSelectedPharmacy(null); setPharmacySearch(''); setIsNewPharmacy(false);
    setForm({ medicineName: '', price: '', inStock: true, personalNote: '' });
    setStep(1);
  }

  const rules = t(COPY.railRules);

  // Sent for verification
  if (submitted) {
    return (
      <div className="bg-canvas pb-16">
        <PageHeader eyebrow={t(COPY.successEyebrow)} title={t(COPY.successTitle)} />
        <Container className="py-8 sm:py-10">
          <Card tone="raised" className="mx-auto max-w-xl">
            <CardBody className="space-y-5 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-success/25 bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-ink-soft">
                {lang === 'hi' ? (
                  <>
                    <span className="font-medium text-ink">{form.medicineName}</span> की{' '}
                    <span className="tnum font-medium text-ink">{formatPrice(form.price)}</span> कीमत सत्यापन के लिए भेज दी गई है।
                  </>
                ) : (
                  <>
                    The price of <span className="tnum font-medium text-ink">{formatPrice(form.price)}</span> for{' '}
                    <span className="font-medium text-ink">{form.medicineName}</span> is queued for verification.
                  </>
                )}
              </p>
              <p className="mx-auto flex max-w-md items-start gap-1.5 rounded-field border border-success/25 bg-success/10 px-3 py-2 text-left text-[11px] font-medium leading-relaxed text-success">
                <Sparkles className="mt-px h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  {lang === 'hi'
                    ? `सत्यापन पूरा होने पर +${EARN_POINTS} मेडीपॉइंट्स मिलेंगे।`
                    : `+${EARN_POINTS} MediPoints when the audit is confirmed.`}
                </span>
              </p>
            </CardBody>
            <CardFooter className="flex-col items-stretch gap-2 px-6 py-4 sm:flex-row">
              <Button to="/points" className="w-full sm:flex-1">
                {t(COPY.successPoints)}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </Button>
              <Button variant="secondary" onClick={resetForm} className="w-full sm:flex-1">
                {t(COPY.successAgain)}
              </Button>
            </CardFooter>
          </Card>
          <p className="mt-4 text-center">
            <Link to="/" className="link-quiet !text-[11px]">
              {t(COPY.successHome)}
            </Link>
          </p>
        </Container>
      </div>
    );
  }

  const showPharmacyPanel = pharmacyDropdownOpen && pharmacySearch.trim().length >= 2 && !selectedPharmacy;

  return (
    <div className="bg-canvas pb-16">
      <PageHeader eyebrow={t(COPY.eyebrow)} title={t(COPY.title)} description={t(COPY.lead)} />

      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
          <div className="min-w-0">
            <Card tone="raised" data-step={step}>
              <CardHeader className="flex-col items-start gap-1 p-5 pb-0 sm:p-6 sm:pb-0">
                <h2 className="display-3 text-ink">{t(COPY.formTitle)}</h2>
                <p className="text-[11px] text-muted">{t(COPY.formNote)}</p>
              </CardHeader>

              <CardBody className="mt-5 divide-y divide-line p-0">
                <Group title={t(COPY.medicineTitle)} className="p-5 sm:p-6">
                  <Field label={t(COPY.medicineLabel)} hint={t(COPY.medicineHint)} required htmlFor="medicine-name">
                    <Input
                      id="medicine-name"
                      value={form.medicineName}
                      onChange={e => setForm({ ...form, medicineName: e.target.value })}
                      placeholder={t(COPY.medicinePlaceholder)}
                      autoComplete="off"
                    />
                  </Field>

                  <Field label={t(COPY.priceLabel)} hint={t(COPY.priceHint)} required htmlFor="price-paid">
                    <div className="relative">
                      <span
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted"
                        aria-hidden="true"
                      >
                        ₹
                      </span>
                      <Input
                        id="price-paid"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        className="tnum pl-8"
                      />
                    </div>
                  </Field>
                </Group>

                <Group title={t(COPY.pharmacyTitle)} className="p-5 sm:p-6">
                  <Switch
                    id="not-listed"
                    checked={isNewPharmacy}
                    onChange={(next) => {
                      setIsNewPharmacy(next);
                      setSelectedPharmacy(null);
                      setPharmacySearch('');
                    }}
                    label={t(COPY.notListed)}
                  />

                  {!isNewPharmacy ? (
                    <div ref={dropdownRef} className="relative">
                      <Field
                        label={t(COPY.pharmacyLabel)}
                        hint={t(COPY.pharmacyHint)}
                        required
                        htmlFor="pharmacy-search"
                      >
                        <div className="relative">
                          <Search
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <Input
                            id="pharmacy-search"
                            className="pl-9"
                            role="combobox"
                            aria-expanded={showPharmacyPanel}
                            aria-controls="pharmacy-results"
                            aria-autocomplete="list"
                            autoComplete="off"
                            placeholder={t(COPY.pharmacyPlaceholder)}
                            value={pharmacySearch}
                            onChange={e => {
                              setPharmacySearch(e.target.value);
                              setSelectedPharmacy(null);
                              setPharmacyDropdownOpen(true);
                            }}
                            onFocus={() => setPharmacyDropdownOpen(true)}
                          />
                        </div>
                      </Field>

                      {showPharmacyPanel && (
                        <div
                          id="pharmacy-results"
                          role="listbox"
                          aria-label={t(COPY.pharmacyLabel)}
                          aria-busy={pharmacySearching}
                          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-field border border-line bg-surface shadow-float"
                        >
                          {pharmacySearching ? (
                            <p className="px-3.5 py-3 text-xs text-muted">{t(COPY.pharmacySearching)}</p>
                          ) : pharmacyResults.length === 0 ? (
                            <p className="px-3.5 py-3 text-xs text-muted">{t(COPY.pharmacyEmpty)}</p>
                          ) : (
                            pharmacyResults.map(ph => (
                              <button
                                key={ph.id}
                                type="button"
                                role="option"
                                aria-selected={false}
                                onClick={() => selectPharmacy(ph)}
                                className="flex w-full items-start gap-3 border-b border-line px-3.5 py-3 text-left transition-colors last:border-b-0 hover:bg-raised focus-visible:bg-raised"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-medium text-ink" title={ph.name}>{ph.name}</span>
                                    {ph.isVerified && <Badge tone="success">{t(COPY.verified)}</Badge>}
                                  </span>
                                  <span className="block truncate text-[11px] text-muted" title={ph.address}>{ph.address}</span>
                                  {ph.distanceKm && (
                                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted tnum">
                                      <MapPin className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                                      {formatDistance(ph.distanceKm, lang)}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}

                      {selectedPharmacy && (
                        <div className="mt-3 flex items-center gap-3 rounded-field border border-success/25 bg-success/10 p-3">
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface text-success">
                            <Check className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-ink" title={selectedPharmacy.name}>
                              {selectedPharmacy.name}
                            </p>
                            <p className="truncate text-[11px] text-muted" title={selectedPharmacy.address}>
                              {selectedPharmacy.address}
                            </p>
                          </div>
                          <IconButton
                            aria-label={t(COPY.clearPharmacy)}
                            onClick={() => { setSelectedPharmacy(null); setPharmacySearch(''); }}
                          >
                            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                          </IconButton>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-field bg-raised/60 p-4">
                      <p className="text-xs font-medium text-ink">{t(COPY.newTitle)}</p>
                      <Field label={t(COPY.newNameLabel)} required htmlFor="new-pharmacy-name">
                        <Input
                          id="new-pharmacy-name"
                          placeholder={t(COPY.newNamePlaceholder)}
                          value={newPharmacyData.name}
                          onChange={e => setNewPharmacyData({ ...newPharmacyData, name: e.target.value })}
                        />
                      </Field>
                      <Field label={t(COPY.newAddressLabel)} htmlFor="new-pharmacy-address">
                        <Input
                          id="new-pharmacy-address"
                          placeholder={t(COPY.newAddressPlaceholder)}
                          value={newPharmacyData.address}
                          onChange={e => setNewPharmacyData({ ...newPharmacyData, address: e.target.value })}
                        />
                      </Field>
                    </div>
                  )}
                </Group>

                <Group title={t(COPY.stockTitle)} className="p-5 sm:p-6">
                  <Switch
                    id="in-stock"
                    checked={form.inStock}
                    onChange={(next) => setForm({ ...form, inStock: next })}
                    label={form.inStock ? t(COPY.stockOn) : t(COPY.stockOff)}
                    description={t(COPY.stockHint)}
                  />
                </Group>

                <Group
                  title={t(COPY.billTitle)}
                  className="p-5 sm:p-6"
                  note={<Badge tone="neutral">{t(COPY.optional)}</Badge>}
                >
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    aria-label={file ? t(COPY.billReplace) : t(COPY.billChoose)}
                    className="relative block w-full overflow-hidden rounded-field border-2 border-dashed border-line-strong/50 bg-raised/40 px-4 py-5 text-center transition-colors duration-150 hover:border-accent/50 hover:bg-raised/70"
                  >
                    <GridPattern className="opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
                    {preview ? (
                      <img
                        src={preview}
                        alt={t(COPY.billPreviewAlt)}
                        className="mx-auto max-h-52 w-auto rounded-field object-contain"
                      />
                    ) : (
                      <>
                        <span className="relative mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-accent">
                          {file ? (
                            <FileText className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <Upload className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                          )}
                        </span>
                        <span className="relative block truncate text-xs font-medium text-ink">
                          {file ? file.name : t(COPY.billChoose)}
                        </span>
                        <span className="relative mt-1 block text-[11px] text-muted">{t(COPY.billHint)}</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFile}
                    className="hidden"
                  />

                  {file && (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                        <FileText className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                        <span className="truncate" title={file.name}>{file.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                        {t(COPY.billRemove)}
                      </button>
                    </div>
                  )}

                  {file && !scanned && (
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={handleScan}
                      loading={scanning}
                    >
                      <ScanLine className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      {scanning ? t(COPY.billScanning) : t(COPY.billScan)}
                    </Button>
                  )}

                  {scanned && (
                    <p role="status" className="flex items-start gap-1.5 text-[11px] font-medium leading-relaxed text-success">
                      <CheckCircle2 className="mt-px h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                      <span>{t(COPY.billExtracted)}</span>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex h-10 w-full items-center justify-center text-center text-[11px] font-medium text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {t(COPY.billSkip)}
                  </button>
                </Group>
              </CardBody>

              <CardFooter className="flex-col items-stretch gap-3">
                {error && (
                  <p
                    role="alert"
                    className="rounded-field border border-danger/25 bg-danger/10 px-3 py-2 text-[11px] font-medium leading-relaxed text-danger"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting || !form.medicineName || !form.price || (!selectedPharmacy && !isNewPharmacy)}
                >
                  {submitting ? t(COPY.submitting) : t(COPY.submit)}
                </Button>
                <p className="text-center text-[11px] text-muted">{t(COPY.submitNote)}</p>
              </CardFooter>
            </Card>
          </div>

          <aside className="min-w-0">
            <div className="lg:sticky lg:top-24">
              <Card tone="sunken">
                <CardBody className="p-5">
                  <h2 className="text-sm font-medium text-ink">{t(COPY.railTitle)}</h2>
                  <ul className="mt-3 space-y-2.5">
                    {rules.map((rule) => (
                      <li key={rule} className="flex gap-2.5">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success" strokeWidth={1.75} aria-hidden="true" />
                        <span className="text-xs leading-relaxed text-ink-soft">{rule}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 border-t border-line pt-4">
                    <p className="eyebrow">
                      <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {t(COPY.railPrivacyTitle)}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">{t(COPY.railPrivacy)}</p>
                  </div>

                  <div className="mt-4 border-t border-line pt-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="eyebrow">{t(COPY.railPointsTitle)}</p>
                      <span className="tnum text-sm font-medium text-ink">+{EARN_POINTS}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{t(COPY.railPointsNote)}</p>
                    <Link to="/points" className="link-quiet mt-2 !text-[11px]">
                      {t(COPY.railPointsLink)}
                      <ArrowRight className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </div>
                </CardBody>
              </Card>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function Group({ title, note, children, className }) {
  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="eyebrow">{title}</h3>
        {note}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
