// frontend/src/pages/MediPoints.jsx — points, vouchers, and the checks behind them
import { useEffect, useState } from 'react';
import { ArrowRight, Check, Coins, ReceiptText } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { formatNumber, pick } from '../lib/format';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { CardSpotlight } from '../components/ui/card-spotlight';
import { DottedGlow } from '../components/ui/dotted-glow';
import { DirectionHoverCard } from '../components/ui/direction-hover';
import { EmptyState } from '../components/ui/empty-state';
import { NumberTicker } from '../components/ui/number-ticker';
import { Progress } from '../components/ui/progress';
import { Container, PageHeader } from '../components/ui/section';
import { Skeleton } from '../components/ui/skeleton';
import { Timeline } from '../components/ui/timeline';
import { API_BASE } from '../lib/api';

const POINTS_API = `${API_BASE}/points`;

const TIERS = [
  { tier: 1, points: 500, discount: 20, code: 'MEDI20', descEn: '20% off the benchmark price at partner pharmacies', descHi: 'पार्टनर फार्मेसियों पर 20% छूट' },
  { tier: 2, points: 1000, discount: 30, code: 'MEDI30', descEn: '30% off the benchmark price at partner pharmacies', descHi: 'पार्टनर फार्मेसियों पर 30% छूट' },
  { tier: 3, points: 2000, discount: 50, code: 'MEDI50', descEn: '50% off the benchmark price at partner pharmacies', descHi: 'पार्टनर फार्मेसियों पर 50% छूट', special: true },
];

const CHECK_STEPS = [
  {
    title: { en: 'A bill with a printed price', hi: 'छपी हुई कीमत वाला बिल' },
    detail: {
      en: 'Checked against the catalog price for that pack.',
      hi: 'उसी पैक की कैटलॉग कीमत से मिलाया जाता है।',
    },
    points: '+20',
  },
  {
    title: { en: 'A stock confirmation', hi: 'स्टॉक की पुष्टि' },
    detail: {
      en: 'Checked against other reports for the same counter.',
      hi: 'उसी काउंटर की दूसरी रिपोर्टों से मिलाया जाता है।',
    },
    points: '+10',
  },
  {
    title: { en: 'A review of a pharmacy', hi: 'फार्मेसी की समीक्षा' },
    detail: { en: 'Checked after your visit.', hi: 'आपकी विज़िट के बाद जाँची जाती है।' },
    points: '+5',
  },
];

