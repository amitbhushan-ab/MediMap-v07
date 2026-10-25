// src/pages/MapViewPage.jsx — the map workspace: search, filter, compare, navigate
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowRight,
  List,
  LocateFixed,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { adaptPharmacyList, adaptSearchResults } from '../lib/pharmacyAdapter';
import { formatDistance, formatPrice, pick } from '../lib/format';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { SegmentedControl } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { DottedGlow } from '../components/ui/dotted-glow';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const API_BASE = import.meta.env.VITE_API_URL || 'https://medimap-backend-ygqj.onrender.com/api';

const DEFAULT_COORDS = { lat: 28.6092, lng: 77.0354, label: 'NSUT Campus, Dwarka' };

const CITY_COORDS = {
  'nsut': { lat: 28.6092, lng: 77.0354, label: 'NSUT Campus' },
  'dwarka': { lat: 28.5921, lng: 77.0460, label: 'Dwarka' },
  'dwarka-sec3': { lat: 28.6075, lng: 77.0390, label: 'Dwarka Sector 3' },
  'dwarka-sec12': { lat: 28.5925, lng: 77.0402, label: 'Dwarka Sector 12' },
  'dwarka-sec14': { lat: 28.6015, lng: 77.0250, label: 'Dwarka Sector 14' },
  'kakrola': { lat: 28.6140, lng: 77.0375, label: 'Kakrola More' },
  'dwarka-mor': { lat: 28.6185, lng: 77.0320, label: 'Dwarka Mor' },
  'janakpuri': { lat: 28.6290, lng: 77.0780, label: 'Janakpuri' },
  'delhi': { lat: 28.6139, lng: 77.2090, label: 'Central Delhi' },
  'noida': { lat: 28.5355, lng: 77.3910, label: 'Noida' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, label: 'Gurgaon' },
};

const QUICK_CITIES = ['NSUT Campus', 'Dwarka Sec 3', 'Dwarka Sec 12', 'Dwarka Sec 14', 'Kakrola More', 'Dwarka Mor', 'Janakpuri', 'Central Delhi'];

const COPY = {
  eyebrow: { en: 'Nearby', hi: 'आसपास' },
  title: { en: 'Pharmacy prices', hi: 'फार्मेसी कीमतें' },
  searchLabel: { en: 'Search for a medicine', hi: 'दवा खोजें' },
  searchPlaceholder: { en: 'Search a medicine', hi: 'दवा का नाम लिखें' },
  searchAction: { en: 'Search', hi: 'खोजें' },
  listView: { en: 'List', hi: 'सूची' },
  change: { en: 'Change', hi: 'बदलें' },
  close: { en: 'Close', hi: 'बंद करें' },
  locating: { en: 'Locating', hi: 'लोकेशन ढूंढ रहे हैं' },
  inStockOnly: { en: 'In stock only', hi: 'सिर्फ उपलब्ध' },
  sortLabel: { en: 'Sort results', hi: 'नतीजे क्रम में लगाएँ' },
  nearest: { en: 'Nearest', hi: 'निकटतम' },
  lowestPrice: { en: 'Lowest price', hi: 'सबसे कम कीमत' },
  call: { en: 'Call', hi: 'कॉल करें' },
  directions: { en: 'Directions', hi: 'रास्ता' },
  perStrip: { en: 'per strip', hi: 'प्रति पत्ती' },
  inStock: { en: 'In stock', hi: 'उपलब्ध है' },
  outOfStock: { en: 'Out of stock', hi: 'उपलब्ध नहीं' },
  lowest: { en: 'Lowest', hi: 'सबसे कम' },
  unknown: { en: 'Pharmacy', hi: 'फार्मेसी' },
  noDistance: { en: 'Distance unknown', hi: 'दूरी अज्ञात' },
  emptyTitle: { en: 'No price reported', hi: 'कोई कीमत नहीं मिली' },
  emptyBody: {
    en: 'No pharmacy has reported this medicine yet. Try another brand or salt name.',
    hi: 'इस दवा की कीमत अभी किसी फार्मेसी ने नहीं बताई। दूसरा ब्रांड या साल्ट नाम आज़माएँ।',
  },
  openBridge: { en: 'Compare walk and fare', hi: 'पैदल दूरी और किराया देखें' },
  locationTitle: { en: 'Search location', hi: 'खोज का स्थान' },
  locationBody: {
    en: 'Pick a campus or sector, or enter a 6-digit pincode.',
    hi: 'कोई परिसर या सेक्टर चुनें, या 6 अंकों का पिनकोड लिखें।',
  },
  locationPlaceholder: { en: 'Locality or pincode', hi: 'इलाका या पिनकोड' },
  apply: { en: 'Apply', hi: 'लागू करें' },
  useGps: { en: 'Use device GPS', hi: 'डिवाइस GPS इस्तेमाल करें' },
  reference: { en: 'Reference point', hi: 'संदर्भ केंद्र' },
  you: { en: 'You', hi: 'आप' },
  navigate: { en: 'Navigate', hi: 'रास्ता देखें' },
  hospital: { en: 'Hospital', hi: 'अस्पताल' },
  clinic: { en: 'Clinic', hi: 'क्लिनिक' },
  medicalCentre: { en: 'Medical centre', hi: 'चिकित्सा केंद्र' },
  defaultPharmacy: { en: 'Pharmacy', hi: 'फार्मेसी' },
};

