// src/components/ui/layout-grid.jsx — Aceternity Layout Grid, adapted to MediMap tokens
// Click a tile and it lifts out of the grid into a focused panel. Escape closes it.
import { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LayoutGrid({ cards, className, columns = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  const [openId, setOpenId] = useState(null);
  const selected = cards.find((card) => card.id === openId) || null;
  const layoutKey = useId().replace(/:/g, '');

  useEffect(() => {
    if (!selected) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setOpenId(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <div className={cn('relative', className)}>
      <div className={cn('grid grid-cols-1 gap-3', columns)}>
        {cards.map((card) => (
          <motion.button
            type="button"
            key={card.id}
            layoutId={`tile-${layoutKey}-${card.id}`}
            onClick={() => setOpenId(card.id)}
            whileHover={{ y: -3 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={cn(
              'group/tile relative flex min-h-[164px] flex-col justify-between overflow-hidden rounded-card border border-line bg-surface p-5 text-left transition-colors hover:border-accent/40',
              card.className,
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tile:opacity-100 [background:radial-gradient(120%_100%_at_0%_0%,rgb(var(--accent)/0.07),transparent_60%)]" />
            {card.visual && <div className="relative mb-4">{card.visual}</div>}
            <div className="relative mt-auto">
              <h3 className="text-sm font-medium text-ink">{card.title}</h3>
              {card.description && (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{card.description}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenId(null)}
              className="absolute inset-0 bg-navy/55 backdrop-blur-sm"
            />
            <motion.div
              layoutId={`tile-${layoutKey}-${selected.id}`}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              role="dialog"
              aria-modal="true"
              aria-label={selected.title}
              className="relative z-10 max-h-[86vh] w-full max-w-lg overflow-auto rounded-panel border border-line bg-surface p-6 shadow-float"
            >
              <button
                type="button"
                onClick={() => setOpenId(null)}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-raised hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
              >
                {selected.detail || (
                  <>
                    <h3 className="display-3 pr-10 text-ink">{selected.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">{selected.description}</p>
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
