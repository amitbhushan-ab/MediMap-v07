// src/components/ui/sticky-scroll-reveal.jsx — text stays, panels change
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { EASE } from '../../lib/motion';

export function StickyScrollReveal({ items = [], className, panelClassName }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div className={cn('grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]', className)}>
      <div className="lg:sticky lg:top-28 lg:h-fit">
        <div className={cn('rounded-panel border border-line bg-surface p-6 shadow-card sm:p-8', panelClassName)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <div className="eyebrow mb-3">
                <span className="tnum text-accent">{String(active + 1).padStart(2, '0')}</span>
                <span className="h-px w-5 bg-line" aria-hidden="true" />
                {items.length} sections
              </div>
              <h3 className="display-2 text-ink">{current?.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{current?.description}</p>
              {current?.points?.length ? (
                <ul className="mt-5 space-y-2.5">
                  {current.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-xs text-ink-soft">
                      <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
              {current?.content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActive(index)}
            className={cn(
              'block w-full rounded-card border p-5 text-left transition-[border-color,background-color] duration-200',
              active === index
                ? 'border-accent/35 bg-accent/[0.04]'
                : 'border-line bg-surface hover:border-line-strong/70',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-ink">{item.title}</span>
              <span className="tnum text-[11px] text-muted">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.summary || item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
