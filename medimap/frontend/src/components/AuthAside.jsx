// src/components/AuthAside.jsx — the left panel shared by sign in and sign up
import { Check, MapPin, Clock3 } from 'lucide-react';
import Logo from './Logo';
import { DottedGlow } from './ui/dotted-glow';
import { Lamp } from './ui/lamp';
import { Spotlight } from './ui/spotlight';

const SAMPLE = [
  { name: 'Jan Aushadhi Kendra', area: 'NSUT Gate 1', price: '₹12' },
  { name: 'MedPlus', area: 'DDA Market', price: '₹18' },
  { name: 'Apollo Pharmacy', area: 'Sector 14 Metro', price: '₹25' },
];

export default function AuthAside({ accountLabel, statement, bullets = [], place }) {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-raised/25 px-10 py-10 lg:flex xl:px-14">
      <DottedGlow className="opacity-70" radius={260} />
      <Lamp width="34rem" height="18rem" className="opacity-80" />
      <Spotlight className="-right-40 -top-40 opacity-60" opacity={0.1} />

      <div className="relative z-10 flex items-center justify-between">
        <Logo size={30} textSize="text-[16px]" />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          Dwarka pilot
        </span>
      </div>

      <div className="relative z-10 max-w-[24rem]">
        <p className="eyebrow">
          <span className="h-px w-5 bg-accent/60" aria-hidden="true" />
          {accountLabel}
        </p>
        <p className="display-2 mt-3 text-ink">{statement}</p>

        <ul className="mt-7 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" strokeWidth={1.75} aria-hidden="true" />
              <span className="min-w-0">{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 overflow-hidden rounded-card border border-line bg-surface/90 shadow-card backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">Sample comparison</p>
            <span className="tnum text-[11px] font-medium text-ink">₹12–25</span>
          </div>
          <ul className="divide-y divide-line">
            {SAMPLE.map((row, index) => (
              <li key={row.name} className="flex items-center justify-between gap-3 px-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-medium text-ink">{row.name}</span>
                  <span className="block text-[10px] text-muted">{row.area}</span>
                </span>
                <span className={`tnum text-[11px] font-medium ${index === 0 ? 'text-accent-ink' : 'text-ink-soft'}`}>
                  {row.price}
                </span>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 border-t border-line px-4 py-2 text-[10px] text-muted">
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            Stock confirmed 12 min ago
          </p>
        </div>
      </div>

      <p className="relative z-10 flex items-center gap-1.5 text-[11px] text-muted">
        <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        {place}
      </p>
    </aside>
  );
}
