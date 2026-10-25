// src/pages/PharmacyDetailPage.jsx — one pharmacy, one medicine, one price to check
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { NSUT_PHARMACIES, isFaridabad } from '../lib/pharmacyAdapter';
import { formatPrice, pick, timeAgo } from '../lib/format';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton, SkeletonText } from '../components/ui/skeleton';
import { Container } from '../components/ui/section';
import { PinContainer } from '../components/ui/pin';
import { StepLoader } from '../components/ui/step-loader';

const API_BASE = import.meta.env.VITE_API_URL || 'https://medimap-backend-ygqj.onrender.com/api';

const COPY = {
  open: { en: 'Open now', hi: 'अभी खुला है' },
  closed: { en: 'Closed', hi: 'बंद है' },
  verified: { en: 'Verified', hi: 'सत्यापित' },
  call: { en: 'Call', hi: 'कॉल करें' },
  directions: { en: 'Directions', hi: 'रास्ता' },
  callBefore: { en: 'Call the counter before you travel.', hi: 'निकलने से पहले काउंटर पर कॉल करें।' },
  medicine: { en: 'Medicine', hi: 'दवा' },
  noMedicine: { en: 'No medicine selected', hi: 'कोई दवा नहीं चुनी' },
  noMedicineBody: {
    en: 'Open this page from a price result to see the strip price here.',
    hi: 'कीमत के नतीजे से यह पेज खोलें, तभी यहाँ पत्ती की कीमत दिखेगी।',
  },
  priceHere: { en: 'Price at this pharmacy', hi: 'इस फार्मेसी पर कीमत' },
  perStrip: { en: 'per strip', hi: 'प्रति पत्ती' },
  lastUpdate: { en: 'Last update', hi: 'अंतिम अपडेट' },
  notReported: { en: 'Not reported', hi: 'नहीं बताया' },
  facts: { en: 'Pharmacy details', hi: 'फार्मेसी की जानकारी' },
  hours: { en: 'Hours', hi: 'समय' },
  phone: { en: 'Phone', hi: 'फ़ोन' },
  address: { en: 'Address', hi: 'पता' },
  license: { en: 'Drug licence', hi: 'दवा लाइसेंस' },
  openDaily: { en: 'Open daily', hi: 'रोज़ खुला' },
  stock: { en: 'Stock status', hi: 'स्टॉक की स्थिति' },
  stockIn: { en: 'In stock', hi: 'स्टॉक में है' },
  stockOut: { en: 'Out of stock', hi: 'स्टॉक में नहीं' },
  stockReported: { en: 'Reported by the pharmacy.', hi: 'फार्मेसी द्वारा बताया गया।' },
  stockUnknown: {
    en: 'This listing does not include a stock count. Call the counter to confirm before you travel.',
    hi: 'इस लिस्टिंग में स्टॉक की संख्या नहीं है। निकलने से पहले काउंटर पर कॉल करके पुष्टि करें।',
  },
  reportedPrice: { en: 'Reported price', hi: 'दर्ज कीमत' },
  price: { en: 'Strip price', hi: 'पत्ती की कीमत' },
  beforeTitle: { en: 'Before you travel', hi: 'निकलने से पहले' },
  beforeBody: {
    en: 'A listing is a starting point. Three checks at the counter save the trip.',
    hi: 'लिस्टिंग शुरुआत है। काउंटर पर तीन जांच यात्रा बचा लेती हैं।',
  },
  beforeSteps: {
    en: [
      'Call and confirm the strip is in stock.',
      'Ask for the generic name if you want the lower price.',
      'Check the expiry date and ask for a printed bill.',
    ],
    hi: [
      'कॉल करके पुष्टि करें कि पत्ती स्टॉक में है।',
      'कम कीमत के लिए जेनेरिक नाम पूछें।',
      'एक्सपायरी तारीख देखें और प्रिंट बिल मांगें।',
    ],
  },
  beforeFootnote: {
    en: 'This page does not store your searches.',
    hi: 'यह पेज आपकी खोजें सहेजता नहीं है।',
  },
  notFoundTitle: { en: 'Pharmacy not found', hi: 'फार्मेसी नहीं मिली' },
  notFoundBody: {
    en: 'The pharmacy record could not be loaded. The link may be old, or the pharmacy is no longer listed.',
    hi: 'फार्मेसी का रिकॉर्ड लोड नहीं हो सका। लिंक पुराना हो सकता है, या फार्मेसी अब सूची में नहीं है।',
  },
};

