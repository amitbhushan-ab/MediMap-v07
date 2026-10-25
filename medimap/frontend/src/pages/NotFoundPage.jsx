// src/pages/NotFoundPage.jsx — unmatched route
import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Search } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { pick } from '../lib/format';
import { Button } from '../components/ui/button';
import { Container } from '../components/ui/section';
import { GridPattern } from '../components/ui/grid-pattern';
import { SpotlightBeams } from '../components/ui/spotlight-beams';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';

const COPY = {
  eyebrow: { en: 'Error 404', hi: 'त्रुटि 404' },
  title: { en: 'This page is not on the shelf.', hi: 'यह पेज उपलब्ध नहीं है।' },
  body: {
    en: 'The address you followed does not match a MediMap page. Check the link, or start again from the search bar.',
    hi: 'आपका लिंक किसी मेडीमैप पेज से मेल नहीं खाता। लिंक जाँचें या खोज से शुरू करें।',
  },
  search: { en: 'Compare medicine prices', hi: 'दवा की कीमतें देखें' },
  home: { en: 'Back to home', hi: 'होम पर लौटें' },
  links: { en: 'Popular pages', hi: 'लोकप्रिय पेज' },
};

const SHORTCUTS = [
  { to: '/results?q=Paracetamol%20500mg', label: { en: 'Price comparison', hi: 'कीमत तुलना' } },
  { to: '/map', label: { en: 'Pharmacy map', hi: 'फार्मेसी मैप' } },
  { to: '/scan', label: { en: 'Scan a prescription', hi: 'पर्ची स्कैन करें' } },
  { to: '/about', label: { en: 'How the pilot works', hi: 'पायलट कैसे काम करता है' } },
];

export default function NotFoundPage() {
  const { lang } = useLang();
  const t = (value) => pick(lang, value);

  return (
    <div className="relative isolate overflow-hidden bg-canvas pb-20 pt-24 text-ink sm:pt-28">
      <GridPattern className="text-ink/[0.06]" />
      <SpotlightBeams className="opacity-70" />

      <Container className="relative z-10">
        <p className="eyebrow">
          <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
          {t(COPY.eyebrow)}
        </p>

        <h1 className="display-1 mt-4 max-w-2xl text-ink">
          <TextGenerateEffect as="span" words={t(COPY.title)} />
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">{t(COPY.body)}</p>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <Button to="/results?q=Paracetamol%20500mg">
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t(COPY.search)}
          </Button>
          <Button to="/" variant="secondary">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {t(COPY.home)}
          </Button>
        </div>

        <div className="mt-14 border-t border-line pt-6">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
            <Compass className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            {t(COPY.links)}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group flex items-center justify-between gap-3 rounded-field border border-line bg-surface px-3.5 py-3 text-xs text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
                >
                  {t(item.label)}
                  <ArrowLeft
                    className="h-3.5 w-3.5 rotate-180 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </div>
  );
}