function createUserIcon(lang) {
  const label = pick(lang, COPY.you);
  return L.divIcon({
    html: `<div style="display:flex; flex-direction:column; align-items:center;">
      <div style="position:relative; width:30px; height:30px; border-radius:50%; background:rgb(var(--accent)); box-shadow:0 4px 14px rgb(var(--accent) / 0.35); border:2px solid rgb(var(--surface));">
        <span style="position:absolute; left:50%; top:6px; width:7px; height:7px; border-radius:50%; background:rgb(var(--surface)); transform:translateX(-50%);"></span>
        <span style="position:absolute; left:50%; bottom:5px; width:14px; height:7px; border-radius:7px 7px 2px 2px; background:rgb(var(--surface)); transform:translateX(-50%);"></span>
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:8px solid rgb(var(--accent)); margin-top:-1px;"></div>
      <div style="margin-top:2px; font-size:10px; font-weight:600; color:rgb(var(--ink)); text-shadow:0 0 3px rgb(var(--canvas)), 0 0 3px rgb(var(--canvas)); white-space:nowrap;">
        ${label}
      </div>
    </div>`,
    className: '',
    iconSize: [120, 54],
    iconAnchor: [60, 42],
    popupAnchor: [0, -42],
  });
}

function createPriceIcon(price, isCheapest, name) {
  const shortName = name ? (name.length > 20 ? `${name.substring(0, 20)}...` : name) : COPY.defaultPharmacy.en;
  const bg = isCheapest ? 'rgb(var(--success))' : 'rgb(var(--accent))';
  return L.divIcon({
    html: `<div style="display:flex; flex-direction:column; align-items:center;">
      <div style="background:${bg}; color:white; padding:3px 8px; border-radius:9999px; font-family:Inter, sans-serif; font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; box-shadow:0 3px 8px rgb(var(--ink) / 0.18); border:1.5px solid rgb(var(--surface));">
        ${formatPrice(price)}
      </div>
      <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid ${bg}; margin-top:-1px;"></div>
      <div style="margin-top:2px; font-size:10px; font-weight:600; color:rgb(var(--ink)); text-shadow:0 0 3px rgb(var(--canvas)), 0 0 3px rgb(var(--canvas)); white-space:nowrap;">
        ${shortName}
      </div>
    </div>`,
    className: '',
    iconSize: [120, 50],
    iconAnchor: [60, 32],
    popupAnchor: [0, -32],
  });
}