export default function PharmacyDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const medicineName = searchParams.get('medicine') || '';
  const currentPrice = Number(searchParams.get('price')) || 50;
  const { lang, t } = useLang();
  const tr = (pair) => pick(lang, pair);

  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false);
      setError(true);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(false);

    const localMatch = NSUT_PHARMACIES.find((p) => p._id === id || p.id === id);
    if (localMatch) {
      setPharmacy(localMatch);
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/pharmacies/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setPharmacy(isFaridabad(data) ? NSUT_PHARMACIES[0] : data);
          setLoading(false);
        }
      })
      .catch(() => {
        fetch(`${API_BASE}/pharmacies`)
          .then((res) => res.json())
          .then((list) => {
            if (isCancelled) return;
            const match = list.find((p) => p._id === id || p.id === id);
            if (match) {
              setPharmacy(match);
              setLoading(false);
            } else {
              setError(true);
              setLoading(false);
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setError(true);
              setLoading(false);
            }
          });
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-canvas">
        <Container className="pt-6 sm:pt-8">
          <Skeleton className="h-4 w-32" />

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
            <div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="mt-5 h-11 w-4/5" />
              <SkeletonText lines={2} className="mt-4 max-w-md" />
              <div className="mt-6 flex flex-wrap gap-2">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-60 rounded-panel" />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
            <Skeleton className="h-80 rounded-card" />
            <div className="space-y-4">
              <Skeleton className="h-44 rounded-card" />
              <Skeleton className="h-36 rounded-card" />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !pharmacy) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-canvas">
        <Container className="py-14 sm:py-20">
          <EmptyState
            icon={Store}
            title={tr(COPY.notFoundTitle)}
            description={tr(COPY.notFoundBody)}
            action={
              <Button to="/" variant="secondary">
                {t('backToHome')}
              </Button>
            }
            className="mx-auto max-w-xl"
          />
        </Container>
      </div>
    );
  }

  const contact = pharmacy.contact || pharmacy.phone || '';
  const licenseValue = pharmacy.license || pharmacy.licenseNumber || pharmacy.drugLicense || '';
  const license = typeof licenseValue === 'string' ? licenseValue : '';
  const isOpen = pharmacy.isOpen !== false;
  const stockKnown = typeof pharmacy.inStock === 'boolean';
  const inStock = pharmacy.inStock === true;
  const rawUpdated = pharmacy.lastUpdated || pharmacy.updatedAt;
  const lastUpdatedLabel = rawUpdated ? timeAgo(rawUpdated, lang) : '';
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(pharmacy.address)}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] overflow-x-hidden bg-canvas pb-20">
      <Container className="pt-6 sm:pt-8">
        <Link to={`/results?q=${encodeURIComponent(medicineName)}`} className="link-quiet !text-[13px]">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('backToResults')}
        </Link>

        {/* Hero: the pharmacy, the counter, and the price of this strip */}
        <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isOpen ? 'success' : 'danger'} dot>
                {isOpen ? tr(COPY.open) : tr(COPY.closed)}
              </Badge>
              {pharmacy.isVerified && (
                <Badge tone="accent">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr(COPY.verified)}
                </Badge>
              )}
            </div>

            <h1 className="display-1 mt-4 max-w-2xl text-ink">
              {pharmacy.pharmacyName || pharmacy.name}
            </h1>

            <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-muted">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="break-words">{pharmacy.address}</span>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {contact && (
                <Button href={`tel:${contact}`}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {tr(COPY.call)}
                </Button>
              )}
              <Button
                variant={contact ? 'secondary' : 'primary'}
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                {tr(COPY.directions)}
              </Button>
            </div>

            {contact && <p className="mt-3 text-[11px] text-muted">{tr(COPY.callBefore)}</p>}
          </div>

          {/* One pinned object: the strip and its price */}
          <div className="mx-auto w-full max-w-[360px] lg:mx-0 lg:ml-auto lg:max-w-none">
            <PinContainer title={tr(COPY.priceHere)}>
              <div className="w-full rounded-panel p-5">
                <p className="eyebrow">{tr(COPY.medicine)}</p>
                <h2 className="mt-1.5 text-base font-medium leading-snug text-ink">
                  {medicineName || tr(COPY.noMedicine)}
                </h2>

                {medicineName ? (
                  <>
                    <div className="mt-5 border-t border-line pt-4">
                      <p className="text-[11px] text-muted">{tr(COPY.priceHere)}</p>
                      <p className="tnum mt-1 text-[2.1rem] font-light leading-none tracking-[-0.035em] text-ink">
                        {formatPrice(currentPrice)}
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted">{tr(COPY.perStrip)}</p>
                    </div>

                    <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-muted">
                      <Clock3 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{tr(COPY.lastUpdate)}</span>
                      <span className="text-ink-soft">{lastUpdatedLabel || tr(COPY.notReported)}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-muted">{tr(COPY.noMedicineBody)}</p>
                )}
              </div>
            </PinContainer>
          </div>
        </div>

        {/* Chart and facts */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] lg:gap-8">
          <Card as="section" aria-labelledby="before-travel-title" className="overflow-hidden">
            <div className="border-b border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="before-travel-title" className="text-base font-medium tracking-[-0.015em] text-ink">
                    {tr(COPY.beforeTitle)}
                  </h2>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{tr(COPY.beforeBody)}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-1.5 w-4 rounded-full bg-accent" aria-hidden="true" />
                  {tr(COPY.reportedPrice)}
                </div>
              </div>
            </div>

            <div className="p-5">
              <StepLoader steps={tr(COPY.beforeSteps)} active={0} />
            </div>

            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">{tr(COPY.beforeFootnote)}</p>
          </Card>

          <div className="space-y-4">
            <Card as="section" aria-labelledby="pharmacy-facts" className="overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 id="pharmacy-facts" className="text-sm font-medium text-ink">
                  {tr(COPY.facts)}
                </h2>
              </div>

              <dl className="divide-y divide-line">
                <FactRow icon={Clock3} label={tr(COPY.hours)}>
                  {pharmacy.hours || tr(COPY.openDaily)}
                </FactRow>
                <FactRow icon={Phone} label={tr(COPY.phone)}>
                  {contact ? (
                    <a href={`tel:${contact}`} className="link-quiet tnum !text-[13px]">
                      {contact}
                    </a>
                  ) : (
                    tr(COPY.notReported)
                  )}
                </FactRow>
                <FactRow icon={MapPin} label={tr(COPY.address)}>
                  {pharmacy.address}
                </FactRow>
                {license && (
                  <FactRow icon={BadgeCheck} label={tr(COPY.license)}>
                    {license}
                  </FactRow>
                )}
              </dl>
            </Card>

            <Card as="section" aria-labelledby="stock-status" className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 id="stock-status" className="text-sm font-medium text-ink">
                  {tr(COPY.stock)}
                </h2>
                <Badge
                  tone={stockKnown ? (inStock ? 'success' : 'danger') : 'neutral'}
                  dot={stockKnown}
                >
                  {stockKnown ? (inStock ? tr(COPY.stockIn) : tr(COPY.stockOut)) : tr(COPY.notReported)}
                </Badge>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs leading-relaxed text-muted">
                  {stockKnown ? tr(COPY.stockReported) : tr(COPY.stockUnknown)}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

function FactRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 px-5 py-3">
      <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11px] text-muted">{label}</dt>
        <dd className="mt-0.5 break-words text-[13px] leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}