const COPY = {
  eyebrow: { en: 'Points', hi: 'पॉइंट्स' },
  title: { en: 'MediPoints', hi: 'मेडीपॉइंट्स' },
  lead: {
    en: 'Upload a pharmacy bill to confirm a price. Verified receipts earn points.',
    hi: 'कीमत की पुष्टि के लिए फार्मेसी का बिल अपलोड करें। सत्यापित रसीदों पर पॉइंट्स मिलते हैं।',
  },
  submitBill: { en: 'Submit a bill', hi: 'बिल जमा करें' },
  balance: { en: 'Current balance', hi: 'मौजूदा पॉइंट्स' },
  pointsUnit: { en: 'points', hi: 'पॉइंट्स' },
  tier: { en: 'Tier', hi: 'टियर' },
  voucher: { en: 'voucher', hi: 'कूपन' },
  noTier: { en: 'No tier yet', hi: 'अभी कोई टियर नहीं' },
  toNextTier: { en: 'To the next tier', hi: 'अगले टियर तक' },
  topTierReached: {
    en: 'This is the highest tier. Any voucher below can still be redeemed.',
    hi: 'यह सबसे ऊपर का टियर है। नीचे कोई भी कूपन भुनाया जा सकता है।',
  },
  tierListTitle: { en: 'Tiers', hi: 'टियर' },
  tierListNote: { en: 'Points needed for each voucher.', hi: 'हर कूपन के लिए ज़रूरी पॉइंट्स।' },
  current: { en: 'Current', hi: 'अभी' },
  topTier: { en: 'Top tier', hi: 'सबसे ऊपर का टियर' },
  redeemTitle: { en: 'Redeem a voucher', hi: 'कूपन भुनाएं' },
  redeem: { en: 'Redeem', hi: 'भुनाएं' },
  moreNeeded: { en: 'more needed', hi: 'और चाहिए' },
  activeVouchers: { en: 'Active vouchers', hi: 'सक्रिय कूपन' },
  noVouchers: {
    en: 'No vouchers yet. Redeem one with your points.',
    hi: 'अभी कोई कूपन नहीं। पॉइंट्स से एक कूपन भुनाएं।',
  },
  expires: { en: 'Expires', hi: 'समाप्ति' },
  historyTitle: { en: 'Points history', hi: 'पॉइंट्स का इतिहास' },
  emptyHistoryTitle: { en: 'No points yet', hi: 'अभी कोई पॉइंट नहीं' },
  emptyHistoryBody: {
    en: 'Submit a bill from a pharmacy. Once the price is checked, the points appear here.',
    hi: 'फार्मेसी का बिल जमा करें। कीमत जाँचने के बाद पॉइंट्स यहाँ दिखेंगे।',
  },
  howChecked: { en: 'How points are checked', hi: 'पॉइंट्स की जाँच कैसे होती है' },
  loadError: {
    en: 'Points could not be loaded. Check the connection and reload the page.',
    hi: 'पॉइंट्स लोड नहीं हो सके। कनेक्शन देखकर पेज फिर खोलें।',
  },
  signInTitle: { en: 'Sign in to see your points', hi: 'पॉइंट्स देखने के लिए लॉग इन करें' },
  signInBody: {
    en: 'Points, vouchers and receipts are kept with your account.',
    hi: 'पॉइंट्स, कूपन और रसीदें आपके खाते के साथ रहती हैं।',
  },
  signIn: { en: 'Sign in', hi: 'लॉग इन करें' },
  earned: { en: 'Points earned', hi: 'पॉइंट्स मिले' },
  redeemed: { en: 'Voucher redeemed', hi: 'कूपन भुनाया' },
};

