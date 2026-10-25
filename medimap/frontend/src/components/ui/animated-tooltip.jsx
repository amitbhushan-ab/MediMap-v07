// src/components/ui/animated-tooltip.jsx — team credits on hover
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function AnimatedTooltip({ items = [], className }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className={cn('flex items-center', className)}>
      {items.map((item, index) => (
        <div
          key={item.id || item.name || index}
          className="group relative -ml-2 first:ml-0"
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(index)}
          onBlur={() => setHovered(null)}
          tabIndex={0}
        >
          <span
            className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-canvas bg-raised text-[11px] font-medium text-ink-soft transition-transform duration-200 group-hover:-translate-y-1 group-focus:-translate-y-1"
            aria-hidden="true"
          >
            {item.image ? (
              <img src={item.image} alt="" className="h-full w-full rounded-full object-cover" loading="lazy" />
            ) : (
              item.initials || item.name?.slice(0, 2).toUpperCase()
            )}
          </span>
          <AnimatePresence>
            {hovered === index && (
              <motion.div
                role="tooltip"
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.96 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[200px] -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 shadow-lift"
              >
                <span className="block text-[11px] font-medium text-ink">{item.name}</span>
                {item.designation && (
                  <span className="block text-[10px] text-muted">{item.designation}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
