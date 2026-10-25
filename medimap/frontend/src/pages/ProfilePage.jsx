// frontend/src/pages/ProfilePage.jsx — the account dashboard
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Bookmark,
  ChevronRight,
  MapPin,
  Navigation,
  Pencil,
  Search,
  Star,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { formatNumber, formatPrice, pick } from '../lib/format';
import { Avatar } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Button, IconButton } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { EmptyState } from '../components/ui/empty-state';
import { Field, Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Container } from '../components/ui/section';
import { Skeleton } from '../components/ui/skeleton';
import { Switch } from '../components/ui/switch';
import { Tabs } from '../components/ui/tabs';
import { API_BASE } from '../lib/api';

const POINTS_API = `${API_BASE}/points`;

const COPY = {
  // Identity
  editName: { en: 'Edit name', hi: 'नाम संपादित करें' },
  save: { en: 'Save', hi: 'सहेजें' },
  cancel: { en: 'Cancel', hi: 'रद्द करें' },
  patientAccount: { en: 'Patient account', hi: 'मरीज़ खाता' },

  // Summary strip
  moneySaved: { en: 'Money saved', hi: 'बचाई रकम' },
  searches: { en: 'Searches', hi: 'खोजें' },
  savedPharmacies: { en: 'Saved pharmacies', hi: 'सेव की फार्मेसियां' },
  pointsLabel: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' },

  // Tabs
  tabPoints: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' },
  tabHistory: { en: 'History', hi: 'इतिहास' },
  tabSaved: { en: 'Saved', hi: 'सेव किए' },
  tabReviews: { en: 'Reviews', hi: 'समीक्षाएं' },
  tabAlerts: { en: 'Alerts', hi: 'अलर्ट' },
  tabSavings: { en: 'Savings', hi: 'बचत' },

  // Search history
  recentSearches: { en: 'Recent searches', hi: 'हाल की खोजें' },
  clearAll: { en: 'Clear all', hi: 'सब हटाएं' },
  emptyHistoryTitle: { en: 'No searches yet', hi: 'अभी कोई खोज नहीं' },
  emptyHistoryBody: {
    en: 'Search a medicine and it appears here for a quick repeat.',
    hi: 'दवा खोजें; दोबारा खोजने के लिए वह यहाँ दिखेगी।',
  },
  searchMedicine: { en: 'Search a medicine', hi: 'दवा खोजें' },

  // Saved pharmacies
  savedTitle: { en: 'Saved pharmacies', hi: 'सेव की फार्मेसियां' },
  directions: { en: 'Directions', hi: 'रास्ता' },
  remove: { en: 'Remove', hi: 'हटाएं' },
  openNow: { en: 'Open now', hi: 'अभी खुला है' },
  closed: { en: 'Closed', hi: 'बंद है' },
  emptySavedTitle: { en: 'No saved pharmacies', hi: 'कोई फार्मेसी सेव नहीं है' },
  emptySavedBody: {
    en: 'Save a counter from the map to keep its address and phone number here.',
    hi: 'मैप से काउंटर सेव करें; उसका पता और फ़ोन नंबर यहाँ रहेगा।',
  },
  openMap: { en: 'Open the map', hi: 'मैप खोलें' },

  // Reviews
  reviewsTitle: { en: 'Your reviews', hi: 'आपकी समीक्षाएं' },
  emptyReviewsTitle: { en: 'No reviews yet', hi: 'अभी कोई समीक्षा नहीं' },
  emptyReviewsBody: {
    en: 'Reviews you write after a visit appear here.',
    hi: 'विज़िट के बाद लिखी समीक्षाएं यहाँ दिखेंगी।',
  },
  findPharmacy: { en: 'Find a pharmacy', hi: 'फार्मेसी खोजें' },

  // Alerts
  alertsTitle: { en: 'Price alerts', hi: 'कीमत अलर्ट' },
  setAlert: { en: 'Set an alert', hi: 'अलर्ट बनाएं' },
  medicine: { en: 'Medicine', hi: 'दवा' },
  medicinePlaceholder: { en: 'Paracetamol 500 mg', hi: 'पैरासिटामोल 500 मि.ग्रा.' },
  targetPrice: { en: 'Target', hi: 'लक्ष्य' },
  currentPrice: { en: 'Now', hi: 'अभी' },
  saveAlert: { en: 'Save alert', hi: 'अलर्ट सहेजें' },
  alertOn: { en: 'On', hi: 'चालू' },
  alertOff: { en: 'Off', hi: 'बंद' },
  emptyAlertsTitle: { en: 'No price alerts', hi: 'कोई कीमत अलर्ट नहीं' },
  emptyAlertsBody: {
    en: 'Set a target price for a medicine you buy often.',
    hi: 'जो दवा अक्सर लेते हैं, उसके लिए लक्ष्य कीमत तय करें।',
  },

  // Savings
  yourSavings: { en: 'Your savings', hi: 'आपकी बचत' },
  savingsSource: {
    en: 'Recorded from your price comparisons.',
    hi: 'यह बचत आपकी कीमत तुलना से दर्ज हुई है।',
  },
  thisMonth: { en: 'This month', hi: 'इस महीने' },
  monthShare: { en: 'Share from this month', hi: 'इस महीने का हिस्सा' },
  recentSavings: { en: 'Recent savings', hi: 'हाल की बचत' },
  noRecentSavings: { en: 'No savings recorded yet.', hi: 'अभी कोई बचत दर्ज नहीं हुई।' },
  totalSaved: { en: 'Total saved', hi: 'कुल बचत' },
  recentTransactions: { en: 'Recent transactions', hi: 'हाल के लेन-देन' },
  paid: { en: 'Paid', hi: 'दिया' },
  average: { en: 'Average', hi: 'औसत' },
  emptySavingsTitle: { en: 'No savings recorded', hi: 'अभी कोई बचत दर्ज नहीं' },
  emptySavingsBody: {
    en: 'Prices you compare are recorded here with the amount saved.',
    hi: 'आपकी तुलना की कीमतें और बचाई रकम यहाँ दर्ज होती हैं।',
  },
  comparePrices: { en: 'Compare prices', hi: 'कीमतों की तुलना करें' },

  // MediPoints panel
  balance: { en: 'Balance', hi: 'आपके पॉइंट्स' },
  pointsUnit: { en: 'points', hi: 'पॉइंट्स' },
  voucher: { en: 'voucher', hi: 'कूपन' },
  redeem: { en: 'Redeem', hi: 'भुनाएं' },
  moreNeeded: { en: 'more needed', hi: 'और चाहिए' },
  claimedVouchers: { en: 'Claimed vouchers', hi: 'मिले कूपन' },
  noVouchers: { en: 'No vouchers claimed yet.', hi: 'अभी कोई कूपन नहीं मिला।' },
  pointsError: {
    en: 'Point could not be loaded. Check the connection and reload the page.',
    hi: 'पॉइंट्स लोड नहीं हो सके। कनेक्शन देखकर पेज फिर खोलें।',
  },
};

