// src/lib/format.js — formatting helpers shared by every surface

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ₹1,240 — never a bare number for money. */
export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return inr.format(n);
}

export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Keeps one decimal below 10 km, rounds above it. */
export function formatDistance(km, lang = 'en') {
  const n = Number(km);
  if (!Number.isFinite(n)) return lang === 'hi' ? 'दूरी अज्ञात' : 'Distance unknown';
  const value = n < 10 ? n.toFixed(1) : String(Math.round(n));
  return `${value} ${lang === 'hi' ? 'किमी' : 'km'}`;
}

export function timeAgo(date, lang = 'en') {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(diff) || diff < 0) return '';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return lang === 'hi' ? 'अभी' : 'Just now';
  if (minutes < 60) return lang === 'hi' ? `${minutes} मिनट पहले` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === 'hi' ? `${hours} घंटे पहले` : `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return lang === 'hi' ? `${days} दिन पहले` : `${days} d ago`;
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase() || 'MM';
}

/** Pick the right side of a { en, hi } pair. */
export function pick(lang, pair) {
  if (!pair) return '';
  if (typeof pair === 'string') return pair;
  return pair[lang] || pair.en || '';
}
