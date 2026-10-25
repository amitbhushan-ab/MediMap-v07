// src/components/Footer.jsx — one footer for the whole product
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { FOOTER_GROUPS, SITE } from '../lib/content';
import { pick } from '../lib/format';
import Logo from './Logo';
import { Container } from './ui/section';
import { TextHoverEffect } from './ui/text-hover-effect';

export default function Footer() {
  const { lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-surface">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div className="max-w-xs">
            <Logo size={28} textSize="text-[15px]" />
            <p className="mt-4 text-xs leading-relaxed text-muted">{pick(lang, SITE.description)}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              {pick(lang, SITE.pilot)}
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={pick(lang, group.title)} aria-label={pick(lang, group.title)}>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                {pick(lang, group.title)}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.to + pick(lang, link.label)}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-xs text-ink-soft transition-colors hover:text-accent"
                    >
                      {pick(lang, link.label)}
                      <ArrowUpRight
                        className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 hidden border-t border-line pt-6 md:block">
          <TextHoverEffect text="MediMap" className="h-24 opacity-70" />
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 text-[11px] leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">© {year} MediMap · Built in Dwarka, Delhi</p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-success" strokeWidth={1.75} aria-hidden="true" />
            Prices are community-verified. Confirm stock at the counter.
          </p>
        </div>
      </Container>
    </footer>
  );
}