export default function MediPoints() {
  const { lang } = useLang();
  const copy = (pair) => pick(lang, pair);
  const user = JSON.parse(localStorage.getItem('medimap_user') || 'null');
  const userId = user?.email || 'anonymous';
  const [data, setData] = useState({ points: 0, transactions: [], coupons: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [redeeming, setRedeeming] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchPoints() {
    try {
      const res = await fetch(`${POINTS_API}/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  useEffect(() => { fetchPoints(); }, []);

  async function redeem(tier) {
    setRedeeming(tier);
    try {
      const res = await fetch(`${POINTS_API}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData((prev) => ({ ...prev, points: d.remainingPoints, coupons: [...(prev.coupons || []), d.coupon] }));
      showToast(lang === 'hi' ? `कूपन ${d.coupon.code} सक्रिय है।` : `Coupon ${d.coupon.code} is active.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setRedeeming(null);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-canvas pb-16 text-ink">
        <Container className="py-10">
          <EmptyState
            icon={Coins}
            title={copy(COPY.signInTitle)}
            description={copy(COPY.signInBody)}
            action={
              <Button to="/login">
                {copy(COPY.signIn)}
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </Button>
            }
            className="mx-auto max-w-md"
          />
        </Container>
      </div>
    );
  }

  const points = Number(data.points) || 0;
  const currentTier = TIERS.filter((tier) => points >= tier.points).pop() || null;
  const nextTier = TIERS.find((tier) => points < tier.points);
  const pointsToNext = nextTier ? nextTier.points - points : 0;
  const transactions = Array.isArray(data.transactions) ? data.transactions : [];
  const coupons = Array.isArray(data.coupons) ? data.coupons : [];
  const tierName = currentTier
    ? `${copy(COPY.tier)} ${formatNumber(currentTier.tier)} · ${formatNumber(currentTier.discount)}% ${copy(COPY.voucher)}`
    : copy(COPY.noTier);
  const nextTierText = nextTier
    ? lang === 'hi'
      ? `${formatNumber(pointsToNext)} पॉइंट्स और चाहिए ${formatNumber(nextTier.discount)}% कूपन के लिए`
      : `${formatNumber(pointsToNext)} more points for the ${formatNumber(nextTier.discount)}% voucher`
    : '';

  const historyItems = transactions.map((tx) => {
    const date = tx.createdAt ? new Date(tx.createdAt) : null;
    const hasDate = date && !Number.isNaN(date.getTime());
    const amount = Number(tx.points);
    const title = tx.reason || (tx.type === 'redeem' ? copy(COPY.redeemed) : copy(COPY.earned));
    return {
      date: hasDate
        ? date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '',
      title,
      description: `${amount > 0 ? '+' : ''}${formatNumber(amount)} ${copy(COPY.pointsUnit)}${tx.refId ? ` · ${tx.refId}` : ''}`,
    };
  });

  return (
    <div className="bg-canvas pb-16 text-ink">
      <PageHeader
        eyebrow={copy(COPY.eyebrow)}
        title={copy(COPY.title)}
        description={copy(COPY.lead)}
        actions={
          <Button to="/submit-price">
            {copy(COPY.submitBill)}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        }
      />

      <Container className="space-y-4 py-8 sm:space-y-5 sm:py-10">
        {toast && (
          <p
            role="status"
            className={`rounded-card border px-3.5 py-2.5 text-xs font-medium ${
              toast.type === 'error'
                ? 'border-danger/25 bg-danger/10 text-danger'
                : 'border-success/25 bg-success/10 text-success'
            }`}
          >
            {toast.msg}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-card border border-danger/25 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
            {copy(COPY.loadError)}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* Balance */}
          <CardSpotlight className="p-5 sm:p-6">
            <DottedGlow className="opacity-50" radius={240} />
            <p className="relative text-[11px] text-muted">{copy(COPY.balance)}</p>
            <div className="mt-2 flex items-end gap-2">
              {loading ? (
                <Skeleton className="h-12 w-40" />
              ) : error ? (
                <span className="display-1 block text-muted">—</span>
              ) : (
                <NumberTicker value={points} className="display-1 block text-ink" />
              )}
              <span className="pb-1.5 text-xs text-muted">{copy(COPY.pointsUnit)}</span>
            </div>
            <div className="mt-1 min-h-[18px]">
              {loading ? (
                <Skeleton className="h-3 w-32" />
              ) : error ? null : (
                <p className="text-xs text-muted">{tierName}</p>
              )}
            </div>

            {loading ? (
              <div className="mt-5 border-t border-line pt-4">
                <Skeleton className="h-4 w-full" />
              </div>
            ) : error ? null : nextTier ? (
              <div className="mt-5 border-t border-line pt-4">
                <Progress value={points} max={nextTier.points} label={copy(COPY.toNextTier)} />
                <p className="mt-2 text-[11px] text-muted">{nextTierText}</p>
              </div>
            ) : (
              <p className="mt-5 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
                {copy(COPY.topTierReached)}
              </p>
            )}
          </CardSpotlight>

          {/* How points are checked */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-xs font-medium text-ink">{copy(COPY.howChecked)}</h2>
            <ul className="mt-3 space-y-3">
              {CHECK_STEPS.map((step) => (
                <li key={step.points} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                    <Check className="h-2.5 w-2.5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ink">
                      {copy(step.title)}
                      <span className="tnum ml-1.5 text-[11px] font-normal text-muted">
                        {step.points} {copy(COPY.pointsUnit)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{copy(step.detail)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Tier comparison */}
        <section aria-labelledby="medi-points-tiers" className="space-y-2.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="medi-points-tiers" className="text-xs font-medium text-ink">
              {copy(COPY.tierListTitle)}
            </h2>
            <p className="text-[11px] text-muted">{copy(COPY.tierListNote)}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {TIERS.map((tier) => {
              const isCurrent = currentTier?.tier === tier.tier;
              return (
                <DirectionHoverCard
                  key={tier.tier}
                  className={isCurrent ? 'border-accent/60' : undefined}
                  overlay={
                    <span className="flex items-center justify-between">
                      <span>
                        {formatNumber(tier.points)} {copy(COPY.pointsUnit)}
                      </span>
                      <span className="tnum font-medium text-ink">
                        {formatNumber(tier.discount)}% {copy(COPY.voucher)}
                      </span>
                    </span>
                  }
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-medium text-muted">
                        {copy(COPY.tier)} {formatNumber(tier.tier)}
                      </p>
                      {isCurrent ? (
                        <Badge tone="accent">{copy(COPY.current)}</Badge>
                      ) : tier.special ? (
                        <Badge tone="neutral">{copy(COPY.topTier)}</Badge>
                      ) : null}
                    </div>
                    <p className="tnum mt-2 text-sm font-medium text-ink">
                      {formatNumber(tier.discount)}% {copy(COPY.voucher)}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted">
                      {lang === 'hi' ? tier.descHi : tier.descEn}
                    </p>
                  </div>
                </DirectionHoverCard>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {/* Redemption */}
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="text-xs font-medium text-ink">{copy(COPY.redeemTitle)}</h2>
              <span className="tnum text-[11px] text-muted">
                {formatNumber(points)} {copy(COPY.pointsUnit)}
              </span>
            </div>
            <div className="divide-y divide-line">
              {TIERS.map((tier) => {
                const canRedeem = points >= tier.points;
                const missing = tier.points - points;
                return (
                  <div key={tier.tier} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="tnum text-xs font-medium text-ink">
                          {formatNumber(tier.discount)}% {copy(COPY.voucher)}
                        </p>
                        <code className="rounded-full border border-line bg-raised px-2 py-0.5 font-mono text-[10px] tracking-wide text-accent-ink">
                          {tier.code}
                        </code>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                        {lang === 'hi' ? tier.descHi : tier.descEn}
                      </p>
                      <p className="tnum mt-1 text-[11px] text-muted">
                        {formatNumber(tier.points)} {copy(COPY.pointsUnit)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={canRedeem ? 'primary' : 'secondary'}
                      disabled={!canRedeem}
                      loading={redeeming === tier.tier}
                      onClick={() => canRedeem && redeem(tier.tier)}
                    >
                      {canRedeem
                        ? copy(COPY.redeem)
                        : `${formatNumber(missing)} ${copy(COPY.moreNeeded)}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Active vouchers */}
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="text-xs font-medium text-ink">{copy(COPY.activeVouchers)}</h2>
              <span className="tnum text-[11px] text-muted">{formatNumber(coupons.length)}</span>
            </div>
            {loading ? (
              <div className="space-y-2 px-4 py-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : coupons.length ? (
              <div className="divide-y divide-line">
                {coupons.map((coupon, index) => (
                  <div key={coupon.id || coupon.code || index} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="tnum text-xs font-medium text-ink">
                        {formatNumber(coupon.discount)}% {copy(COPY.voucher)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {copy(COPY.expires)}{' '}
                        {new Date(coupon.expiresAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                      </p>
                    </div>
                    <code className="flex-shrink-0 rounded-full border border-line bg-raised px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-accent-ink">
                      {coupon.code}
                    </code>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-center text-[11px] text-muted">{copy(COPY.noVouchers)}</p>
            )}
          </Card>
        </div>

        {/* Points history */}
        {loading ? (
          <Card>
            <div className="border-b border-line px-4 py-3">
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-3 px-4 py-4">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={copy(COPY.emptyHistoryTitle)}
            description={copy(COPY.emptyHistoryBody)}
            action={
              <Button to="/submit-price" size="sm">
                {copy(COPY.submitBill)}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </Button>
            }
          />
        ) : (
          <Card>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <h2 className="text-xs font-medium text-ink">{copy(COPY.historyTitle)}</h2>
              <span className="tnum text-[11px] text-muted">{formatNumber(transactions.length)}</span>
            </div>
            <div className="px-4 py-5">
              <Timeline items={historyItems} />
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}