function createPharmacyIcon(name) {
  const shortName = name ? (name.length > 20 ? `${name.substring(0, 20)}...` : name) : COPY.defaultPharmacy.en;
  return L.divIcon({
    html: `<div style="display:flex; flex-direction:column; align-items:center;">
      <div style="position:relative; width:30px; height:30px; border-radius:50%; background:rgb(var(--accent)); box-shadow:0 4px 12px rgb(var(--accent) / 0.3); border:2px solid rgb(var(--surface));">
        <span style="position:absolute; left:50%; top:50%; width:14px; height:2px; border-radius:2px; background:rgb(var(--surface)); transform:translate(-50%, -50%);"></span>
        <span style="position:absolute; left:50%; top:50%; width:2px; height:14px; border-radius:2px; background:rgb(var(--surface)); transform:translate(-50%, -50%);"></span>
      </div>
      <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:7px solid rgb(var(--accent)); margin-top:-1px;"></div>
      <div style="margin-top:2px; font-size:10px; font-weight:600; color:rgb(var(--ink)); text-shadow:0 0 3px rgb(var(--canvas)), 0 0 3px rgb(var(--canvas)); white-space:nowrap;">
        ${shortName}
      </div>
    </div>`,
    className: '',
    iconSize: [120, 54],
    iconAnchor: [60, 40],
    popupAnchor: [0, -40],
  });
}

function createHospitalIcon(name) {
  const shortName = name ? (name.length > 20 ? `${name.substring(0, 20)}...` : name) : COPY.medicalCentre.en;
  return L.divIcon({
    html: `<div style="display:flex; flex-direction:column; align-items:center; opacity:0.85;">
      <div style="position:relative; width:18px; height:18px; border-radius:4px; background:rgb(var(--danger)); box-shadow:0 1px 4px rgb(var(--ink) / 0.2); border:1px solid rgb(var(--surface));">
        <span style="position:absolute; left:50%; top:50%; width:10px; height:1.5px; border-radius:1px; background:rgb(var(--surface)); transform:translate(-50%, -50%);"></span>
        <span style="position:absolute; left:50%; top:50%; width:1.5px; height:10px; border-radius:1px; background:rgb(var(--surface)); transform:translate(-50%, -50%);"></span>
      </div>
      <div style="margin-top:2px; font-size:9px; font-weight:600; color:rgb(var(--danger)); text-shadow:0 0 3px rgb(var(--canvas)), 0 0 3px rgb(var(--canvas)); white-space:nowrap;">
        ${shortName}
      </div>
    </div>`,
    className: '',
    iconSize: [120, 34],
    iconAnchor: [60, 18],
    popupAnchor: [0, -18],
  });
}

function FitBounds({ positions }) {
  const map = useMap();
  const hasFittedRef = useRef('');

  const validPositions = positions.filter((p) => p && p[0] && p[1]);
  const serialized = JSON.stringify(validPositions);

  useEffect(() => {
    if (validPositions.length === 0) return;
    if (hasFittedRef.current === serialized) return;

    const timer = setTimeout(() => {
      try {
        const bounds = L.latLngBounds(validPositions);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
          hasFittedRef.current = serialized;
        }
      } catch (e) {}
    }, 200);
    return () => clearTimeout(timer);
  }, [serialized, map]);

  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function HospitalsLayer() {
  const map = useMap();
  const { lang } = useLang();
  const [hospitals, setHospitals] = useState([]);

  const fetchHospitals = async () => {
    if (map.getZoom() < 12) return;
    const bounds = map.getBounds();
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
        node["amenity"="clinic"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
      );
      out 20;
    `;
    try {
      const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await res.json();
      setHospitals(data.elements || []);
    } catch (e) {}
  };

  useMapEvents({
    moveend: () => {
      setTimeout(fetchHospitals, 500);
    },
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  return hospitals.map((h) => (
    <Marker key={h.id} position={[h.lat, h.lon]} icon={createHospitalIcon(h.tags?.name)} zIndexOffset={-1000}>
      <Popup>
        <div className="min-w-[150px] text-xs">
          <p className="font-medium text-ink">{h.tags?.name || pick(lang, COPY.medicalCentre)}</p>
          <p className="mt-1 text-muted">
            {h.tags?.amenity === 'hospital' ? pick(lang, COPY.hospital) : pick(lang, COPY.clinic)}
          </p>
          <Button
            href={`https://maps.google.com/?q=${h.lat},${h.lon}`}
            target="_blank"
            rel="noreferrer"
            size="xs"
            className="mt-2.5 w-full"
          >
            {pick(lang, COPY.navigate)}
            <Navigation className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </Popup>
    </Marker>
  ));
}

