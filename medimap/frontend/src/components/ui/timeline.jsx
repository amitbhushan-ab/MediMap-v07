// src/components/ui/timeline.jsx — dated milestones on a single rail
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { EASE, viewport } from '../../lib/motion';

export function Timeline({ items = [], className }) {
  return (
    <ol className={cn('relative space-y-8', className)}>
      <span
        aria-hidden="true"
        className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-line to-transparent"
      />
      {items.map((item, index) => (
        <motion.li
          key={`${item.date || item.year}-${index}`}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.55, delay: index * 0.08, ease: EASE }}
          className="relative pl-8"
        >
          <span
            aria-hidden="true"
            className="absolute left-0 top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-accent/40 bg-canvas"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          {item.date || item.year ? (
            <div className="tnum text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              {item.date || item.year}
            </div>
          ) : null}
          <h3 className="mt-1 text-[15px] font-medium tracking-[-0.015em] text-ink">{item.title}</h3>
          {item.description && (
            <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted">{item.description}</p>
          )}
          {item.children}
        </motion.li>
      ))}
    </ol>
  );
}
