// frontend/src/pages/ResultsPage.jsx — search results with a split map
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Clock3, MapPin, Mic, Navigation, Search, WifiOff } from 'lucide-react';
import PharmacyCard, { PharmacyCardSkeleton } from '../components/PharmacyCard';
import { useLang } from '../context/LanguageContext';
import { adaptSearchResults } from '../lib/pharmacyAdapter';
import { buildFixtureSearch } from '../lib/fixtureResults';
import { readCachedSearch, writeCachedSearch } from '../lib/priceCache';
import { formatDistance, formatPrice, pick, timeAgo } from '../lib/format';
import { useMediaQuery } from '../lib/use-media-query';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { EmptyState } from '../components/ui/empty-state';
import { Container } from '../components/ui/section';
import { Skeleton } from '../components/ui/skeleton';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { DottedGlow } from '../components/ui/dotted-glow';
import { Lens } from '../components/ui/lens';
import { Switch } from '../components/ui/switch';
import { SegmentedControl } from '../components/ui/tabs';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Helper component for panning the map
function MapFlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    const lat = Number(coords?.lat);
    const lng = Number(coords?.lng);
    // Leaflet throws on NaN while the container has no measured size.
    const size = map.getSize();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || size.x === 0 || size.y === 0) return;
    map.flyTo([lat, lng], 15, { animate: true, duration: 1.5 });
  }, [coords, map]);
  return null;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://medimap-backend-ygqj.onrender.com/api';

const COPY = {
  searchLabel: { en: 'Search for a medicine', hi: 'दवा खोजें' },
  searchPlaceholder: { en: 'Search a medicine or brand', hi: 'दवा या ब्रांड खोजें' },
  listening: { en: 'Listening', hi: 'सुन रहे हैं' },
  submitSearch: { en: 'Search', hi: 'खोजें' },
  back: { en: 'Back to home', hi: 'होम पर वापस' },
  viewLabel: { en: 'View', hi: 'दृश्य' },
  viewSplit: { en: 'Split', hi: 'नक्शा' },
  viewList: { en: 'List', hi: 'सूची' },
  count: { en: 'pharmacies reporting stock', hi: 'फार्मेसियां उपलब्धता बता रही हैं' },
  countOne: { en: 'pharmacy reporting stock', hi: 'फार्मेसी उपलब्धता बता रही है' },
  sortLabel: { en: 'Sort results', hi: 'परिणाम क्रम' },
  nearest: { en: 'Nearest', hi: 'निकटतम' },
  lowestSort: { en: 'Lowest price', hi: 'सबसे कम कीमत' },
  lowest: { en: 'lowest price', hi: 'सबसे कम कीमत' },
  generic: { en: 'Generic', hi: 'सामान्य नाम' },
  rx: { en: 'Rx required', hi: 'पर्ची आवश्यक' },
  front: { en: 'Front of pack', hi: 'पैक का अगला भाग' },
  backPack: { en: 'Back of pack', hi: 'पैक का पिछला भाग' },
  emptyPrompt: {
    en: 'Search a medicine to compare prices at pharmacies around Dwarka.',
    hi: 'द्वारका की फार्मेसियों में कीमतों की तुलना के लिए दवा खोजें।',
  },
  emptyFiltered: {
    en: 'No pharmacy has reported stock for this medicine yet.',
    hi: 'इस दवा का स्टॉक अभी किसी फार्मेसी ने नहीं बताया है।',
  },
  searchAgain: { en: 'Search again', hi: 'फिर खोजें' },
  searching: {
    en: 'Checking counters nearby…',
    hi: 'आसपास के काउंटर देखे जा रहे हैं…',
  },
  sampleTitle: {
    en: 'Live counters are unreachable — showing sample prices from the Dwarka directory.',
    hi: 'लाइव काउंटर उपलब्ध नहीं हैं — द्वारका डायरेक्टरी के नमूना दाम दिख रहे हैं।',
  },
  sampleBody: {
    en: 'Treat these as a demo of the comparison, not a price to pay at the counter.',
    hi: 'इन्हें तुलना का डेमो मानें, काउंटर पर देय कीमत नहीं।',
  },
  retry: { en: 'Retry live prices', hi: 'लाइव दाम फिर लाएँ' },
  cachedTitle: {
    en: 'Live counters are unreachable — showing prices you last saved.',
    hi: 'लाइव काउंटर उपलब्ध नहीं — आपके अंतिम सहेजे गए दाम दिख रहे हैं।',
  },
  cachedSaved: { en: 'Saved', hi: 'सहेजा गया' },
  confirmCounter: { en: 'confirm at the counter', hi: 'काउंटर पर पुष्टि करें' },
};