function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.lat) {
      const timer = setTimeout(() => {
        try {
          map.flyTo([coords.lat, coords.lng], 14, { animate: true, duration: 1.2 });
        } catch (e) {}
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [coords, map]);
  return null;
}

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

function directionsFor(item) {
  return `https://maps.google.com/?q=${encodeURIComponent(`${item.pharmacy?.name || ''} ${item.pharmacy?.address || ''}`)}`;
}

export default function MapViewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [pharmacies, setPharmacies] = useState(() => adaptPharmacyList([]));
  const [loading, setLoading] = useState(Boolean(query));
  const [selected, setSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(DEFAULT_COORDS);
  const [locationLabel, setLocationLabel] = useState('NSUT Campus, Dwarka');
  const [showPanel, setShowPanel] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [cityError, setCityError] = useState('');
  const [locating, setLocating] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('distance');

  const { lang } = useLang();
  const tr = (pair) => pick(lang, pair);

  // Try live GPS first on load
  useEffect(() => {
    tryGPS();
  }, []);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const tryGPS = () => {
    if (!navigator.geolocation) {
      setUserLocation(DEFAULT_COORDS);
      setLocationLabel('NSUT Campus, Dwarka');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationLabel(lang === 'hi' ? 'लाइव GPS' : 'Live GPS');
        setLocating(false);
        setShowPanel(false);
      },
      () => {
        setUserLocation(DEFAULT_COORDS);
        setLocationLabel('NSUT Campus, Dwarka');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const setCity = (name) => {
    const key = name.toLowerCase().trim();
    const match = CITY_COORDS[key] || CITY_COORDS[Object.keys(CITY_COORDS).find((k) => k.includes(key) || key.includes(k))];
    if (match) {
      setUserLocation({ lat: match.lat, lng: match.lng });
      setLocationLabel(match.label);
      setShowPanel(false);
      setCityInput('');
      setCityError('');
    } else if (/^\d{6}$/.test(key)) {
      setUserLocation(DEFAULT_COORDS);
      setLocationLabel(lang === 'hi' ? `पिनकोड: ${name}` : `Pincode: ${name}`);
      setShowPanel(false);
    } else {
      setCityError(
        lang === 'hi'
          ? 'स्थान नहीं मिला। प्रयास करें: Dwarka, Janakpuri, Delhi...'
          : 'City not found. Try: NSUT Dwarka, Janakpuri, Delhi...',
      );
    }
  };

  function handleSearch(event) {
    event.preventDefault();
    const term = searchInput.trim();
    if (!term) {
      navigate(pathname);
      return;
    }
    setShowPanel(false);
    setLoading(true);
    navigate(`${pathname}?q=${encodeURIComponent(term)}`);
  }

  // REST API data fetching
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const lat = userLocation?.lat || DEFAULT_COORDS.lat;
    const lng = userLocation?.lng || DEFAULT_COORDS.lng;

    if (query) {
      fetch(`${API_BASE}/medicines/search?q=${encodeURIComponent(query)}&lat=${lat}&lng=${lng}`, {
        signal: AbortSignal.timeout(8000),
      })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const raw = data.results || [];
          const adapted = adaptSearchResults(raw, lat, lng);
          setResults(adapted);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Map search error:', err);
          if (!cancelled) {
            setResults(adaptSearchResults([], lat, lng));
            setLoading(false);
          }
        });
    } else {
      fetch(`${API_BASE}/pharmacies`, { signal: AbortSignal.timeout(8000) })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          const raw = Array.isArray(data) ? data : [];
          const adapted = adaptPharmacyList(raw, lat, lng);
          setPharmacies(adapted);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Pharmacies fetch error:', err);
          if (!cancelled) {
            setPharmacies(adaptPharmacyList([], lat, lng));
            setLoading(false);
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [query, userLocation]);

  const mapItems = (query
    ? results
    : pharmacies.map((p, i) => ({
        _id: p._id || `pharmacy_${i}`,
        pharmacy: p,
        price: null,
        inStock: p.isOpen !== false,
        isCheapest: false,
      })))
    .map((item) => {
      if (!userLocation || !item.pharmacy?.location?.lat || !item.pharmacy?.location?.lng) return item;
      const { lat, lng } = item.pharmacy.location;
      return { ...item, liveDistance: calcDistance(userLocation.lat, userLocation.lng, lat, lng) };
    })
    .sort((a, b) => (parseFloat(a.liveDistance) || 999) - (parseFloat(b.liveDistance) || 999));

  const distanceOf = (item) => {
    const value = parseFloat(item.liveDistance);
    return Number.isFinite(value) ? value : Infinity;
  };
  const priceOf = (item) =>
    item.price != null && Number.isFinite(Number(item.price)) ? Number(item.price) : Infinity;

  const visibleItems = mapItems
    .filter((item) => !inStockOnly || item.inStock)
    .sort((a, b) => {
      if (sortBy === 'price') {
        const priceA = priceOf(a);
        const priceB = priceOf(b);
        if (priceA !== priceB) return priceA - priceB;
      }
      return distanceOf(a) - distanceOf(b);
    });

  const lowestVisible = visibleItems.reduce(
    (min, item) => (item.price != null ? Math.min(min, item.price) : min),
    Infinity,
  );

  const selectedName = selected
    ? selected.pharmacy?.pharmacyName || selected.pharmacy?.name || tr(COPY.unknown)
    : '';
  const selectedContact = selected?.pharmacy?.contact || selected?.pharmacy?.phone || '';

  return (
    <div className="h-[calc(100dvh-4rem)] overflow-hidden bg-canvas md:p-3">
      <div className="flex h-full min-h-0 flex-col md:flex-row md:gap-3">
        {/* Map: above the sheet on mobile, the main workspace on desktop */}
        <section className="relative order-1 h-[50vh] flex-none overflow-hidden border-b border-line bg-surface md:order-2 md:h-full md:flex-1 md:rounded-panel md:border">
          <MapContainer
            key="medimap-map"
            center={[userLocation?.lat || DEFAULT_COORDS.lat, userLocation?.lng || DEFAULT_COORDS.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <MapResizer />
            <HospitalsLayer />
            {userLocation && <FlyTo coords={userLocation} />}
            {visibleItems.length > 0 && (
              <FitBounds positions={visibleItems.map((r) => (r.pharmacy?.location?.lat ? [r.pharmacy.location.lat, r.pharmacy.location.lng] : null))} />
            )}

            {/* User reference marker */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createUserIcon(lang)} zIndexOffset={2000}>
                <Popup>
                  <div className="min-w-[140px] text-xs">
                    <p className="font-medium text-ink">{tr(COPY.reference)}</p>
                    <p className="mt-1 text-muted">{locationLabel}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Pharmacy markers */}
            {visibleItems.map((item, i) => {
              if (!item.pharmacy?.location?.lat || !item.pharmacy?.location?.lng) return null;
              const { lat, lng } = item.pharmacy.location;
              const name = item.pharmacy?.pharmacyName || item.pharmacy?.name;
              return (
                <Marker
                  key={item._id || i}
                  position={[lat, lng]}
                  icon={item.price ? createPriceIcon(item.price, item.isCheapest, name) : createPharmacyIcon(name)}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div className="min-w-[200px] text-xs">
                      <p className="font-medium leading-snug text-ink">{name}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.pharmacy?.address}</p>
                      {item.price != null && (
                        <div className="mt-2 flex items-center gap-2">
                          <p className={cn('tnum text-sm font-medium', item.isCheapest ? 'text-success' : 'text-ink')}>
                            {formatPrice(item.price)}
                          </p>
                          {item.isCheapest && <Badge tone="success">{tr(COPY.lowest)}</Badge>}
                        </div>
                      )}
                      <p className={cn('mt-1.5 text-[11px] font-medium', item.inStock ? 'text-success' : 'text-danger')}>
                        {item.inStock ? tr(COPY.inStock) : tr(COPY.outOfStock)}
                      </p>
                      {item.liveDistance != null && (
                        <p className="tnum mt-1 text-[11px] text-muted">{formatDistance(item.liveDistance, lang)}</p>
                      )}
                      <Button href={directionsFor(item)} target="_blank" rel="noreferrer" size="xs" className="mt-3 w-full">
                        {tr(COPY.navigate)}
                        <Navigation className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </section>

        {/* Rail on desktop, sheet on mobile */}
        <aside className="relative z-10 order-2 -mt-3 block min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-t-panel border border-line bg-surface md:order-1 md:mt-0 md:flex md:w-[400px] md:flex-none md:flex-col md:overflow-hidden md:rounded-panel xl:w-[420px]">
          <div className="mx-auto mt-2 h-1 w-9 flex-shrink-0 rounded-full bg-line md:hidden" aria-hidden="true" />

          {/* One compact toolbar: search, stock filter, sort */}
          <div className="flex-shrink-0 border-b border-line p-3 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow hidden md:block">{tr(COPY.eyebrow)}</p>
                <h1 className="truncate text-sm font-medium text-ink md:mt-1" title={query || tr(COPY.title)}>
                  {query || tr(COPY.title)}
                </h1>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5">
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    to={`/results?q=${encodeURIComponent(query)}`}
                    className="px-2"
                  >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    {tr(COPY.listView)}
                  </Button>
                )}
                <Badge tone="neutral" className="tnum">
                  {visibleItems.length}
                </Badge>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                {locating ? (
                  <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="truncate" title={locationLabel}>
                  {locating
                    ? tr(COPY.locating)
                    : lang === 'hi'
                      ? `${locationLabel} के पास`
                      : `Near ${locationLabel}`}
                </span>
              </p>
              <Button
                variant="ghost"
                size="xs"
                className="flex-shrink-0 px-2"
                onClick={() => setShowPanel((open) => !open)}
                aria-expanded={showPanel}
              >
                {showPanel ? tr(COPY.close) : tr(COPY.change)}
              </Button>
            </div>

            <form role="search" onSubmit={handleSearch} className="mt-3">
              <label htmlFor="map-search" className="sr-only">
                {tr(COPY.searchLabel)}
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                <Input
                  id="map-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={tr(COPY.searchPlaceholder)}
                  autoComplete="off"
                  className="h-10 py-0 pl-9 pr-[4.75rem] text-sm [&::-webkit-search-cancel-button]:hidden"
                />
                <Button type="submit" size="xs" className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  {tr(COPY.searchAction)}
                </Button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Switch
                id="map-in-stock"
                checked={inStockOnly}
                onChange={setInStockOnly}
                label={tr(COPY.inStockOnly)}
              />
              <SegmentedControl
                label={tr(COPY.sortLabel)}
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { id: 'distance', label: tr(COPY.nearest) },
                  { id: 'price', label: tr(COPY.lowestPrice) },
                ]}
              />
            </div>
          </div>

          {/* Location drawer */}
          {showPanel && (
            <div className="max-h-[55%] min-h-0 shrink overflow-y-auto overscroll-contain border-b border-line bg-raised p-3 sm:p-4">
              <p className="text-xs font-medium text-ink">{tr(COPY.locationTitle)}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">{tr(COPY.locationBody)}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {QUICK_CITIES.map((city) => {
                  const active = locationLabel.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setCity(city)}
                      aria-pressed={active}
                      className={cn(
                        'chip transition-colors',
                        active
                          ? 'border-accent/40 bg-accent/10 text-accent-ink'
                          : 'hover:border-accent/40 hover:text-accent-ink',
                      )}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  type="text"
                  value={cityInput}
                  onChange={(event) => {
                    setCityInput(event.target.value);
                    setCityError('');
                  }}
                  onKeyDown={(event) => event.key === 'Enter' && setCity(cityInput)}
                  placeholder={tr(COPY.locationPlaceholder)}
                  aria-label={tr(COPY.locationPlaceholder)}
                  autoFocus
                  className="h-9 py-0 text-xs"
                />
                <Button size="sm" className="flex-shrink-0" onClick={() => setCity(cityInput)}>
                  {tr(COPY.apply)}
                </Button>
              </div>
              {cityError && (
                <p role="alert" className="mt-2 text-[11px] font-medium text-danger">
                  {cityError}
                </p>
              )}

              <Button variant="ghost" size="xs" onClick={tryGPS} className="mt-2 px-0">
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
                {tr(COPY.useGps)}
              </Button>
            </div>
          )}

          {/* Pinned selected pharmacy */}
          {selected && (
            <Card className="flex-shrink-0 rounded-none border-x-0 border-t-0 border-b border-l-2 border-l-accent bg-accent/[0.045] px-4 py-2.5 shadow-none">
              <div className="flex items-start justify-between gap-2">
                <p className="mt-0.5 min-w-0 truncate text-sm font-medium text-ink" title={selectedName}>
                  {selectedName}
                </p>
                <Badge tone={selected.inStock ? 'success' : 'danger'} dot className="flex-shrink-0">
                  {selected.inStock ? tr(COPY.inStock) : tr(COPY.outOfStock)}
                </Badge>
              </div>
              <p className="mt-1 hidden text-[11px] leading-relaxed text-muted md:line-clamp-2">
                {selected.pharmacy?.address}
              </p>

              <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  {selected.price != null ? (
                    <>
                      <p className="tnum text-lg font-medium leading-none text-ink">{formatPrice(selected.price)}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {tr(COPY.perStrip)}
                        {selected.liveDistance != null ? ` · ${formatDistance(selected.liveDistance, lang)}` : ''}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-muted">
                      {selected.liveDistance != null ? formatDistance(selected.liveDistance, lang) : tr(COPY.noDistance)}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedContact && (
                    <Button variant="secondary" size="sm" href={`tel:${selectedContact}`}>
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {tr(COPY.call)}
                    </Button>
                  )}
                  <Button size="sm" href={directionsFor(selected)} target="_blank" rel="noreferrer">
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    {tr(COPY.directions)}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Results */}
          <div className="pb-24 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:pb-0">
            {loading ? (
              <div className="divide-y divide-line">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3.5 w-12" />
                    </div>
                    <Skeleton className="mt-2 h-3 w-full" />
                    <div className="mt-3 flex items-center gap-2">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="ml-auto h-3 w-14" />
                    </div>
                  </div>
                ))}
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="relative m-3 overflow-hidden rounded-card border border-line bg-surface">
                <DottedGlow className="opacity-60" radius={200} />
                <EmptyState
                  icon={Search}
                  title={tr(COPY.emptyTitle)}
                  description={tr(COPY.emptyBody)}
                  action={
                    <Button variant="secondary" size="sm" to="/bridge">
                      {tr(COPY.openBridge)}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  }
                  className="relative z-10 py-9"
                />
              </div>
            ) : (
              visibleItems.map((item, index) => {
                const name = item.pharmacy?.pharmacyName || item.pharmacy?.name || tr(COPY.unknown);
                const address = item.pharmacy?.address || '';
                const isSelected = Boolean(selected?._id && selected._id === item._id);
                return (
                  <button
                    key={item._id || index}
                    type="button"
                    onClick={() => setSelected(item)}
                    aria-pressed={isSelected}
                    className={cn(
                      'relative block w-full border-b border-line px-4 py-3 text-left transition-colors duration-150 last:border-b-0 hover:bg-raised/70 focus-visible:bg-raised/70',
                      isSelected && 'bg-accent/[0.04]',
                    )}
                  >
                    {isSelected && (
                      <span className="absolute inset-y-0 left-0 w-[2px] bg-accent" aria-hidden="true" />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink" title={name}>
                          {name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted" title={address}>
                          {address}
                        </p>
                      </div>
                      {item.price != null && (
                        <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
                          <p
                            className={cn(
                              'tnum text-[13px] font-medium',
                              item.isCheapest ? 'text-accent-ink' : 'text-ink',
                            )}
                          >
                            {formatPrice(item.price)}
                          </p>
                          {lowestVisible < Infinity && item.price != null && item.price > lowestVisible && (
                            <span className="tnum text-[9px] text-muted">
                              +{formatPrice(item.price - lowestVisible)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                          item.inStock ? 'text-success' : 'text-danger'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {item.inStock ? tr(COPY.inStock) : tr(COPY.outOfStock)}
                      </span>
                      {item.isCheapest && <Badge tone="accent">{tr(COPY.lowest)}</Badge>}
                      {item.liveDistance != null && (
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted">
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          <span className="tnum">{formatDistance(item.liveDistance, lang)}</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