function timeAgo(dateStr, lang) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (lang === 'hi') {
    if (diff < 3600) return `${Math.floor(diff / 60)} मिनट पहले`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} घंटे पहले`;
    return `${Math.floor(diff / 86400)} दिन पहले`;
  }
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Stars({ rating }) {
  const filled = Math.round(Number(rating) || 0);
  return (
    <span
      role="img"
      aria-label={`${filled} / 5`}
      className="inline-flex flex-shrink-0 items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={
            step <= filled
              ? 'h-3 w-3 fill-warning text-warning'
              : 'h-3 w-3 text-line-strong'
          }
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

const DEFAULT_SAVED = [
  { id: 'p1', name: 'Jan Aushadhi Kendra - NSUT Gate 1', address: 'Commercial Complex, NSUT, Sector 3, Dwarka', rating: 4.8, isOpen: true, savedAt: new Date(Date.now()-86400000).toISOString() },
  { id: 'p2', name: 'MedPlus Pharmacy - Sector 3 Dwarka', address: 'DDA Market, Pocket 1, Sector 3, Dwarka', rating: 4.6, isOpen: true, savedAt: new Date(Date.now()-172800000).toISOString() },
];
const DEFAULT_REVIEWS = [
  { id: 'r1', pharmacyName: 'Apollo Pharmacy', rating: 5, review: 'Verified inventory matched the app price exactly.', date: new Date(Date.now()-604800000).toISOString() },
];
const DEFAULT_ALERTS = [
  { id: 'a1', medicine: 'Paracetamol 500mg', targetPrice: 15, currentPrice: 18, pharmacy: 'Apollo', active: true },
  { id: 'a2', medicine: 'Metformin 500mg', targetPrice: 38, currentPrice: 45, pharmacy: 'MedPlus', active: true },
];
const DEFAULT_SAVINGS = {
  total: 1240, thisMonth: 340,
  transactions: [
    { medicine: 'Paracetamol 500mg', saved: 8, date: new Date(Date.now()-86400000).toISOString(), cheapest: 15, avg: 23 },
    { medicine: 'Azithromycin 500mg', saved: 35, date: new Date(Date.now()-345600000).toISOString(), cheapest: 145, avg: 180 },
  ]
};

const POINT_TIERS = [
  { tier: 1, points: 500, discount: 20 },
  { tier: 2, points: 1000, discount: 30 },
  { tier: 3, points: 2000, discount: 50 },
];

function Panel({ title, action, children }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-xs font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function RemoveButton({ label, onClick }) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-muted hover:bg-danger/10 hover:text-danger"
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
    </IconButton>
  );
}

function PointsTab({ lang, points, pointsError, coupons, redeeming, toast, onRedeem }) {
  const copy = (pair) => pick(lang, pair);
  const balance = Number(points) || 0;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-4">
        <div className="min-w-0">
          <p className="text-[11px] text-muted">{copy(COPY.balance)}</p>
          {pointsError ? (
            <p role="alert" className="mt-1 max-w-[24rem] text-xs text-danger">
              {copy(COPY.pointsError)}
            </p>
          ) : points === null ? (
            <Skeleton className="mt-1.5 h-8 w-24" />
          ) : (
            <p className="tnum mt-1 text-3xl font-light tracking-[-0.03em] text-ink">
              {formatNumber(balance)}
              <span className="ml-1.5 text-[11px] font-normal tracking-normal text-muted">
                {copy(COPY.pointsUnit)}
              </span>
            </p>
          )}
        </div>
      </div>

      {toast && (
        <p role="status" className="border-b border-line bg-raised/60 px-4 py-2.5 text-[11px] font-medium text-ink-soft">
          {toast}
        </p>
      )}

      <div className="divide-y divide-line">
        {POINT_TIERS.map((tier) => {
          const canRedeem = points !== null && balance >= tier.points;
          const needed = tier.points - balance;
          return (
            <div key={tier.tier} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink">
                  {formatNumber(tier.discount)}% {copy(COPY.voucher)}
                </p>
                <p className="tnum mt-0.5 text-[11px] text-muted">
                  {formatNumber(tier.points)} {copy(COPY.pointsUnit)}
                </p>
              </div>
              <Button
                size="sm"
                variant={canRedeem ? 'primary' : 'secondary'}
                disabled={!canRedeem}
                loading={redeeming === tier.tier}
                onClick={() => canRedeem && onRedeem(tier.tier)}
              >
                {canRedeem
                  ? copy(COPY.redeem)
                  : `${formatNumber(Math.max(needed, 0))} ${copy(COPY.moreNeeded)}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-ink-soft">{copy(COPY.claimedVouchers)}</p>
          <span className="tnum text-[11px] text-muted">{formatNumber(coupons.length)}</span>
        </div>
        {coupons.length ? (
          <ul className="mt-2 space-y-2">
            {coupons.map((coupon, index) => (
              <li key={coupon.id || coupon.code || index} className="flex items-center justify-between gap-3">
                <span className="tnum text-xs text-ink-soft">
                  {formatNumber(coupon.discount)}% {copy(COPY.voucher)}
                </span>
                <code className="rounded-full border border-line bg-raised px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-accent-ink">
                  {coupon.code}
                </code>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-muted">{copy(COPY.noVouchers)}</p>
        )}
      </div>
    </Card>
  );
}

function HistoryTab({ history, lang, onClear, onRerun }) {
  const copy = (pair) => pick(lang, pair);

  if (!history.length) {
    return (
      <EmptyState
        icon={Search}
        title={copy(COPY.emptyHistoryTitle)}
        description={copy(COPY.emptyHistoryBody)}
        action={<Button to="/" size="sm">{copy(COPY.searchMedicine)}</Button>}
      />
    );
  }

  return (
    <Panel
      title={copy(COPY.recentSearches)}
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-danger hover:bg-danger/10 hover:text-danger"
        >
          {copy(COPY.clearAll)}
        </Button>
      }
    >
      <div className="divide-y divide-line">
        {history.map((entry, index) => (
          <button
            key={`${entry.query}-${index}`}
            type="button"
            onClick={() => onRerun(entry.query)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-raised"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0 truncate text-xs font-medium text-ink" title={entry.query}>
                {entry.query}
              </span>
            </span>
            <span className="flex flex-shrink-0 items-center gap-1.5 text-[11px] text-muted">
              <span className="tnum">{timeAgo(entry.date, lang)}</span>
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function SavedTab({ saved, lang, onRemove }) {
  const copy = (pair) => pick(lang, pair);

  if (!saved.length) {
    return (
      <EmptyState
        icon={Bookmark}
        title={copy(COPY.emptySavedTitle)}
        description={copy(COPY.emptySavedBody)}
        action={<Button to="/map" size="sm">{copy(COPY.openMap)}</Button>}
      />
    );
  }

  return (
    <Panel title={copy(COPY.savedTitle)}>
      <div className="divide-y divide-line">
        {saved.map((pharmacy) => (
          <div key={pharmacy.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-ink" title={pharmacy.name}>
                  {pharmacy.name}
                </p>
                {typeof pharmacy.isOpen === 'boolean' && (
                  <Badge tone={pharmacy.isOpen ? 'success' : 'neutral'}>
                    {pharmacy.isOpen ? copy(COPY.openNow) : copy(COPY.closed)}
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-start gap-1.5 text-[11px] text-muted">
                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="min-w-0 truncate" title={pharmacy.address}>{pharmacy.address}</span>
              </p>
              {pharmacy.rating ? (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Stars rating={pharmacy.rating} />
                  <span className="tnum text-[11px] text-muted">{Number(pharmacy.rating).toFixed(1)}</span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <Button
                href={`https://maps.google.com/?q=${encodeURIComponent(pharmacy.address)}`}
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="md"
                className="px-3 text-xs"
              >
                <Navigation className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                {copy(COPY.directions)}
              </Button>
              <RemoveButton
                label={`${copy(COPY.remove)}: ${pharmacy.name}`}
                onClick={() => onRemove(pharmacy.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReviewsTab({ reviews, lang, onRemove }) {
  const copy = (pair) => pick(lang, pair);

  if (!reviews.length) {
    return (
      <EmptyState
        icon={Star}
        title={copy(COPY.emptyReviewsTitle)}
        description={copy(COPY.emptyReviewsBody)}
        action={<Button to="/map" size="sm">{copy(COPY.findPharmacy)}</Button>}
      />
    );
  }

  return (
    <Panel title={copy(COPY.reviewsTitle)}>
      <div className="divide-y divide-line">
        {reviews.map((review) => (
          <div key={review.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="min-w-0 truncate text-xs font-medium text-ink" title={review.pharmacyName}>
                  {review.pharmacyName}
                </p>
                {review.date && (
                  <span className="tnum flex-shrink-0 text-[11px] text-muted">
                    {timeAgo(review.date, lang)}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <Stars rating={review.rating} />
              </div>
              {review.review && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{review.review}</p>
              )}
            </div>
            <RemoveButton
              label={`${copy(COPY.remove)}: ${review.pharmacyName}`}
              onClick={() => onRemove(review.id)}
            />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertsTab({ alerts, lang, onToggle, onRemove, onAdd }) {
  const copy = (pair) => pick(lang, pair);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ medicine: '', targetPrice: '', pharmacy: '' });

  const add = () => {
    if (!form.medicine || !form.targetPrice) return;
    onAdd({
      id: `a${Date.now()}`,
      medicine: form.medicine,
      targetPrice: Number(form.targetPrice),
      currentPrice: Number(form.targetPrice) + 5,
      pharmacy: form.pharmacy || 'Any',
      active: true,
    });
    setForm({ medicine: '', targetPrice: '', pharmacy: '' });
    setShowAdd(false);
  };

  if (!alerts.length && !showAdd) {
    return (
      <EmptyState
        icon={Bell}
        title={copy(COPY.emptyAlertsTitle)}
        description={copy(COPY.emptyAlertsBody)}
        action={<Button size="sm" onClick={() => setShowAdd(true)}>{copy(COPY.setAlert)}</Button>}
      />
    );
  }

  return (
    <Panel
      title={copy(COPY.alertsTitle)}
      action={
        <Button variant={showAdd ? 'ghost' : 'secondary'} size="sm" onClick={() => setShowAdd((open) => !open)}>
          {showAdd ? copy(COPY.cancel) : copy(COPY.setAlert)}
        </Button>
      }
    >
      {showAdd && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            add();
          }}
          className="border-b border-line bg-raised/40 px-4 py-3"
        >
          <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
            <Field label={copy(COPY.medicine)} htmlFor="alert-medicine">
              <Input
                id="alert-medicine"
                value={form.medicine}
                onChange={(event) => setForm({ ...form, medicine: event.target.value })}
                placeholder={copy(COPY.medicinePlaceholder)}
                autoComplete="off"
              />
            </Field>
            <Field label={copy(COPY.targetPrice)} htmlFor="alert-target">
              <Input
                id="alert-target"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.targetPrice}
                onChange={(event) => setForm({ ...form, targetPrice: event.target.value })}
                placeholder="0"
                className="tnum"
              />
            </Field>
            <Button type="submit" size="md" className="w-full sm:w-auto">
              {copy(COPY.saveAlert)}
            </Button>
          </div>
        </form>
      )}

      {alerts.length ? (
        <div className="divide-y divide-line">
          {alerts.map((alert) => {
            const reached = Number(alert.currentPrice) <= Number(alert.targetPrice);
            return (
              <div key={alert.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-ink" title={alert.medicine}>
                    {alert.medicine}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                    <span>
                      {copy(COPY.targetPrice)}{' '}
                      <span className="tnum font-medium text-ink-soft">{formatPrice(alert.targetPrice)}</span>
                    </span>
                    <span aria-hidden="true" className="text-line">·</span>
                    <span>
                      {copy(COPY.currentPrice)}{' '}
                      <span className={`tnum font-medium ${reached ? 'text-success' : 'text-ink-soft'}`}>
                        {formatPrice(alert.currentPrice)}
                      </span>
                    </span>
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <Switch
                    id={`alert-switch-${alert.id}`}
                    checked={Boolean(alert.active)}
                    onChange={() => onToggle(alert.id)}
                    label={alert.active ? copy(COPY.alertOn) : copy(COPY.alertOff)}
                  />
                  <RemoveButton
                    label={`${copy(COPY.remove)}: ${alert.medicine}`}
                    onClick={() => onRemove(alert.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-[11px] text-muted">{copy(COPY.emptyAlertsBody)}</p>
      )}
    </Panel>
  );
}

function SavingsTab({ savings, lang }) {
  const copy = (pair) => pick(lang, pair);
  const transactions = Array.isArray(savings?.transactions) ? savings.transactions : [];

  if (!transactions.length) {
    return (
      <EmptyState
        icon={Wallet}
        title={copy(COPY.emptySavingsTitle)}
        description={copy(COPY.emptySavingsBody)}
        action={<Button to="/" size="sm">{copy(COPY.comparePrices)}</Button>}
      />
    );
  }

  return (
    <Card>
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-surface px-4 py-3.5">
          <p className="text-[11px] text-muted">{copy(COPY.totalSaved)}</p>
          <p className="tnum mt-1 text-lg font-light text-ink">{formatPrice(savings.total)}</p>
        </div>
        <div className="bg-surface px-4 py-3.5">
          <p className="text-[11px] text-muted">{copy(COPY.thisMonth)}</p>
          <p className="tnum mt-1 text-lg font-light text-ink">{formatPrice(savings.thisMonth)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <h2 className="text-xs font-medium text-ink">{copy(COPY.recentTransactions)}</h2>
        <span className="tnum text-[11px] text-muted">{formatNumber(transactions.length)}</span>
      </div>

      <div className="divide-y divide-line border-t border-line">
        {transactions.map((entry, index) => (
          <div key={`${entry.medicine}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink" title={entry.medicine}>
                {entry.medicine}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted">
                <span>
                  {copy(COPY.paid)} <span className="tnum">{formatPrice(entry.cheapest)}</span>
                </span>
                <span aria-hidden="true" className="text-line">·</span>
                <span>
                  {copy(COPY.average)} <span className="tnum">{formatPrice(entry.avg)}</span>
                </span>
                <span aria-hidden="true" className="text-line">·</span>
                <span className="tnum">{timeAgo(entry.date, lang)}</span>
              </p>
            </div>
            <p className="tnum flex-shrink-0 text-xs font-medium text-success">
              -{formatPrice(entry.saved)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const copy = (pair) => pick(lang, pair);

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('points');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');

  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('medimap_search_history') || '[]'));
  const [saved, setSaved] = useState(() =>
    JSON.parse(localStorage.getItem('medimap_saved_pharmacies') || JSON.stringify(DEFAULT_SAVED)),
  );
  const [reviews, setReviews] = useState(() =>
    JSON.parse(localStorage.getItem('medimap_my_reviews') || JSON.stringify(DEFAULT_REVIEWS)),
  );
  const [alerts, setAlerts] = useState(() =>
    JSON.parse(localStorage.getItem('medimap_price_alerts') || JSON.stringify(DEFAULT_ALERTS)),
  );
  const [savings] = useState(() =>
    JSON.parse(localStorage.getItem('medimap_saved_money') || JSON.stringify(DEFAULT_SAVINGS)),
  );

  const [points, setPoints] = useState(null);
  const [pointsError, setPointsError] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [redeeming, setRedeeming] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('medimap_user');
    if (!stored) {
      navigate('/login');
      return;
    }
    const storedUser = JSON.parse(stored);
    setUser(storedUser);
    setEditName(storedUser.name || '');
  }, []);

  useEffect(() => {
    if (!user?.email) return undefined;
    let cancelled = false;
    fetch(`${POINTS_API}/${encodeURIComponent(user.email)}`)
      .then((response) => {
        if (!response.ok) throw new Error('points request failed');
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPoints(Number(data.points) || 0);
        setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
        setPointsError(false);
      })
      .catch(() => {
        if (!cancelled) setPointsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  function saveEdit() {
    const updated = { ...user, name: editName };
    localStorage.setItem('medimap_user', JSON.stringify(updated));
    setUser(updated);
    setEditMode(false);
  }

  function clearHistory() {
    localStorage.removeItem('medimap_search_history');
    setHistory([]);
  }

  function removeSaved(id) {
    const updated = saved.filter((entry) => entry.id !== id);
    setSaved(updated);
    localStorage.setItem('medimap_saved_pharmacies', JSON.stringify(updated));
  }

  function removeReview(id) {
    const updated = reviews.filter((entry) => entry.id !== id);
    setReviews(updated);
    localStorage.setItem('medimap_my_reviews', JSON.stringify(updated));
  }

  function toggleAlert(id) {
    const updated = alerts.map((entry) =>
      entry.id === id ? { ...entry, active: !entry.active } : entry,
    );
    setAlerts(updated);
    localStorage.setItem('medimap_price_alerts', JSON.stringify(updated));
  }

  function removeAlert(id) {
    const updated = alerts.filter((entry) => entry.id !== id);
    setAlerts(updated);
    localStorage.setItem('medimap_price_alerts', JSON.stringify(updated));
  }

  function addAlert(alert) {
    const updated = [alert, ...alerts];
    setAlerts(updated);
    localStorage.setItem('medimap_price_alerts', JSON.stringify(updated));
  }

  async function redeem(tier) {
    if (!user?.email) return;
    setRedeeming(tier);
    try {
      const response = await fetch(`${POINTS_API}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.email, tier }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setPoints(Number(data.remainingPoints) || 0);
      setCoupons((previous) => [...previous, data.coupon]);
      setToast(lang === 'hi' ? `कूपन ${data.coupon.code} सक्रिय है।` : `Coupon ${data.coupon.code} is active.`);
      setTimeout(() => setToast(''), 3000);
    } catch (error) {
      setToast(error.message);
      setTimeout(() => setToast(''), 3000);
    }
    setRedeeming(null);
  }

  if (!user) return null;

  const tabs = [
    { id: 'points', label: copy(COPY.tabPoints) },
    { id: 'history', label: copy(COPY.tabHistory), count: history.length },
    { id: 'saved', label: copy(COPY.tabSaved), count: saved.length },
    { id: 'reviews', label: copy(COPY.tabReviews), count: reviews.length },
    {
      id: 'alerts',
      label: copy(COPY.tabAlerts),
      count: alerts.filter((entry) => entry.active).length,
    },
    { id: 'savings', label: copy(COPY.tabSavings) },
  ];
  const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label;
  const recentSavings = Array.isArray(savings?.transactions) ? savings.transactions.slice(0, 3) : [];
  const savedTotal = Number(savings?.total) || 0;
  const savedThisMonth = Number(savings?.thisMonth) || 0;
  const summary = [
    { label: copy(COPY.moneySaved), value: formatPrice(savedTotal) },
    { label: copy(COPY.searches), value: formatNumber(history.length) },
    { label: copy(COPY.savedPharmacies), value: formatNumber(saved.length) },
    { label: copy(COPY.pointsLabel), value: points === null ? '—' : formatNumber(points) },
  ];

  return (
    <div className="min-h-screen bg-canvas pb-16 text-ink">
      <Container className="space-y-5 py-8 sm:py-10">
        {/* Identity */}
        <CardSpotlight className="rounded-panel">
          <div className="flex min-w-0 items-start gap-4 p-5 sm:p-6">
            <Avatar name={user.name} size="lg" />
            <div className="min-w-0">
              {editMode ? (
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    aria-label={copy(COPY.editName)}
                    autoFocus
                    className="h-10 max-w-[240px] text-sm"
                  />
                  <Button size="sm" onClick={saveEdit}>{copy(COPY.save)}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                    {copy(COPY.cancel)}
                  </Button>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="display-3 min-w-0 truncate text-ink" title={user.name}>
                    {user.name}
                  </h1>
                  <IconButton
                    aria-label={copy(COPY.editName)}
                    title={copy(COPY.editName)}
                    onClick={() => setEditMode(true)}
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </IconButton>
                </div>
              )}
              <p className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                <span className="truncate" title={user.email}>{user.email}</span>
                {user.role && (
                  <>
                    <span aria-hidden="true" className="text-line">·</span>
                    <span>{copy(COPY.patientAccount)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </CardSpotlight>

        {/* Summary strip */}
        <Card className="overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="group/summary relative bg-surface px-4 py-4">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px scale-x-0 bg-accent/60 transition-transform duration-300 group-hover/summary:scale-x-100"
                />
                <p className="text-[11px] text-muted">{item.label}</p>
                <p className="tnum mt-1 text-xl font-light tracking-[-0.02em] text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* Tabs and panel */}
          <div className="min-w-0 space-y-3">
            <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} size="sm" />
            <section role="tabpanel" aria-label={activeTabLabel}>
              {activeTab === 'points' && (
                <PointsTab
                  lang={lang}
                  points={points}
                  pointsError={pointsError}
                  coupons={coupons}
                  redeeming={redeeming}
                  toast={toast}
                  onRedeem={redeem}
                />
              )}
              {activeTab === 'history' && (
                <HistoryTab
                  history={history}
                  lang={lang}
                  onClear={clearHistory}
                  onRerun={(query) => navigate(`/results?q=${encodeURIComponent(query)}`)}
                />
              )}
              {activeTab === 'saved' && <SavedTab saved={saved} lang={lang} onRemove={removeSaved} />}
              {activeTab === 'reviews' && <ReviewsTab reviews={reviews} lang={lang} onRemove={removeReview} />}
              {activeTab === 'alerts' && (
                <AlertsTab
                  alerts={alerts}
                  lang={lang}
                  onToggle={toggleAlert}
                  onRemove={removeAlert}
                  onAdd={addAlert}
                />
              )}
              {activeTab === 'savings' && <SavingsTab savings={savings} lang={lang} />}
            </section>
          </div>

          {/* Right rail */}
          <aside className="space-y-3 lg:sticky lg:top-24">
            <Card>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-ink">{copy(COPY.yourSavings)}</p>
                  <Wallet className="h-4 w-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <p className="tnum mt-2 text-2xl font-light tracking-[-0.03em] text-ink">
                  {formatPrice(savedTotal)}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{copy(COPY.savingsSource)}</p>
                <div className="mt-4">
                  <Progress
                    value={savedThisMonth}
                    max={Math.max(savedTotal, savedThisMonth, 1)}
                    label={copy(COPY.monthShare)}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                  <span className="text-muted">{copy(COPY.thisMonth)}</span>
                  <span className="tnum font-medium text-ink-soft">{formatPrice(savedThisMonth)}</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                <p className="text-xs font-medium text-ink">{copy(COPY.recentSavings)}</p>
                <span className="tnum text-[11px] text-muted">{formatNumber(recentSavings.length)}</span>
              </div>
              {recentSavings.length ? (
                <div className="divide-y divide-line">
                  {recentSavings.map((entry, index) => (
                    <div key={`${entry.medicine}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-ink" title={entry.medicine}>
                          {entry.medicine}
                        </p>
                        <p className="mt-0.5 tnum text-[11px] text-muted">{timeAgo(entry.date, lang)}</p>
                      </div>
                      <p className="tnum flex-shrink-0 text-xs font-medium text-success">
                        -{formatPrice(entry.saved)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-[11px] text-muted">{copy(COPY.noRecentSavings)}</p>
              )}
            </Card>
          </aside>
        </div>
      </Container>
    </div>
  );
}