export default function ResultsPage() {
  const { lang, t } = useLang();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [newQuery, setNewQuery] = useState(query);
  const [results, setResults] = useState([]);
  const [medicine, setMedicine] = useState(null);
  // live = API reply, cache = last saved live search, sample = local catalogue
  const [source, setSource] = useState('live');
  const [cachedAt, setCachedAt] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real packaging image mapping for seeded demo medicines
  const BRAND_IMAGES = {
    'paracetamol': {
      f: 'https://zeelabpharmacy.com/uploads/other_brand_image/Zee67ed351a53824.jpeg',
      b: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSki3mJGbwAFFjq7Z3bcZ9ZHqu5D1BGOF8l0d3tgsW5aA&s=10',
    },
    'amoxicillin': {
      f: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?w=300&h=300&fit=crop',
      b: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cold_Form_Foil_blister_pack2.jpg',
    },
    'metformin': {
      f: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=300&h=300&fit=crop',
      b: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cold_Form_Foil_blister_pack2.jpg',
    },
    'cetirizine': {
      f: 'https://images.unsplash.com/photo-1550572017-edb30263f350?w=300&h=300&fit=crop',
      b: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cold_Form_Foil_blister_pack2.jpg',
    },
    'azithromycin': {
      f: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&h=300&fit=crop',
      b: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cold_Form_Foil_blister_pack2.jpg',
    },
  };

  const searchKey = Object.keys(BRAND_IMAGES).find((k) => (medicine?.name || query)?.toLowerCase().includes(k));
  const fallbackImages = {
    f: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Blister_Pack.jpg',
    b: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Cold_Form_Foil_blister_pack2.jpg',
  };
  const frontImg = searchKey ? BRAND_IMAGES[searchKey].f : fallbackImages.f;
  const backImg = searchKey ? BRAND_IMAGES[searchKey].b : fallbackImages.b;

  const [error, setError] = useState('');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sortBy, setSortBy] = useState('distance'); // distance | price
  const [filterInStock, setFilterInStock] = useState(false);
  const [view, setView] = useState('split'); // list | split
  const [userLat, setUserLat] = useState(28.6092);
  const [userLng, setUserLng] = useState(77.0354);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const searchRef = useRef(null);

  const copy = (pair) => pick(lang, pair);

  function toggleListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      searchRef.current?.focus();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.warn('Voice recognition error:', e.error);
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const cleaned = transcript.replace(/[.।]$/g, '').trim();
      const text = cleaned.toLowerCase().trim();

      if (
        text.includes('scan') ||
        text.includes('prescription') ||
        text.includes('पर्ची') ||
        text.includes('पर्चा') ||
        text.includes('स्कैन')
      ) {
        navigate('/scan');
        return;
      }

      if (
        text.includes('map') ||
        text.includes('location') ||
        text.includes('dikhao') ||
        text.includes('नक्शा') ||
        text.includes('मैप') ||
        text.includes('लोकेशन')
      ) {
        navigate('/map');
        return;
      }

      setNewQuery(cleaned);
      setTimeout(() => {
        navigate(`/results?q=${encodeURIComponent(cleaned)}`);
      }, 550);
    };

    recognition.start();
  }

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {},
    );
  }, []);

  // Fetch results from REST API
  useEffect(() => {
    if (!query) {
      setLoading(false);
      setResults([]);
      setMedicine(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setSource('live');
    setCachedAt(null);
    setResults([]);
    setMedicine(null);

    const url = `${API_BASE}/medicines/search?q=${encodeURIComponent(query)}&lat=${userLat}&lng=${userLng}`;

    fetch(url, { signal: AbortSignal.timeout(8000) })
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setLoading(false);

        const rawResults = data.results || [];

        if (rawResults.length === 0) {
          setError(
            lang === 'hi'
              ? 'आसपास कोई फार्मेसी इस दवा की उपलब्धता नहीं बता रही है।'
              : 'No pharmacy nearby reports this medicine.',
          );
          setResults([]);
          setMedicine(data.medicine || null);
          return;
        }

        setError('');
        setSource('live');
        setCachedAt(null);

        const medicineInfo = data.medicine || rawResults[0]?.medicine || null;
        setMedicine(medicineInfo);

        // Map & adapt results: ensure pharmacies are near user/NSUT and convert coords for Leaflet
        const mappedResults = adaptSearchResults(rawResults, userLat, userLng);
        setResults(mappedResults);
        writeCachedSearch(query, { medicine: medicineInfo, results: mappedResults });

        try {
          const history = JSON.parse(localStorage.getItem('medimap_search_history') || '[]');
          const updated = [
            { query, date: new Date().toISOString() },
            ...history.filter((h) => h.query !== query),
          ].slice(0, 10);
          localStorage.setItem('medimap_search_history', JSON.stringify(updated));
        } catch (e) {
          localStorage.setItem('medimap_search_history', '[]');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Search fetch error:', err);
        // The pilot API is often offline. Prefer the last live reply for this
        // search; only fall back to the sample catalogue when nothing is saved.
        const cached = readCachedSearch(query, userLat, userLng);
        if (cached) {
          setResults(cached.results);
          setMedicine(cached.medicine);
          setCachedAt(cached.savedAt);
          setSource('cache');
          setLoading(false);
          return;
        }

        const fixture = buildFixtureSearch(query, userLat, userLng);
        setResults(fixture.results);
        setMedicine(fixture.medicine);
        setSource('sample');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, userLat, userLng, lang, reloadKey]);

  // Sorted + filtered
  const processed = [...results]
    .filter((r) => !filterInStock || r.inStock)
    .sort((a, b) =>
      sortBy === 'price' ? a.price - b.price : (a.distance || 99) - (b.distance || 99),
    );

  const cheapestPrice = processed
    .filter((r) => r.inStock)
    .reduce((min, r) => Math.min(min, r.price), Infinity);

  function handleSearch() {
    if (!newQuery.trim()) return;
    navigate(`/results?q=${encodeURIComponent(newQuery.trim())}`);
  }

  function saveSavings(result) {
    if (!result.isCheapest) return;
    const savings = JSON.parse(
      localStorage.getItem('medimap_saved_money') || '{"total":0,"thisMonth":0,"transactions":[]}',
    );
    const saved = Math.max(0, Math.round(cheapestPrice * 0.3));
    if (saved > 0) {
      savings.total += saved;
      savings.thisMonth += saved;
      savings.transactions.unshift({
        medicine: query,
        saved,
        date: new Date().toISOString(),
        cheapest: cheapestPrice,
        avg: Math.round(cheapestPrice * 1.3),
      });
      localStorage.setItem('medimap_saved_money', JSON.stringify(savings));
    }
  }

  const selectedResult = processed[selectedIdx];
  const emptyDescription = results.length > 0 ? copy(COPY.emptyFiltered) : copy(COPY.emptyPrompt);

  return (
    <div className="bg-canvas pb-16 text-ink">
      {/* ── Compact app bar ── */}
      <div className="sticky top-16 z-30 border-b border-line bg-canvas/95 backdrop-blur">
        <Container className="flex items-center gap-2 py-2.5">
          <Link
            to="/"
            aria-label={copy(COPY.back)}
            title={copy(COPY.back)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:border-accent/40 hover:text-accent-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </Link>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
            className="min-w-0 flex-1"
          >
            <label htmlFor="results-search" className="sr-only">
              {copy(COPY.searchLabel)}
            </label>
            <div className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface pl-4 pr-1.5 shadow-card transition-[border-color,box-shadow] duration-200 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/20">
              <Search
                className="h-4 w-4 flex-shrink-0 text-muted"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                id="results-search"
                type="search"
                value={newQuery}
                onChange={(event) => setNewQuery(event.target.value)}
                placeholder={isListening ? copy(COPY.listening) : copy(COPY.searchPlaceholder)}
                disabled={isListening}
                autoComplete="off"
                className="h-8 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
              />
              <IconButton
                size="md"
                onClick={toggleListening}
                aria-label={
                  isListening
                    ? lang === 'hi'
                      ? 'आवाज़ बंद करें'
                      : 'Stop voice search'
                    : lang === 'hi'
                      ? 'आवाज़ से खोजें'
                      : 'Search by voice'
                }
                aria-pressed={isListening}
                className={isListening ? 'bg-danger/10 text-danger' : 'text-muted'}
              >
                <Mic className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </IconButton>
              {newQuery && newQuery !== query && !isListening && (
                <Button type="submit" size="md" className="flex-shrink-0 px-3.5 text-xs">
                  {copy(COPY.submitSearch)}
                </Button>
              )}
            </div>
          </form>

          <SegmentedControl
            className="hidden flex-shrink-0 sm:inline-flex"
            label={copy(COPY.viewLabel)}
            value={view}
            onChange={setView}
            options={[
              { id: 'split', label: copy(COPY.viewSplit) },
              { id: 'list', label: copy(COPY.viewList) },
            ]}
          />
        </Container>
      </div>

      <Container className="py-5 sm:py-6">
        {/* ── Medicine summary — stays up while prices are still loading ── */}
        {(medicine || loading) && (
          <CardSpotlight className="rounded-panel p-4 sm:p-5" aria-busy={loading || undefined}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex flex-shrink-0 gap-2">
                  <Lens
                    src={frontImg}
                    alt={copy(COPY.front)}
                    className="h-16 w-16 rounded-card border border-line bg-raised"
                    size={88}
                  >
                    <img src={frontImg} alt={copy(COPY.front)} className="h-full w-full object-cover" />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-canvas"
                    >
                      FRONT
                    </span>
                  </Lens>
                  <figure className="relative h-16 w-16 overflow-hidden rounded-card border border-line bg-raised">
                    <img src={backImg} alt={copy(COPY.backPack)} className="h-full w-full object-cover" />
                    <figcaption
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[9px] font-medium uppercase tracking-[0.12em] text-canvas"
                    >
                      BACK
                    </figcaption>
                  </figure>
                </div>

                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <h1 className="display-3 min-w-0 truncate text-ink" title={medicine?.name || query}>
                      {medicine?.name || query}
                    </h1>
                    {medicine?.requiresPrescription && (
                      <Badge tone="warning">{copy(COPY.rx)}</Badge>
                    )}
                  </div>

                  {loading ? (
                    <p
                      role="status"
                      className="mt-1 flex items-center gap-1.5 text-xs text-muted"
                    >
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
                        aria-hidden="true"
                      />
                      {copy(COPY.searching)}
                    </p>
                  ) : (
                    <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      {medicine?.genericName && (
                        <span className="min-w-0 truncate" title={medicine.genericName}>
                          {copy(COPY.generic)}:{' '}
                          <span className="font-medium text-ink-soft">{medicine.genericName}</span>
                        </span>
                      )}
                      {medicine?.genericName && medicine?.category && (
                        <span aria-hidden="true" className="text-muted/60">
                          ·
                        </span>
                      )}
                      {medicine?.category && (
                        <span className="min-w-0 truncate" title={medicine.category}>
                          {medicine.category}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-shrink-0 items-baseline justify-between gap-2 border-t border-line pt-3 sm:block sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                  <Skeleton className="h-2.5 w-16 sm:ml-auto" />
                  <Skeleton className="mt-2 h-7 w-20 sm:ml-auto" />
                </div>
              ) : (
                cheapestPrice < Infinity && (
                  <div className="flex flex-shrink-0 items-baseline justify-between gap-2 border-t border-line pt-3 sm:block sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 sm:text-right">
                    <p className="text-[11px] text-muted">{copy(COPY.lowest)}</p>
                    <p className="tnum text-2xl font-medium tracking-[-0.02em] text-ink">
                      {formatPrice(cheapestPrice)}
                    </p>
                  </div>
                )
              )}
            </div>
          </CardSpotlight>
        )}

        {/* ── Offline provenance notice ── */}
        {source !== 'live' && !loading && (
          <div
            role="status"
            className={
              source === 'cache'
                ? 'mt-3 flex flex-col gap-3 rounded-card border border-line bg-raised p-3.5 sm:flex-row sm:items-center sm:justify-between'
                : 'mt-3 flex flex-col gap-3 rounded-card border border-warning/30 bg-warning/10 p-3.5 sm:flex-row sm:items-center sm:justify-between'
            }
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <span
                className={
                  source === 'cache'
                    ? 'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft'
                    : 'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning'
                }
              >
                {source === 'cache' ? (
                  <Clock3 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">
                  {source === 'cache' ? copy(COPY.cachedTitle) : copy(COPY.sampleTitle)}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {source === 'cache'
                    ? `${copy(COPY.cachedSaved)} ${timeAgo(cachedAt, lang).toLowerCase()} · ${copy(COPY.confirmCounter)}`
                    : copy(COPY.sampleBody)}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReloadKey((key) => key + 1)}
              className="flex-shrink-0 self-start sm:self-auto"
            >
              {copy(COPY.retry)}
            </Button>
          </div>
        )}

        {/* ── Toolbar ── */}
        {!loading && results.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-xs text-muted">
                <span className="tnum font-medium text-ink">{processed.length}</span>{' '}
                {processed.length === 1 ? copy(COPY.countOne) : copy(COPY.count)}
              </p>
              <span className="h-3.5 w-px bg-line" aria-hidden="true" />
              <Switch
                id="results-instock-only"
                checked={filterInStock}
                onChange={setFilterInStock}
                label={t('inStockOnly') || 'In stock only'}
              />
            </div>

            <SegmentedControl
              label={copy(COPY.sortLabel)}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { id: 'distance', label: copy(COPY.nearest) },
                { id: 'price', label: copy(COPY.lowestSort) },
              ]}
            />
          </div>
        )}

        {/* ── Results ── */}
        {loading ? (
          <div
            className="mt-5 grid grid-cols-1 gap-3"
            aria-busy="true"
            aria-label={lang === 'hi' ? 'परिणाम लोड हो रहे हैं' : 'Loading results'}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <PharmacyCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mx-auto mt-8 max-w-md">
            <EmptyState
              icon={Search}
              title={t('noResults') || 'No results found'}
              description={error}
              action={
                <Button to="/" size="md">
                  <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {copy(COPY.searchAgain)}
                </Button>
              }
            />
          </div>
        ) : processed.length === 0 ? (
          <div className="relative mx-auto mt-8 max-w-lg overflow-hidden rounded-panel border border-line bg-surface p-6">
            <DottedGlow className="opacity-60" radius={220} />
            <EmptyState
              icon={Search}
              title={t('noResults') || 'No results found'}
              description={emptyDescription}
              action={
                <Button to="/" size="md">
                  <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  {copy(COPY.searchAgain)}
                </Button>
              }
              className="relative z-10"
            />
          </div>
        ) : (
          <div
            className={
              view === 'split'
                ? 'mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2'
                : 'mt-5 flex flex-col gap-3'
            }
          >
            {/* Pharmacy cards column */}
            <div
              className={
                view === 'split'
                  ? 'flex min-w-0 flex-col gap-3 overflow-y-auto pr-1 lg:max-h-[calc(100vh-23rem)]'
                  : 'grid min-w-0 grid-cols-1 gap-3'
              }
            >
              {processed.map((result, i) => (
                <PharmacyCard
                  key={result._id || i}
                  result={result}
                  rank={i + 1}
                  isSelected={view === 'split' && selectedIdx === i}
                  onClick={() => {
                    setSelectedIdx(i);
                    saveSavings(result);
                  }}
                />
              ))}
            </div>

            {/* Split map — mounted on desktop only, Leaflet cannot measure a hidden container */}
            {view === 'split' && isDesktop && (
              <div className="sticky top-[8.5rem] h-[calc(100vh-10rem)] overflow-hidden rounded-panel border border-line bg-surface">
                <MapContainer
                  center={[userLat, userLng]}
                  zoom={13}
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                  key="split-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {processed.map((r, idx) => {
                    if (!r.pharmacy?.location?.lat || !r.pharmacy?.location?.lng) return null;
                    return (
                      <Marker
                        key={r._id || idx}
                        position={[r.pharmacy.location.lat, r.pharmacy.location.lng]}
                        eventHandlers={{ click: () => setSelectedIdx(idx) }}
                        alt={r.pharmacy.name}
                        title={r.pharmacy.name}
                      >
                        <Popup>
                          <div className="min-w-[150px] py-0.5 font-sans">
                            <h4 className="mb-0.5 text-[13px] font-medium leading-snug text-ink">
                              {r.pharmacy.name}
                            </h4>
                            <p className="mb-1.5 text-[10px] leading-snug text-muted">
                              {r.pharmacy.address}
                            </p>
                            <div className="flex items-center justify-between gap-4">
                              <span className="tnum text-[13px] font-medium text-success">
                                {formatPrice(r.price)}
                              </span>
                              <span className="tnum text-[10px] text-muted">
                                {formatDistance(r.distance, lang)}
                              </span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {selectedResult?.pharmacy?.location && (
                    <MapFlyTo coords={selectedResult.pharmacy.location} />
                  )}
                </MapContainer>

                {/* Selected pharmacy preview */}
                {selectedResult && (
                  <div className="absolute inset-x-4 bottom-4 z-[1000] flex items-center justify-between gap-3 rounded-card border border-line bg-surface/95 p-3 shadow-lift backdrop-blur">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-sm font-medium text-ink">
                          {selectedResult.pharmacy?.name}
                        </h3>
                        {selectedResult.pharmacy?.isPremium && <Badge tone="warning">Pro</Badge>}
                      </div>
                      <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted">
                        <MapPin
                          className="h-3 w-3 flex-shrink-0"
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                        <span className="truncate">{selectedResult.pharmacy?.address}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[11px]">
                        <span className="tnum font-medium text-ink">
                          {formatPrice(selectedResult.price)}
                        </span>
                        <span aria-hidden="true" className="text-muted/60">
                          ·
                        </span>
                        <span className="tnum text-muted">
                          {formatDistance(selectedResult.distance, lang)}
                        </span>
                      </div>
                    </div>

                    <Button
                      size="md"
                      variant="secondary"
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        selectedResult.pharmacy?.address || '',
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-shrink-0 px-3 text-xs"
                    >
                      <Navigation className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                      {t('getDirections')}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
