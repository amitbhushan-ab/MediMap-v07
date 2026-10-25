// frontend/src/components/PharmacyCard.jsx — one pharmacy result row
import {
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  Navigation,
  Star,
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { formatDistance, formatNumber, formatPrice, timeAgo } from '../lib/format';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { GlowingEffect } from './ui/glowing-effect';
import { Skeleton } from './ui/skeleton';

const COPY = {
  lowest: { en: 'Lowest price', hi: 'सबसे कम कीमत' },
  verified: { en: 'Verified', hi: 'सत्यापित' },
  saved: { en: 'Saved price', hi: 'सहेजा दाम' },
  savedAt: { en: 'Saved', hi: 'सहेजा गया' },
};

export default function PharmacyCard({ result, isSelected, onClick, rank }) {
  const { lang, t } = useLang();
  const { pharmacy, medicine, price, inStock, distance, isCheapest, lastUpdated, fromPharmacist, fromCache, cachedAt } =
    result;

  const copy = (pair) => pair[lang] || pair.en;

  function updatedLabel(value) {
    const ago = timeAgo(value, lang);
    if (!ago) return '';
    return lang === 'hi' ? `${ago} अपडेट हुआ` : `Updated ${ago.toLowerCase()}`;
  }

  const badges = [
    isCheapest && { key: 'lowest', tone: 'accent', label: copy(COPY.lowest) },
    fromCache && {
      key: 'saved',
      tone: 'neutral',
      label: copy(COPY.saved),
      title: `${copy(COPY.savedAt)} ${timeAgo(cachedAt, lang).toLowerCase()}`,
      icon: <Clock3 className="h-3 w-3 text-muted" strokeWidth={1.75} aria-hidden="true" />,
    },
    fromPharmacist && {
      key: 'verified',
      tone: 'neutral',
      label: copy(COPY.verified),
      icon: <Check className="h-3 w-3 text-success" strokeWidth={1.75} aria-hidden="true" />,
    },
    pharmacy?.isPremium && {
      key: 'pro',
      tone: 'warning',
      label: 'Pro',
      icon: <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />,
    },
  ]
    .filter(Boolean)
    .slice(0, 3);

  // The card stays a plain container: it holds real links, and an interactive
  // role here would make those links unreachable for some screen readers.
  // Clicking the body still selects the row in the split view.
  return (
    <div
      data-selected={isSelected || undefined}
      onClick={onClick}
      className={cn(
        'group/card relative flex h-full min-w-0 cursor-pointer flex-col rounded-card border p-4 text-left transition-[border-color,box-shadow,background-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        isSelected
          ? 'border-accent/60 bg-surface'
          : 'border-line bg-surface hover:-translate-y-px hover:border-line-strong/80 hover:shadow-card',
      )}
    >
      <GlowingEffect disabled={!isSelected} spread={30} proximity={0} borderWidth={1} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              'tnum flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-medium',
              rank === 1
                ? 'border-accent/25 bg-accent/10 text-accent-ink'
                : 'border-line bg-raised text-muted',
            )}
          >
            <span className="sr-only">{lang === 'hi' ? 'रैंक' : 'Rank'} </span>
            {rank}
          </span>

          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium leading-snug text-ink" title={pharmacy?.name}>
              {pharmacy?.name}
            </h3>
            <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] leading-relaxed text-muted">
              <MapPin className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate" title={pharmacy?.address}>
                {pharmacy?.address}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <p
            className={cn(
              'tnum text-lg font-medium leading-none tracking-[-0.02em]',
              isCheapest ? 'text-accent-ink' : 'text-ink',
            )}
          >
            {formatPrice(price)}
          </p>
          <span
            className={cn('text-[10px]', isCheapest ? 'text-accent' : 'text-muted')}
          >
            per strip
          </span>
        </div>
      </div>

      <div className="mb-3 mt-2.5 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
            inStock ? 'text-success' : 'text-danger'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          {inStock ? t('inStock') : t('outOfStock')}
        </span>
        {badges.map((badge) => (
          <Badge key={badge.key} tone={badge.tone} title={badge.title}>
            {badge.icon}
            {badge.label}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <Navigation className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="tnum text-ink-soft">{formatDistance(distance, lang)}</span>
          </span>

          {pharmacy?.rating ? (
            <span className="inline-flex items-center gap-1">
              <Star
                className="h-3 w-3 flex-shrink-0 text-warning"
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
              <span className="tnum text-ink-soft">{formatNumber(pharmacy.rating)}</span>
              {pharmacy.reviewCount > 0 && (
                <span className="tnum">({formatNumber(pharmacy.reviewCount)})</span>
              )}
            </span>
          ) : null}

          {lastUpdated && updatedLabel(lastUpdated) && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3 flex-shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{updatedLabel(lastUpdated)}</span>
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            href={`https://maps.google.com/?q=${encodeURIComponent(pharmacy?.address || '')}`}
            target="_blank"
            rel="noreferrer"
            aria-label={`${t('getDirections') || 'Directions'} — ${pharmacy?.name || ''}`}
            onClick={(event) => event.stopPropagation()}
            className="px-3 text-xs"
          >
            <Navigation className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {t('getDirections') || 'Directions'}
          </Button>

          {inStock && (
            <Button
              size="md"
              to={`/pharmacy/${pharmacy?._id}?medicine=${encodeURIComponent(medicine?.name || '')}&price=${price}`}
              aria-label={`${t('viewDetails') || 'Details'} — ${pharmacy?.name || ''}`}
              onClick={(event) => event.stopPropagation()}
              className="px-3 text-xs"
            >
              {t('viewDetails') || 'Details'}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton loading card ──────────────────────────────────────
export function PharmacyCardSkeleton() {
  return (
    <div className="h-full rounded-card border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Skeleton className="h-6 w-6 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 flex-shrink-0" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  );
}
